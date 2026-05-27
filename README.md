# MixStake 🎰

> A fake casino & sportsbook platform, fully wired to Mixpanel — built for iGaming and sports betting demos.

**Live site:** https://mixstake.onrender.com  
**Admin panel:** https://mixstake.onrender.com/admin  
**Mixpanel project:** https://mixpanel.com/project/4026110

---

## What is this?

MixStake is the iGaming equivalent of [Fixpanel](https://mixpanel.github.io/fixpanel) — a realistic demo environment for Mixpanel SEs, AEs, CSAs and AMs to demonstrate Mixpanel capabilities to casino and sports betting prospects.

The site simulates a real iGaming operator with two verticals:
- **Casino** — slots, live dealer tables, jackpot games
- **Sportsbook** — pre-match and in-play betting on football, basketball, tennis and more

Everything is wired to Mixpanel out of the box. No setup needed — just open the link.

---

## What it demonstrates

### Analytics
- Full iGaming event taxonomy: deposits, bets, game rounds, KYC, withdrawals, responsible gambling, VIP upgrades
- UTM attribution across 16 realistic acquisition channels (Google CPC, Facebook, affiliates, email, organic, referral)
- Pre-built dashboards: GGR, ARPU, player activation funnel, D7/D30 retention, game performance, revenue by segment
- Advanced iGaming metrics using aggregated properties (deposit amount distributions P25/P50/P75/P90, avg deposits vs withdrawals per player)

### Session Replay & Heatmaps
- Mixpanel Session Replay SDK loaded with 100% capture rate
- `remote_settings_mode: 'fallback'` — recording rate controllable from Mixpanel UI without code changes
- No masking — fully visible replays for demo purposes
- Heatmap click tracking via `$mp_click` events with `data-mp-track` attributes on all key elements

### Experiments & Feature Flags
- 3 live A/B experiments running against real Mixpanel feature flags
- Every page refresh shows a different variant — great for live demos
- URL parameter override: `?hero=variant_b&bonus=variant_a&vip=variant_a`

| Experiment | Variants | Primary Metric |
|---|---|---|
| `hero_banner_test` | control (dark gold) / variant_a (light minimal) / variant_b (red aggressive) | Registration Completed |
| `bonus_offer_test` | control ($1,000 + 200 spins) / variant_a ($50 free no deposit) | Deposit Completed |
| `vip_lobby_test` | control (hidden) / variant_a (VIP lobby visible) | Live Table Joined |

### Mixpanel Agent
- Business context pre-configured with full iGaming terminology, KPI definitions, player lifecycle, benchmarks and event reference
- Designed for live Agent demos: "why did deposits drop?", "which segment drives GGR?", "compare variant performance"

---

## Event taxonomy

| Event | Key Properties |
|---|---|
| Session Started / Ended | device, country, segment, duration_minutes, total_wagered |
| Registration Completed | source, hero_variant, bonus_variant |
| Login | device |
| Game Opened | game_name, game_type |
| Game Round Completed | game_name, result (win/loss), amount, game_type |
| Live Table Joined | table_name |
| Deposit Initiated / Completed / Failed | amount, method |
| Withdrawal Requested / Approved | amount, method |
| Bet Placed | sport, stake, odds, potential_return, bet_type |
| Promo Viewed / Claimed | promo |
| KYC Document Uploaded | doc_type |
| Responsible Gambling Limit Set | limit_type, value |
| Bonus Wagering Progress | bonus, progress_pct |
| VIP Status Upgraded | new_tier |
| $experiment_started | $experiment_name, $variant_name |

All events carry experiment variant super properties: `hero_banner_variant`, `bonus_offer_variant`, `vip_lobby_variant`

---

## Player segments

60 fake user profiles distributed across: `New Player`, `Regular`, `VIP`, `High Roller`, `Casual`, `At-Risk`

---

## Architecture

```
amitpicker-mp/mixstake (GitHub)
├── public/
│   ├── index.html        # Full casino & sportsbook frontend (plain HTML)
│   └── admin.html        # Admin control panel
├── server/
│   └── index.js          # Node.js backend — event simulator + feature flag proxy
├── package.json
└── render.yaml           # Render deployment config
```

**Frontend** — plain HTML/CSS/JS, no framework. Mixpanel JS SDK loaded via CDN snippet. Flags fetched directly from `api.mixpanel.com/flags`.

**Backend** — Node.js + Express on Render. Handles:
- Serving the static frontend
- Background event simulator (node-cron, fires every 30 min)
- Feature flag API proxy

**Event simulator** — fires batches of realistic iGaming events server-side using the Mixpanel Node SDK. Each simulated user gets a random UTM channel, experiment variant assignment, and realistic behavioral pattern.

> **Note:** Render is a temporary hosting solution. The plan is to migrate to the Fixpanel repo (GitHub Pages) with GitHub Actions handling the event simulator CRON and Meeples handling session replay traffic — same infrastructure as the rest of Fixpanel.

---

## Admin panel

Available at `/admin`. Features:
- Fire event batches on demand (10–500 events)
- Start/stop the in-browser scheduler with configurable interval
- Variant switcher — build and copy demo URLs for any variant combination
- UTM demo links — 10 pre-built campaign URLs that open the site with real UTM parameters

---

## Roadmap

- [ ] Migrate to Fixpanel repo as an oneoff vertical
- [ ] GitHub Pages hosting (always-on, free)
- [ ] GitHub Actions CRON for event simulator (replaces Render backend)
- [ ] Meeples integration for session replay traffic
- [ ] MP Tweaks Chrome extension integration with full demo guide
- [ ] Metric tree in Mixpanel Agent
- [ ] MCP demo flow

---

## Built by

Amit Picker — Solutions Engineer, Mixpanel  
Questions? Ping on Slack or open an issue.
