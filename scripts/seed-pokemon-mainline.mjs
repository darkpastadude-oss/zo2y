import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
dotenv.config({ path: "backend/.env", override: true });

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const MANUAL_ID_OFFSET = 6_100_000_000_000;

const POKEMON_MAINLINE = [
  { title: "Pokémon Red", slug: "pokemon-red-mainline", release_date: "1996-02-27", generation: 1 },
  { title: "Pokémon Blue", slug: "pokemon-blue-mainline", release_date: "1996-10-15", generation: 1 },
  { title: "Pokémon Yellow", slug: "pokemon-yellow-mainline", release_date: "1998-09-12", generation: 1 },
  { title: "Pokémon Gold", slug: "pokemon-gold-mainline", release_date: "1999-11-21", generation: 2 },
  { title: "Pokémon Silver", slug: "pokemon-silver-mainline", release_date: "1999-11-21", generation: 2 },
  { title: "Pokémon Crystal", slug: "pokemon-crystal-mainline", release_date: "2000-12-14", generation: 2 },
  { title: "Pokémon Ruby", slug: "pokemon-ruby-mainline", release_date: "2002-11-21", generation: 3 },
  { title: "Pokémon Sapphire", slug: "pokemon-sapphire-mainline", release_date: "2002-11-21", generation: 3 },
  { title: "Pokémon Emerald", slug: "pokemon-emerald-mainline", release_date: "2004-09-16", generation: 3 },
  { title: "Pokémon FireRed", slug: "pokemon-firered-mainline", release_date: "2004-01-29", generation: 3, remake_of: "Pokémon Red" },
  { title: "Pokémon LeafGreen", slug: "pokemon-leafgreen-mainline", release_date: "2004-01-29", generation: 3, remake_of: "Pokémon Blue" },
  { title: "Pokémon Diamond", slug: "pokemon-diamond-mainline", release_date: "2006-09-28", generation: 4 },
  { title: "Pokémon Pearl", slug: "pokemon-pearl-mainline", release_date: "2006-09-28", generation: 4 },
  { title: "Pokémon Platinum", slug: "pokemon-platinum-mainline", release_date: "2008-09-13", generation: 4 },
  { title: "Pokémon HeartGold", slug: "pokemon-heartgold-mainline", release_date: "2009-09-12", generation: 4, remake_of: "Pokémon Gold" },
  { title: "Pokémon SoulSilver", slug: "pokemon-soulsilver-mainline", release_date: "2009-09-12", generation: 4, remake_of: "Pokémon Silver" },
  { title: "Pokémon Black", slug: "pokemon-black-mainline", release_date: "2010-09-18", generation: 5 },
  { title: "Pokémon White", slug: "pokemon-white-mainline", release_date: "2010-09-18", generation: 5 },
  { title: "Pokémon Black 2", slug: "pokemon-black-2-mainline", release_date: "2012-06-23", generation: 5 },
  { title: "Pokémon White 2", slug: "pokemon-white-2-mainline", release_date: "2012-06-23", generation: 5 },
  { title: "Pokémon X", slug: "pokemon-x-mainline", release_date: "2013-10-12", generation: 6 },
  { title: "Pokémon Y", slug: "pokemon-y-mainline", release_date: "2013-10-12", generation: 6 },
  { title: "Pokémon Omega Ruby", slug: "pokemon-omega-ruby-mainline", release_date: "2014-11-21", generation: 6, remake_of: "Pokémon Ruby" },
  { title: "Pokémon Alpha Sapphire", slug: "pokemon-alpha-sapphire-mainline", release_date: "2014-11-21", generation: 6, remake_of: "Pokémon Sapphire" },
  { title: "Pokémon Sun", slug: "pokemon-sun-mainline", release_date: "2016-11-18", generation: 7 },
  { title: "Pokémon Moon", slug: "pokemon-moon-mainline", release_date: "2016-11-18", generation: 7 },
  { title: "Pokémon Ultra Sun", slug: "pokemon-ultra-sun-mainline", release_date: "2017-11-17", generation: 7 },
  { title: "Pokémon Ultra Moon", slug: "pokemon-ultra-moon-mainline", release_date: "2017-11-17", generation: 7 },
  { title: "Pokémon Let's Go Pikachu", slug: "pokemon-lets-go-pikachu-mainline", release_date: "2018-11-16", generation: 7, remake_of: "Pokémon Yellow" },
  { title: "Pokémon Let's Go Eevee", slug: "pokemon-lets-go-eevee-mainline", release_date: "2018-11-16", generation: 7, remake_of: "Pokémon Yellow" },
  { title: "Pokémon Sword", slug: "pokemon-sword-mainline", release_date: "2019-11-15", generation: 8 },
  { title: "Pokémon Shield", slug: "pokemon-shield-mainline", release_date: "2019-11-15", generation: 8 },
  { title: "Pokémon Brilliant Diamond", slug: "pokemon-brilliant-diamond-mainline", release_date: "2021-11-19", generation: 8, remake_of: "Pokémon Diamond" },
  { title: "Pokémon Shining Pearl", slug: "pokemon-shining-pearl-mainline", release_date: "2021-11-19", generation: 8, remake_of: "Pokémon Pearl" },
  { title: "Pokémon Legends: Arceus", slug: "pokemon-legends-arceus-mainline", release_date: "2022-01-28", generation: 8 },
  { title: "Pokémon Scarlet", slug: "pokemon-scarlet-mainline", release_date: "2022-11-18", generation: 9 },
  { title: "Pokémon Violet", slug: "pokemon-violet-mainline", release_date: "2022-11-18", generation: 9 }
];

function buildExtra(entry) {
  return {
    franchise: "pokemon",
    subfranchise: "mainline",
    generation: entry.generation,
    remake_of: entry.remake_of || null,
    official_cover_is_poster: false,
    seeded_locally: true,
    seed_origin: "pokemon-mainline-manual"
  };
}

function slugToManualId(slug) {
  let hash = 0;
  const text = String(slug || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash * 31) + text.charCodeAt(index)) % 1_000_000_000;
  }
  return MANUAL_ID_OFFSET + hash;
}

async function seedOne(entry) {
  const { data: existing, error: lookupError } = await supabase
    .from("games")
    .select("id,title,slug")
    .or(`title.eq.${entry.title},slug.eq.${entry.slug}`)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing?.id) {
    const payload = {
      title: entry.title,
      slug: entry.slug,
      release_date: entry.release_date,
      source: "manual",
      extra: {
        ...(existing.extra || {}),
        ...buildExtra(entry)
      }
    };
    const { error } = await supabase.from("games").update(payload).eq("id", existing.id);
    if (error) throw error;
    return { action: "updated", title: entry.title };
  }

  const payload = {
    id: slugToManualId(entry.slug),
    source: "manual",
    igdb_id: null,
    rawg_id: null,
    slug: entry.slug,
    title: entry.title,
    description: "",
    cover_url: null,
    hero_url: null,
    release_date: entry.release_date,
    rating: null,
    rating_count: 0,
    extra: buildExtra(entry)
  };

  const { error } = await supabase.from("games").insert(payload);
  if (error) throw error;
  return { action: "inserted", title: entry.title };
}

async function main() {
  let inserted = 0;
  let updated = 0;
  for (const entry of POKEMON_MAINLINE) {
    const result = await seedOne(entry);
    if (result.action === "inserted") inserted += 1;
    if (result.action === "updated") updated += 1;
    console.log(`${result.action}: ${result.title}`);
  }
  console.log(`Done. inserted=${inserted} updated=${updated}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
