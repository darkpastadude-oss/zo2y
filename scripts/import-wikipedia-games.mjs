#!/usr/bin/env node
/**
 * Import popular games from Wikipedia into Supabase database
 * This script fetches games from the POPULAR_GAME_TITLE_SEEDS list in wiki-games-provider.js
 * and upserts them into the public.games table using the upsert_game_catalog function.
 */

import { createClient } from '@supabase/supabase-js';
import {
  POPULAR_GAME_TITLE_SEEDS,
  fetchSummary,
  fetchEntities,
  labelMapForEntities,
  mapGenres,
  inferGenresFromText,
  mapPlatforms,
  mapCompanies,
  extractReleaseDate,
  normalizeGameKey,
  toHttpsUrl,
  isExcludedTitle,
  normalizeTitle,
  claimEntityIds,
  isVideoGameEntity,
  pickLabel
} from '../backend/lib/wiki-games-provider.js';

// Supabase configuration - read from environment or use defaults
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required.');
  console.error('Set them in your .env file or pass them as environment variables.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Map Wikipedia game data to Supabase games table format
 */
function mapWikipediaGameToSupabase(summary, entity, labels, infoboxCover = '') {
  const pageid = Number(summary?.pageid || 0);
  if (pageid <= 0) return null;

  const title = String(summary?.title || '').trim();
  if (!title || isExcludedTitle(title)) return null;

  const description = String(summary?.description || summary?.extract || '').trim();
  const cover = toHttpsUrl(infoboxCover || summary?.originalimage?.source || summary?.thumbnail?.source || '');
  
  const qid = String(summary?.wikibase_item || '').trim();
  const mappedGenres = qid && entity ? mapGenres(entity, labels) : [];
  const inferredGenres = inferGenresFromText(`${title} ${description}`);
  
  // Merge genres, removing duplicates
  const genres = [];
  const seenGenreSlugs = new Set();
  [...mappedGenres, ...inferredGenres].forEach((genre) => {
    const slug = String(genre?.slug || '').trim().toLowerCase();
    if (!slug || seenGenreSlugs.has(slug)) return;
    seenGenreSlugs.add(slug);
    genres.push(genre);
  });

  const releaseDate = qid && entity ? extractReleaseDate(entity, description) : extractYearFallback(description);
  const platforms = qid && entity ? mapPlatforms(entity, labels) : [];
  const developers = qid && entity ? mapCompanies(entity, 'P178', labels) : [];
  const publishers = qid && entity ? mapCompanies(entity, 'P123', labels) : [];

  // Build extra JSONB field
  const extra = {
    genres: genres.map(g => ({ id: g.id, name: g.name, slug: g.slug })),
    platforms: platforms.map(p => ({ name: p.platform.name })),
    developers: developers.map(d => ({ name: d.name })),
    publishers: publishers.map(p => ({ name: p.name })),
    wikidata_qid: qid,
    wikipedia_pageid: pageid
  };

  return {
    id: pageid,
    source: 'wikipedia',
    slug: normalizeGameKey(title).replace(/\s+/g, '-'),
    title,
    description,
    cover_url: cover,
    hero_url: cover,
    release_date: releaseDate,
    rating: null,
    rating_count: 0,
    extra
  };
}

function extractYearFallback(text) {
  const match = String(text || '').match(/\b(19|20)\d{2}\b/);
  return match ? `${match[0]}-01-01` : '';
}

/**
 * Fetch and enrich a single game from Wikipedia
 */
async function fetchAndEnrichGame(title) {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle || isExcludedTitle(normalizedTitle)) {
    return null;
  }

  try {
    const summary = await fetchSummary(normalizedTitle);
    if (!summary || summary.type === 'disambiguation') {
      return null;
    }

    const qid = String(summary?.wikibase_item || '').trim();
    if (!qid) {
      // No Wikidata ID, use basic summary
      return mapWikipediaGameToSupabase(summary, null, new Map(), '');
    }

    // Fetch entity data from Wikidata
    const entities = await fetchEntities([qid], 'claims|labels');
    const entity = entities.get(qid);
    
    if (!entity) {
      return mapWikipediaGameToSupabase(summary, null, new Map(), '');
    }

    // Check if it's actually a video game
    if (!isVideoGameEntity(entity)) {
      const description = String(summary?.description || summary?.extract || '').toLowerCase();
      if (!description.includes('video game')) {
        return null;
      }
    }

    // Fetch related entity labels
    const linked = new Set();
    ['P136', 'P400', 'P178', 'P123'].forEach((prop) => {
      claimEntityIds(entity, prop).forEach((id) => linked.add(id));
    });
    const labels = await labelMapForEntities([...linked]);

    return mapWikipediaGameToSupabase(summary, entity, labels, '');

  } catch (error) {
    console.error(`Error fetching game "${title}":`, error.message);
    return null;
  }
}

/**
 * Upsert a game into Supabase
 */
async function upsertGameToSupabase(gameData) {
  if (!gameData) return { success: false, error: 'No game data' };

  try {
    const { data, error } = await supabase.rpc('upsert_game_catalog', {
      p_id: gameData.id,
      p_title: gameData.title,
      p_description: gameData.description,
      p_cover_url: gameData.cover_url,
      p_release_date: gameData.release_date,
      p_rating: gameData.rating,
      p_rating_count: gameData.rating_count,
      p_source: gameData.source,
      p_slug: gameData.slug,
      p_hero_url: gameData.hero_url,
      p_extra: gameData.extra
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Main import function
 */
async function importPopularGames() {
  console.log(`Starting import of ${POPULAR_GAME_TITLE_SEEDS.length} popular games from Wikipedia...`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process games in batches to avoid overwhelming the APIs
  const batchSize = 5;
  for (let i = 0; i < POPULAR_GAME_TITLE_SEEDS.length; i += batchSize) {
    const batch = POPULAR_GAME_TITLE_SEEDS.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(POPULAR_GAME_TITLE_SEEDS.length / batchSize)}...`);

    for (const title of batch) {
      process.stdout.write(`  Fetching "${title}"... `);
      
      const gameData = await fetchAndEnrichGame(title);
      
      if (!gameData) {
        process.stdout.write('SKIPPED (not a video game or not found)\n');
        skipCount++;
        continue;
      }

      const result = await upsertGameToSupabase(gameData);
      
      if (result.success) {
        process.stdout.write('SUCCESS\n');
        successCount++;
      } else {
        process.stdout.write(`ERROR: ${result.error}\n`);
        errorCount++;
        errors.push({ title, error: result.error });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Import complete!');
  console.log(`Total games processed: ${POPULAR_GAME_TITLE_SEEDS.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(({ title, error }) => {
      console.log(`  - "${title}": ${error}`);
    });
  }

  console.log('='.repeat(60));
}

// Run the import
importPopularGames().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
