#!/usr/bin/env node
/**
 * Search Wikipedia for game titles and output results
 * Usage: node scripts/sync-missing-titles-and-covers.mjs "Game Title 1" "Game Title 2" ...
 * Or: node scripts/sync-missing-titles-and-covers.mjs --file titles.txt
 */

import fs from 'fs';
import {
  fetchWikipediaGamesList,
  WIKIPEDIA_GAME_GENRES
} from '../backend/lib/wiki-games-provider.js';

// Helper functions
function normalizeTitleKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(value) {
  return normalizeTitleKey(value).split(/\s+/).filter(Boolean);
}

function toHttpsUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("//")) return `https:${text}`;
  if (/^http:\/\//i.test(text)) return text.replace(/^http:\/\//i, "https://");
  return text;
}

function scoreSearchMatch(existingTitle, candidate) {
  const candidateTitle = String(candidate?.title || candidate?.name || '').trim();
  const candidateKey = normalizeTitleKey(candidateTitle);
  if (!candidateKey) return Number.NEGATIVE_INFINITY;
  const existingKey = normalizeTitleKey(existingTitle);
  if (!existingKey) return Number.NEGATIVE_INFINITY;

  let score = 0;
  if (candidateKey === existingKey) score += 1000;
  if (candidateKey.startsWith(existingKey) || existingKey.startsWith(candidateKey)) score += 400;

  const existingTerms = titleTokens(existingTitle);
  const candidateTerms = titleTokens(candidateTitle);
  const overlap = existingTerms.filter((term) => candidateTerms.includes(term)).length;
  score += overlap * 30;

  const existingYear = String(existingTitle).match(/\b(19|20)\d{2}\b/)?.[0] || '';
  const candidateYear = String(candidate?.release_date || candidate?.released || '').slice(0, 4);
  if (existingYear && candidateYear && existingYear === candidateYear) score += 60;

  return score;
}

async function searchWikipediaForGame(title) {
  try {
    const payload = await fetchWikipediaGamesList({
      page: 1,
      pageSize: 8,
      search: title,
      titleOnly: false,
      spotlight: false
    });
    const rows = Array.isArray(payload?.results) ? payload.results : [];
    const ranked = rows
      .map((row) => ({ row, score: scoreSearchMatch(title, row) }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score >= 120)
      .sort((a, b) => b.score - a.score);
    const best = ranked[0]?.row;
    if (!best) return null;

    return {
      searchTitle: title,
      matchedTitle: String(best?.title || best?.name || '').trim(),
      cover_url: toHttpsUrl(best?.cover || best?.cover_url || best?.image || ''),
      description: String(best?.description || '').trim(),
      release_date: String(best?.released || best?.release_date || '').trim(),
      matchScore: ranked[0]?.score || 0
    };
  } catch (error) {
    console.error(`Error searching for "${title}":`, error.message);
    return null;
  }
}

function parseArg(flag, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const titles = [];
  
  // Check if titles are provided as command line arguments
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  if (args.length > 0) {
    titles.push(...args);
  }
  
  // Check if titles are provided via file
  const fileArg = parseArg('--file', '');
  if (fileArg) {
    try {
      const fileContent = fs.readFileSync(fileArg, 'utf8');
      const fileTitles = fileContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      titles.push(...fileTitles);
    } catch (error) {
      console.error(`Error reading file "${fileArg}":`, error.message);
      process.exit(1);
    }
  }
  
  if (titles.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/sync-missing-titles-and-covers.mjs "Game Title 1" "Game Title 2" ...');
    console.log('  node scripts/sync-missing-titles-and-covers.mjs --file titles.txt');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/sync-missing-titles-and-covers.mjs "Subnautica 2" "Elden Ring"');
    process.exit(0);
  }
  
  console.log(`Searching Wikipedia for ${titles.length} game titles...\n`);
  
  const results = [];
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    console.log(`[${i + 1}/${titles.length}] Searching for: "${title}"`);
    const result = await searchWikipediaForGame(title);
    if (result) {
      console.log(`  ✓ Found: "${result.matchedTitle}" (score: ${result.matchScore})`);
      results.push(result);
    } else {
      console.log(`  ✗ No match found`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Found ${results.length} matches out of ${titles.length} titles`);
  console.log('='.repeat(60));
  
  // Output results as JSON
  const outputPath = parseArg('--output', 'wikipedia-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  
  // Print summary
  console.log('\nSummary:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.matchedTitle}`);
    console.log(`   Cover: ${result.cover_url || 'N/A'}`);
    console.log(`   Description: ${result.description?.substring(0, 100) || 'N/A'}...`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
