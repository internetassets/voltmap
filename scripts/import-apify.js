#!/usr/bin/env node
/**
 * VoltMap — Apify Import Script
 * ─────────────────────────────
 * Normalizes raw Apify Google Maps scraper output into VoltMap's canonical JSON schema.
 * 
 * Usage:
 *   node scripts/import-apify.js --input data/states/raw/california-raw.json --state california
 *   node scripts/import-apify.js --all   (processes all files in data/states/raw/)
 * 
 * Apify scraper: https://apify.com/compass/crawler-google-places
 */

const fs = require('fs-extra');
const path = require('path');

// ── State name → slug + code mapping ──────────────────────────────────────────
const STATE_MAP = {
  'alabama': { code: 'AL', name: 'Alabama' },
  'alaska': { code: 'AK', name: 'Alaska' },
  'arizona': { code: 'AZ', name: 'Arizona' },
  'arkansas': { code: 'AR', name: 'Arkansas' },
  'california': { code: 'CA', name: 'California' },
  'colorado': { code: 'CO', name: 'Colorado' },
  'connecticut': { code: 'CT', name: 'Connecticut' },
  'delaware': { code: 'DE', name: 'Delaware' },
  'florida': { code: 'FL', name: 'Florida' },
  'georgia': { code: 'GA', name: 'Georgia' },
  'hawaii': { code: 'HI', name: 'Hawaii' },
  'idaho': { code: 'ID', name: 'Idaho' },
  'illinois': { code: 'IL', name: 'Illinois' },
  'indiana': { code: 'IN', name: 'Indiana' },
  'iowa': { code: 'IA', name: 'Iowa' },
  'kansas': { code: 'KS', name: 'Kansas' },
  'kentucky': { code: 'KY', name: 'Kentucky' },
  'louisiana': { code: 'LA', name: 'Louisiana' },
  'maine': { code: 'ME', name: 'Maine' },
  'maryland': { code: 'MD', name: 'Maryland' },
  'massachusetts': { code: 'MA', name: 'Massachusetts' },
  'michigan': { code: 'MI', name: 'Michigan' },
  'minnesota': { code: 'MN', name: 'Minnesota' },
  'mississippi': { code: 'MS', name: 'Mississippi' },
  'missouri': { code: 'MO', name: 'Missouri' },
  'montana': { code: 'MT', name: 'Montana' },
  'nebraska': { code: 'NE', name: 'Nebraska' },
  'nevada': { code: 'NV', name: 'Nevada' },
  'new-hampshire': { code: 'NH', name: 'New Hampshire' },
  'new-jersey': { code: 'NJ', name: 'New Jersey' },
  'new-mexico': { code: 'NM', name: 'New Mexico' },
  'new-york': { code: 'NY', name: 'New York' },
  'north-carolina': { code: 'NC', name: 'North Carolina' },
  'north-dakota': { code: 'ND', name: 'North Dakota' },
  'ohio': { code: 'OH', name: 'Ohio' },
  'oklahoma': { code: 'OK', name: 'Oklahoma' },
  'oregon': { code: 'OR', name: 'Oregon' },
  'pennsylvania': { code: 'PA', name: 'Pennsylvania' },
  'rhode-island': { code: 'RI', name: 'Rhode Island' },
  'south-carolina': { code: 'SC', name: 'South Carolina' },
  'south-dakota': { code: 'SD', name: 'South Dakota' },
  'tennessee': { code: 'TN', name: 'Tennessee' },
  'texas': { code: 'TX', name: 'Texas' },
  'utah': { code: 'UT', name: 'Utah' },
  'vermont': { code: 'VT', name: 'Vermont' },
  'virginia': { code: 'VA', name: 'Virginia' },
  'washington': { code: 'WA', name: 'Washington' },
  'west-virginia': { code: 'WV', name: 'West Virginia' },
  'wisconsin': { code: 'WI', name: 'Wisconsin' },
  'wyoming': { code: 'WY', name: 'Wyoming' },
};

// ── Slugify helper ─────────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Parse Apify hours format → VoltMap hours ──────────────────────────────────
function parseHours(apifyHours) {
  if (!apifyHours || !Array.isArray(apifyHours)) return {};
  const dayMap = { 'Monday':'mon','Tuesday':'tue','Wednesday':'wed','Thursday':'thu','Friday':'fri','Saturday':'sat','Sunday':'sun' };
  const result = {};
  for (const entry of apifyHours) {
    const day = dayMap[entry.day];
    if (!day) continue;
    if (entry.isClosed) { result[day] = null; continue; }
    result[day] = `${entry.from}-${entry.to}`;
  }
  return result;
}

// ── Parse address components ───────────────────────────────────────────────────
function parseAddress(apifyRecord) {
  // Apify Google Places returns: street, city, state, zip, country separately
  return {
    address: apifyRecord.street || apifyRecord.address || '',
    city: apifyRecord.city || apifyRecord.neighborhood || '',
    state_code: apifyRecord.state || '',
    zip: apifyRecord.postalCode || apifyRecord.zip || '',
  };
}

// ── Normalize a single Apify record ───────────────────────────────────────────
function normalizeRecord(raw, stateSlug) {
  const stateInfo = STATE_MAP[stateSlug] || {};
  const addr = parseAddress(raw);
  const citySlug = slugify(addr.city || raw.city || 'unknown');
  const nameSlug = slugify(raw.title || raw.name || 'unknown');
  
  return {
    id: `${nameSlug}-${raw.placeId ? raw.placeId.slice(-6) : Math.random().toString(36).slice(2,8)}`,
    name: raw.title || raw.name || '',
    slug: nameSlug,
    category: raw.categoryName ? [raw.categoryName] : (raw.categories || []),
    address: addr.address,
    city: addr.city || raw.city || '',
    city_slug: citySlug,
    state: stateInfo.code || addr.state_code || '',
    state_name: stateInfo.name || '',
    zip: addr.zip,
    phone: raw.phone || raw.phoneUnformatted || '',
    website: raw.website || raw.url || '',
    hours: parseHours(raw.openingHours),
    rating: raw.totalScore || raw.rating || null,
    review_count: raw.reviewsCount || raw.reviewCount || 0,
    brands: [],          // Not in Apify — populate manually or via second pass
    services: [],        // Same — enrich via admin panel
    description: raw.description || raw.text || '',
    verified: false,
    sponsored: false,
    featured: false,
    status: 'pending',   // All imports start as pending for review
    tier: 'free',
    source: 'apify',
    apify_id: raw.placeId || raw.id || '',
    place_id: raw.placeId || '',
    last_updated: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };
}

// ── Deduplicate by apify_id + phone ───────────────────────────────────────────
function deduplicate(listings) {
  const seen = new Set();
  return listings.filter(l => {
    const key = l.apify_id || `${l.phone}-${l.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Group listings by city ─────────────────────────────────────────────────────
function groupByCity(listings) {
  const cities = {};
  for (const listing of listings) {
    const slug = listing.city_slug || slugify(listing.city);
    if (!cities[slug]) {
      cities[slug] = {
        name: listing.city,
        slug,
        total: 0,
        listings: [],
      };
    }
    cities[slug].listings.push(listing);
    cities[slug].total++;
  }
  return cities;
}

// ── Main import function ───────────────────────────────────────────────────────
async function importState(inputFile, stateSlug) {
  console.log(`\n📥 Importing: ${inputFile} → ${stateSlug}`);
  
  const raw = await fs.readJson(inputFile);
  const records = Array.isArray(raw) ? raw : raw.items || raw.results || [];
  
  console.log(`   Found ${records.length} raw records`);
  
  const normalized = records.map(r => normalizeRecord(r, stateSlug));
  const deduped = deduplicate(normalized);
  
  console.log(`   After dedup: ${deduped.length} listings`);
  
  const stateInfo = STATE_MAP[stateSlug] || { name: stateSlug, code: '' };
  const cities = groupByCity(deduped);
  
  const output = {
    state: stateInfo.name,
    state_slug: stateSlug,
    state_code: stateInfo.code,
    total: deduped.length,
    last_updated: new Date().toISOString().split('T')[0],
    cities,
  };
  
  const outPath = path.join(__dirname, '..', 'data', 'states', `${stateSlug}.json`);
  await fs.outputJson(outPath, output, { spaces: 2 });
  
  console.log(`   ✅ Written to ${outPath}`);
  console.log(`   Cities: ${Object.keys(cities).join(', ')}`);
  
  return output;
}

// ── CLI entry ──────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    const rawDir = path.join(__dirname, '..', 'data', 'states', 'raw');
    if (!await fs.pathExists(rawDir)) {
      console.error('❌ No raw/ directory found. Create data/states/raw/ and add Apify JSON files.');
      process.exit(1);
    }
    const files = await fs.readdir(rawDir);
    for (const file of files.filter(f => f.endsWith('.json'))) {
      const stateSlug = file.replace('-raw.json', '').replace('.json', '');
      await importState(path.join(rawDir, file), stateSlug);
    }
  } else {
    const inputIdx = args.indexOf('--input');
    const stateIdx = args.indexOf('--state');
    if (inputIdx === -1 || stateIdx === -1) {
      console.log('Usage:');
      console.log('  node scripts/import-apify.js --input data/states/raw/california-raw.json --state california');
      console.log('  node scripts/import-apify.js --all');
      process.exit(0);
    }
    await importState(args[inputIdx + 1], args[stateIdx + 1]);
  }
  
  console.log('\n🎉 Import complete!');
}

main().catch(console.error);
