# ⚡ VoltMap — National eBike Shop Directory

> Carbon-fiber-themed, city-by-city eBike shop directory covering all 50 states.  
> Built to ingest Apify JSON scrapes, display GMB-style listing cards, and monetize via Google Ads, Amazon Associates, and Sponsor placements.

---

## 🗂️ Project Structure

```
voltmap/
├── public/                    # Static assets (favicon, og-image, etc.)
├── data/
│   ├── states/                # One JSON per state (e.g. california.json)
│   │   ├── california.json
│   │   ├── texas.json
│   │   └── ... (50 states)
│   └── sample/
│       └── listing-schema.json   # Reference schema for scraped data
├── scripts/
│   ├── import-apify.js        # Normalize + import Apify JSON → state files
│   ├── generate-pages.js      # Build static HTML for each city
│   └── validate-listings.js   # Check schema compliance, flag missing fields
├── src/
│   ├── components/
│   │   ├── ListingCard.html   # GMB-style card template
│   │   ├── AdUnit.html        # Ad placement templates (Google, Amazon, Sponsor)
│   │   ├── Header.html        # Sticky header
│   │   ├── Sidebar.html       # Left sidebar (state/filter nav)
│   │   └── RightRail.html     # Right sidebar (ads + sponsor box)
│   ├── pages/
│   │   ├── index.html         # Homepage / national directory
│   │   ├── state.html         # State template (e.g. /california/)
│   │   └── city.html          # City template (e.g. /california/los-angeles/)
│   └── styles/
│       └── voltmap.css        # Core CSS (carbon fiber theme + variables)
├── index.html                 # ✅ Main directory (current working prototype)
├── package.json
├── .gitignore
└── ROADMAP.md
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/internetassets/voltmap.git
cd voltmap

# 2. Install dependencies
npm install

# 3. Drop your Apify JSON files into data/states/
# (Named by state slug: california.json, texas.json, etc.)

# 4. Run the import normalizer
node scripts/import-apify.js

# 5. Validate all listings
node scripts/validate-listings.js

# 6. Generate static city pages
node scripts/generate-pages.js

# 7. Preview locally
npm run dev
```

---

## 📦 Data Format

Each state file (`data/states/california.json`) follows this schema:

```json
{
  "state": "California",
  "state_slug": "california",
  "total": 212,
  "cities": {
    "los-angeles": {
      "name": "Los Angeles",
      "listings": [
        {
          "id": "voltride-la-001",
          "name": "VoltRide LA",
          "slug": "voltride-la",
          "category": ["eBike Retailer", "Service Center"],
          "address": "2847 W Sunset Blvd",
          "city": "Los Angeles",
          "state": "CA",
          "zip": "90026",
          "phone": "(323) 555-0192",
          "website": "https://voltride.la",
          "hours": {
            "mon": "10:00-19:00",
            "tue": "10:00-19:00",
            "wed": "10:00-19:00",
            "thu": "10:00-19:00",
            "fri": "10:00-19:00",
            "sat": "10:00-19:00",
            "sun": "11:00-17:00"
          },
          "rating": 4.9,
          "review_count": 312,
          "brands": ["Rad Power", "Aventon", "Trek"],
          "services": ["Test Rides", "Repairs", "Financing"],
          "verified": true,
          "sponsored": false,
          "status": "active",
          "source": "apify",
          "apify_id": "abc123",
          "last_updated": "2026-03-01"
        }
      ]
    }
  }
}
```

---

## 🔌 Apify Integration

Place raw Apify exports in `data/states/raw/`. The import script normalizes them:

```bash
node scripts/import-apify.js --input data/states/raw/california-raw.json --state california
```

The script handles:
- Field mapping from Apify schema → VoltMap schema
- Deduplication by address + phone
- Missing field flagging
- Slug generation for city/listing URLs

---

## 💰 Ad Placements

| Zone | Format | Network |
|------|--------|---------|
| Top Leaderboard | 728×90 | Google Ads |
| In-feed (every 4 cards) | 300×100 | Google / Amazon |
| Right Rail #1 | 300×250 | Google Ads |
| Right Rail #2 | 300×600 | Google Ads (premium) |
| Right Rail #3 | 300×120 | Amazon Associates |
| Sponsor Spotlight | Custom | Direct sponsors |

Replace `<!-- AD PLACEHOLDER -->` comments in templates with live ad tags.

---

## 🔐 Admin / Login

Admin panel at `/admin/` — password protected.

Features:
- Browse + edit all scraped listings
- Approve / reject / flag listings
- Bulk import new Apify JSON
- Manage sponsored listings + ad zones
- Export city pages for deployment

---

## 🗺️ URL Structure

```
/                              → Homepage (national directory)
/california/                   → State page (all cities in CA)
/california/los-angeles/       → City page
/california/los-angeles/voltride-la/  → Individual listing (future)
/admin/                        → Admin dashboard (protected)
```

---

## 📍 Roadmap

See [ROADMAP.md](./ROADMAP.md) for full feature timeline.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5 + CSS (carbon theme) — zero dependencies for core pages
- **Data pipeline:** Node.js scripts (Apify import + static site generation)
- **Hosting:** Vercel / Netlify (static) or VPS (dynamic)
- **Ads:** Google AdSense, Amazon Associates, direct sponsor HTML
- **Auth:** Simple JWT or Netlify Identity for admin panel

---

Built by [Internet Assets Marketing Agency](https://internetassets.com) — Show Low, AZ
