#!/usr/bin/env node
/**
 * VoltMap — Static Page Generator
 * ─────────────────────────────────
 * Reads all state JSON files and generates:
 *   /dist/index.html           → National homepage
 *   /dist/{state}/index.html   → State page
 *   /dist/{state}/{city}/index.html → City page
 *   /dist/sitemap.xml          → Full sitemap
 * 
 * Usage: node scripts/generate-pages.js
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const DIST = path.join(__dirname, '..', 'dist');
const TEMPLATE = path.join(__dirname, '..', 'src', 'pages');
const BASE_URL = 'https://voltmap.com'; // Update with your domain

// ── Star rating HTML ───────────────────────────────────────────────────────────
function starsHtml(rating) {
  if (!rating) return '';
  const full = Math.floor(rating);
  const empty = 5 - Math.ceil(rating);
  return '★'.repeat(full) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(empty);
}

// ── Hours: check if currently open ────────────────────────────────────────────
function getOpenStatus(hours) {
  if (!hours || Object.keys(hours).length === 0) return null;
  const days = ['sun','mon','tue','wed','thu','fri','sat'];
  const now = new Date();
  const day = days[now.getDay()];
  const timeStr = hours[day];
  if (!timeStr) return 'closed';
  const [open, close] = timeStr.split('-');
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const openMins = oh * 60 + (om || 0);
  const closeMins = ch * 60 + (cm || 0);
  return (currentMins >= openMins && currentMins < closeMins) ? 'open' : 'closed';
}

// ── Single listing card HTML ───────────────────────────────────────────────────
function listingCardHtml(listing) {
  const sponsored = listing.sponsored ? 'sponsored' : '';
  const sponsoredTag = listing.sponsored ? '<span class="sponsored-tag">Sponsored</span>' : '';
  const verifiedIcon = listing.verified ? '<span class="verified-icon" title="Verified">✓</span>' : '';
  const isNew = listing.tier === 'free' && !listing.verified ? '<span class="new-badge">NEW</span>' : '';
  const openBadge = '<span class="open-badge">Open now</span>'; // Dynamic in JS
  
  const brands = (listing.brands || []).slice(0, 3).map(b => `<span class="tag highlight">${b}</span>`).join('');
  const services = (listing.services || []).slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('');
  
  return `
<div class="listing-card ${sponsored}" data-id="${listing.id}" data-hours='${JSON.stringify(listing.hours || {})}'>
  <div class="card-top">
    <div class="card-identity">
      <div class="card-biz-name">
        ${listing.name}
        ${verifiedIcon}
        ${isNew}
        <span class="open-status"></span>
        ${sponsoredTag}
      </div>
      <div class="card-category">
        ${(listing.category || []).join(' <span class="cat-dot"></span> ')}
        <span class="cat-dot"></span>
        <span>${listing.city}, ${listing.state}</span>
      </div>
    </div>
  </div>
  ${listing.rating ? `
  <div class="rating-row">
    <span class="rating-num">${listing.rating.toFixed(1)}</span>
    <div class="stars">${'<span class="star">★</span>'.repeat(Math.round(listing.rating))}</div>
    <span class="review-count">(${listing.review_count?.toLocaleString() || 0} reviews)</span>
  </div>` : ''}
  <div class="card-meta">
    <span class="meta-item"><span class="meta-icon">📍</span>${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}</span>
    ${listing.phone ? `<span class="meta-item"><span class="meta-icon">📞</span>${listing.phone}</span>` : ''}
  </div>
  ${brands || services ? `<div class="card-tags">${brands}${services}</div>` : ''}
  <div class="card-actions">
    ${listing.website ? `<a href="${listing.website}" class="action-btn primary" target="_blank" rel="noopener">Website →</a>` : ''}
    ${listing.phone ? `<a href="tel:${listing.phone}" class="action-btn">📞 Call</a>` : ''}
    <a href="https://maps.google.com/?q=${encodeURIComponent(listing.address + ' ' + listing.city + ' ' + listing.state)}" class="action-btn" target="_blank">📍 Directions</a>
  </div>
</div>`;
}

// ── Generate city page ─────────────────────────────────────────────────────────
async function generateCityPage(stateData, citySlug, city) {
  const outDir = path.join(DIST, stateData.state_slug, citySlug);
  await fs.ensureDir(outDir);
  
  const listings = city.listings || [];
  const sponsored = listings.filter(l => l.sponsored);
  const regular = listings.filter(l => !l.sponsored);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>eBike Shops in ${city.name}, ${stateData.state} — VoltMap</title>
<meta name="description" content="Find ${city.total} eBike shops, dealers, and service centers in ${city.name}, ${stateData.state}. Compare ratings, hours, and brands.">
<link rel="canonical" href="${BASE_URL}/${stateData.state_slug}/${citySlug}/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${BASE_URL}/src/styles/voltmap.css">
<!-- Schema.org LocalBusiness JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "eBike Shops in ${city.name}, ${stateData.state}",
  "numberOfItems": ${city.total},
  "itemListElement": [
    ${listings.slice(0, 10).map((l, i) => `{
      "@type": "ListItem",
      "position": ${i + 1},
      "item": {
        "@type": "LocalBusiness",
        "name": "${l.name}",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "${l.address}",
          "addressLocality": "${l.city}",
          "addressRegion": "${l.state}",
          "postalCode": "${l.zip}"
        }
        ${l.phone ? `,"telephone": "${l.phone}"` : ''}
        ${l.website ? `,"url": "${l.website}"` : ''}
        ${l.rating ? `,"aggregateRating": {"@type":"AggregateRating","ratingValue":"${l.rating}","reviewCount":"${l.review_count}"}` : ''}
      }
    }`).join(',')}
  ]
}
</script>
</head>
<body>
<!-- Header injected by JS or build step -->
<div style="padding:20px; max-width:900px; margin:0 auto;">
  <div class="breadcrumb">
    <a href="/">VoltMap</a> › 
    <a href="/${stateData.state_slug}/">${stateData.state}</a> › 
    <span>${city.name}</span>
  </div>
  <h1 style="font-family:'Rajdhani',sans-serif; font-size:28px; margin-bottom:4px;">
    eBike Shops in <span style="color:var(--volt)">${city.name}</span>
  </h1>
  <p style="color:var(--steel); margin-bottom:20px;">${city.total} listings · ${stateData.state}</p>
  
  <!-- AD: Leaderboard -->
  <!-- VOLTMAP_AD:leaderboard -->
  
  ${sponsored.map(l => listingCardHtml(l)).join('\n')}
  ${regular.map((l, i) => (i > 0 && i % 4 === 0 ? '<!-- VOLTMAP_AD:infeed -->' : '') + listingCardHtml(l)).join('\n')}
</div>
<script src="/src/styles/voltmap.js"></script>
</body>
</html>`;
  
  await fs.writeFile(path.join(outDir, 'index.html'), html);
}

// ── Generate state index page ──────────────────────────────────────────────────
async function generateStatePage(stateData) {
  const outDir = path.join(DIST, stateData.state_slug);
  await fs.ensureDir(outDir);
  
  const cities = Object.values(stateData.cities || {}).sort((a, b) => b.total - a.total);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>eBike Shops in ${stateData.state} — VoltMap Directory</title>
<meta name="description" content="Browse ${stateData.total} eBike shops across ${Object.keys(stateData.cities).length} cities in ${stateData.state}. Find dealers, service centers, and rental shops near you.">
<link rel="canonical" href="${BASE_URL}/${stateData.state_slug}/">
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${BASE_URL}/src/styles/voltmap.css">
</head>
<body>
<div style="padding:20px; max-width:1000px; margin:0 auto;">
  <div class="breadcrumb"><a href="/">VoltMap</a> › <span>${stateData.state}</span></div>
  <h1 style="font-family:'Rajdhani',sans-serif; font-size:32px; margin-bottom:4px;">
    eBike Shops in <span style="color:var(--volt)">${stateData.state}</span>
  </h1>
  <p style="color:var(--steel); margin-bottom:24px;">${stateData.total} shops across ${cities.length} cities</p>
  
  <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap:10px;">
    ${cities.map(c => `
    <a href="/${stateData.state_slug}/${c.slug}/" style="
      display:block; padding:14px 16px;
      background:var(--carbon-light); border:1px solid var(--carbon-border);
      border-radius:9px; text-decoration:none; transition:all 0.15s;
    " onmouseover="this.style.borderColor='var(--volt)'" onmouseout="this.style.borderColor='var(--carbon-border)'">
      <div style="font-family:'Rajdhani',sans-serif; font-size:16px; font-weight:600; color:var(--white);">${c.name}</div>
      <div style="font-size:12px; color:var(--steel); margin-top:2px;">${c.total} shop${c.total !== 1 ? 's' : ''}</div>
    </a>`).join('')}
  </div>
</div>
<script src="/src/styles/voltmap.js"></script>
</body>
</html>`;
  
  await fs.writeFile(path.join(outDir, 'index.html'), html);
}

// ── Main build ─────────────────────────────────────────────────────────────────
async function build() {
  console.log('\n🏗️  VoltMap Static Site Generator');
  await fs.ensureDir(DIST);
  
  const stateFiles = glob.sync(path.join(__dirname, '..', 'data', 'states', '*.json'));
  
  let totalPages = 0;
  const sitemapUrls = [`${BASE_URL}/`];
  
  for (const file of stateFiles) {
    const stateData = await fs.readJson(file);
    console.log(`\n📍 ${stateData.state} (${Object.keys(stateData.cities || {}).length} cities)`);
    
    await generateStatePage(stateData);
    sitemapUrls.push(`${BASE_URL}/${stateData.state_slug}/`);
    totalPages++;
    
    for (const [citySlug, city] of Object.entries(stateData.cities || {})) {
      await generateCityPage(stateData, citySlug, city);
      sitemapUrls.push(`${BASE_URL}/${stateData.state_slug}/${citySlug}/`);
      totalPages++;
      process.stdout.write('.');
    }
  }
  
  // Sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${url}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
  
  // robots.txt
  await fs.writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`);
  
  console.log(`\n\n✅ Generated ${totalPages} pages + sitemap.xml`);
  console.log(`   Output: ${DIST}`);
}

build().catch(console.error);
