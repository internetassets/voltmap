#!/usr/bin/env node
/**
 * VoltMap — Listing Validator
 * ─────────────────────────────
 * Scans all state JSON files and reports missing fields, bad data, duplicates.
 * 
 * Usage: node scripts/validate-listings.js
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const REQUIRED_FIELDS = ['id', 'name', 'address', 'city', 'state', 'zip'];
const WARN_FIELDS = ['phone', 'website', 'rating', 'hours'];

async function validate() {
  const stateDir = path.join(__dirname, '..', 'data', 'states');
  const files = glob.sync(`${stateDir}/*.json`);
  
  let totalListings = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const allIds = new Set();
  
  console.log(`\n🔍 VoltMap Listing Validator`);
  console.log(`   Scanning ${files.length} state files...\n`);
  
  for (const file of files) {
    const stateData = await fs.readJson(file);
    const stateName = stateData.state;
    let stateErrors = 0;
    let stateWarnings = 0;
    let stateListings = 0;
    
    for (const [citySlug, city] of Object.entries(stateData.cities || {})) {
      for (const listing of city.listings || []) {
        stateListings++;
        totalListings++;
        
        // Check for duplicate IDs across states
        if (allIds.has(listing.id)) {
          console.log(`  ❌ DUPLICATE ID: ${listing.id} (${stateName} / ${city.name})`);
          stateErrors++;
        }
        allIds.add(listing.id);
        
        // Required fields
        for (const field of REQUIRED_FIELDS) {
          if (!listing[field]) {
            console.log(`  ❌ MISSING required: ${field} → "${listing.name}" (${stateName})`);
            stateErrors++;
          }
        }
        
        // Warnings
        for (const field of WARN_FIELDS) {
          if (!listing[field]) {
            stateWarnings++;
          }
        }
        
        // Rating range
        if (listing.rating && (listing.rating < 0 || listing.rating > 5)) {
          console.log(`  ⚠️  BAD RATING: ${listing.rating} → "${listing.name}"`);
          stateErrors++;
        }
      }
    }
    
    const status = stateErrors > 0 ? '❌' : stateWarnings > 3 ? '⚠️ ' : '✅';
    console.log(`${status} ${stateName.padEnd(25)} ${String(stateListings).padStart(4)} listings | ${stateErrors} errors | ${stateWarnings} warnings`);
    
    totalErrors += stateErrors;
    totalWarnings += stateWarnings;
  }
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 Total: ${totalListings} listings | ${totalErrors} errors | ${totalWarnings} warnings`);
  
  if (totalErrors === 0) {
    console.log('\n✅ All listings valid! Ready to generate pages.\n');
  } else {
    console.log(`\n❌ Fix ${totalErrors} errors before generating pages.\n`);
    process.exit(1);
  }
}

validate().catch(console.error);
