# VoltMap — Build Roadmap

## ✅ Phase 1 — Foundation (DONE)
- [x] Carbon fiber UI design system
- [x] GMB-style listing card component
- [x] 3-column layout: state nav | listings feed | ad rail
- [x] Ad placeholder zones (Google, Amazon, Sponsor)
- [x] Login modal
- [x] Filter chips (category, brand, rating)
- [x] City section grouping
- [x] Sponsored listing style
- [x] Open/closed/new badges

## 🔄 Phase 2 — Data Pipeline (NEXT)
- [ ] Define canonical JSON schema (listing-schema.json)
- [ ] Write import-apify.js normalizer
- [ ] Process all 50 state Apify JSON files
- [ ] Generate one state JSON per state in data/states/
- [ ] validate-listings.js for QA
- [ ] Deduplication logic

## 🏗️ Phase 3 — Static Site Generation
- [ ] generate-pages.js → builds /state/city/ HTML pages
- [ ] State index pages (all cities listed)
- [ ] City pages (all shops in city)
- [ ] Sitemap.xml generation
- [ ] robots.txt
- [ ] Meta tags / OG tags per page (SEO)

## 🎛️ Phase 4 — Admin Dashboard
- [ ] /admin/ route (password protected)
- [ ] Listing table with search/filter
- [ ] Edit listing form (inline from scraped data)
- [ ] Approve / reject / flag / sponsor toggle
- [ ] Bulk import UI for new Apify JSON drops
- [ ] Ad zone manager

## 💰 Phase 5 — Monetization
- [ ] Google AdSense integration (replace placeholders)
- [ ] Amazon Associates product widgets
- [ ] Sponsor listing upgrade flow
- [ ] Stripe for paid listing tiers (Basic / Featured / Sponsored)

## 🔍 Phase 6 — SEO & Performance
- [ ] Schema.org LocalBusiness JSON-LD per listing
- [ ] Canonical URLs
- [ ] Image optimization (if any added)
- [ ] Core Web Vitals audit
- [ ] Google Search Console setup
- [ ] Backlink strategy (ebike forums, local sites)

## 📱 Phase 7 — Mobile & UX Polish
- [ ] Mobile-responsive layout
- [ ] Collapsible sidebar for mobile
- [ ] Infinite scroll or pagination
- [ ] Search autocomplete (city/state)
- [ ] User reviews (future)

## 🌐 Phase 8 — Deployment
- [ ] Vercel / VPS deployment
- [ ] Custom domain (voltmap.com?)
- [ ] CDN + caching headers
- [ ] Environment variables for ad keys
- [ ] Monitoring / uptime alerts
