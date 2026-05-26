const express = require('express');
const cron = require('node-cron');
const Mixpanel = require('mixpanel');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// CONFIG — single source of truth
// ─────────────────────────────────────────────
const MP_TOKEN = '5d00750a9ec9cec303dc27e371033fa8';
const MP_API_SECRET = process.env.MP_API_SECRET || ''; // optional, for feature flag server-side calls
const mixpanel = Mixpanel.init(MP_TOKEN, { protocol: 'https' });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─────────────────────────────────────────────
// FEATURE FLAG PROXY
// Lets the browser call /api/flags without exposing API secret
// ─────────────────────────────────────────────
app.post('/api/flags', async (req, res) => {
  const { distinct_id } = req.body;
  if (!distinct_id) return res.json({ flags: {} });
  try {
    const response = await fetch('https://decide.mixpanel.com/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: MP_TOKEN,
        distinct_id,
        feature_flags: ['hero_banner', 'welcome_bonus_offer', 'vip_lobby']
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('Flag fetch error:', e.message);
    res.json({ flags: {} });
  }
});

// ─────────────────────────────────────────────
// ADMIN PAGE
// ─────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ─────────────────────────────────────────────
// TOKEN ENDPOINT — frontend fetches this so token never hardcoded in HTML
// ─────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({ token: MP_TOKEN });
});

// ─────────────────────────────────────────────
// SIMULATOR DATA
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// UTM DATA — realistic iGaming acquisition channels
// ─────────────────────────────────────────────
const UTM_CHANNELS = [
  { utm_source: 'google',    utm_medium: 'cpc',          utm_campaign: 'casino_brand_uk',        utm_content: 'slots_banner',      utm_term: 'online casino' },
  { utm_source: 'google',    utm_medium: 'cpc',          utm_campaign: 'sportsbook_football',    utm_content: 'odds_banner',       utm_term: 'sports betting' },
  { utm_source: 'google',    utm_medium: 'cpc',          utm_campaign: 'live_casino_de',         utm_content: 'roulette_creative', utm_term: 'live casino' },
  { utm_source: 'facebook',  utm_medium: 'paid_social',  utm_campaign: 'slots_acquisition_uk',  utm_content: 'video_ad_1',        utm_term: null },
  { utm_source: 'facebook',  utm_medium: 'paid_social',  utm_campaign: 'vip_recruitment',        utm_content: 'carousel_vip',      utm_term: null },
  { utm_source: 'instagram', utm_medium: 'paid_social',  utm_campaign: 'jackpot_awareness',      utm_content: 'story_ad',          utm_term: null },
  { utm_source: 'affiliate', utm_medium: 'affiliate',    utm_campaign: 'casino_affiliate_uk',    utm_content: 'partner_link',      utm_term: null },
  { utm_source: 'affiliate', utm_medium: 'affiliate',    utm_campaign: 'sportsbook_affiliate',   utm_content: 'odds_widget',       utm_term: null },
  { utm_source: 'email',     utm_medium: 'email',        utm_campaign: 'weekly_promo_spins',     utm_content: 'cta_button',        utm_term: null },
  { utm_source: 'email',     utm_medium: 'email',        utm_campaign: 'reactivation_30d',       utm_content: 'cashback_offer',    utm_term: null },
  { utm_source: 'email',     utm_medium: 'email',        utm_campaign: 'vip_exclusive_offer',    utm_content: 'hero_banner',       utm_term: null },
  { utm_source: 'organic',   utm_medium: 'organic',      utm_campaign: null,                     utm_content: null,                utm_term: null },
  { utm_source: 'organic',   utm_medium: 'organic',      utm_campaign: null,                     utm_content: null,                utm_term: null },
  { utm_source: 'direct',    utm_medium: 'none',         utm_campaign: null,                     utm_content: null,                utm_term: null },
  { utm_source: 'twitter',   utm_medium: 'paid_social',  utm_campaign: 'jackpot_promo',          utm_content: 'promoted_tweet',    utm_term: null },
  { utm_source: 'referral',  utm_medium: 'referral',     utm_campaign: 'friend_invite',          utm_content: 'invite_link',       utm_term: null },
];

const FAKE_USERS = Array.from({length: 60}, (_, i) => ({
  id: `mixstake_user_${String(i+1).padStart(3,'0')}`,
  segment: ['New Player','Regular','VIP','High Roller','Casual','At-Risk'][i % 6],
  country: ['GB','DE','CA','AU','NZ','SE','FI','NO','IE','NL'][i % 10],
  device: ['Desktop','Mobile','Tablet'][i % 3],
  vip: i % 8 === 0,
  totalDeposits: Math.floor(Math.random() * 80) + 1,
  preferredGame: ['slots','live_casino','table','sports'][i % 4],
}));

const GAMES = [
  'Lucky Streak','Book of Dead','Starburst','Mega Moolah','Gonzo\'s Quest',
  'Wolf Gold','Sweet Bonanza','Fire Joker','Immersive Roulette','Infinite Blackjack',
  'Speed Baccarat','Crazy Time','Lightning Roulette','Power Blackjack'
];

const SPORTS = ['Football','Basketball','Tennis','Ice Hockey','Baseball'];
const PAYMENT_METHODS = ['Card','PayPal','Crypto','Bank Transfer','Apple Pay'];
const PROMOS = ['Welcome Bonus','Free Spins Friday','Cashback Monday','Reload Bonus','VIP Reward'];
const VARIANTS = ['control','variant_a','variant_b'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }

// ─────────────────────────────────────────────
// FIRE A BATCH OF SIMULATED EVENTS
// ─────────────────────────────────────────────
function fireBatch(batchSize = 40) {
  console.log(`[MixStake Simulator] Firing batch of ${batchSize} events...`);
  let fired = 0;

  for (let i = 0; i < batchSize; i++) {
    const user = pick(FAKE_USERS);

    // Declare variants FIRST before using in baseProps
    const heroVariant  = pick(VARIANTS);
    const bonusVariant = pick(['control','variant_a']);
    const vipVariant   = pick(['control','variant_a']);

    // Fire $experiment_started for each experiment
    mixpanel.track('$experiment_started', { distinct_id: user.id, '$experiment_name': 'hero_banner_test', '$variant_name': heroVariant,  simulated: true });
    mixpanel.track('$experiment_started', { distinct_id: user.id, '$experiment_name': 'bonus_offer_test', '$variant_name': bonusVariant, simulated: true });
    mixpanel.track('$experiment_started', { distinct_id: user.id, '$experiment_name': 'vip_lobby_test',   '$variant_name': vipVariant,   simulated: true });

    // Assign a realistic UTM channel for this simulated user
    const utmChannel = pick(UTM_CHANNELS);

    const baseProps = {
      segment: user.segment,
      country: user.country,
      device: user.device,
      vip: user.vip,
      hero_banner_variant:  heroVariant,
      bonus_offer_variant:  bonusVariant,
      vip_lobby_variant:    vipVariant,
      // UTM attribution — same property names Mixpanel JS SDK uses automatically
      utm_source:   utmChannel.utm_source,
      utm_medium:   utmChannel.utm_medium,
      utm_campaign: utmChannel.utm_campaign,
      utm_content:  utmChannel.utm_content,
      utm_term:     utmChannel.utm_term,
      simulated: true,
      source: 'mixstake_background_scheduler',
    };

    // Identify user with traits + first-touch UTM attribution
    // set_once mirrors what JS SDK does — only sets if not already set
    mixpanel.people.set_once(user.id, {
      initial_utm_source:   utmChannel.utm_source,
      initial_utm_medium:   utmChannel.utm_medium,
      initial_utm_campaign: utmChannel.utm_campaign,
      initial_utm_content:  utmChannel.utm_content,
      initial_utm_term:     utmChannel.utm_term,
    });
    mixpanel.people.set(user.id, {
      '$name': user.id,
      segment: user.segment,
      country: user.country,
      device: user.device,
      vip: user.vip,
      total_deposits: user.totalDeposits,
      preferred_game_type: user.preferredGame,
      utm_source:   utmChannel.utm_source,
      utm_medium:   utmChannel.utm_medium,
      utm_campaign: utmChannel.utm_campaign,
    });

    // Pick a realistic event sequence for this user
    const eventRoll = Math.random();

    if (eventRoll < 0.12) {
      // Session start
      mixpanel.track('Session Started', { distinct_id: user.id, ...baseProps });
      fired++;

    } else if (eventRoll < 0.22) {
      // Game opened → round completed
      const game = pick(GAMES);
      const result = Math.random() > 0.46 ? 'win' : 'loss';
      const amount = randFloat(0.5, 250);
      mixpanel.track('Game Opened', { distinct_id: user.id, ...baseProps, game_name: game, game_type: user.preferredGame });
      mixpanel.track('Game Round Completed', { distinct_id: user.id, ...baseProps, game_name: game, result, amount, game_type: user.preferredGame });
      fired += 2;

    } else if (eventRoll < 0.32) {
      // Deposit flow
      const amount = pick([10,20,25,50,100,200,500,1000]);
      const method = pick(PAYMENT_METHODS);
      mixpanel.track('Deposit Initiated', { distinct_id: user.id, ...baseProps, amount, method });
      if (Math.random() > 0.15) {
        mixpanel.track('Deposit Completed', { distinct_id: user.id, ...baseProps, amount, method });
      } else {
        mixpanel.track('Deposit Failed', { distinct_id: user.id, ...baseProps, amount, method, reason: 'Card declined' });
      }
      fired += 2;

    } else if (eventRoll < 0.40) {
      // Sports bet
      const stake = pick([5,10,20,50,100]);
      const odds = randFloat(1.2, 8.0);
      mixpanel.track('Bet Placed', {
        distinct_id: user.id, ...baseProps,
        sport: pick(SPORTS),
        stake,
        odds,
        potential_return: parseFloat((stake * odds).toFixed(2)),
        bet_type: Math.random() > 0.6 ? 'accumulator' : 'single',
      });
      fired++;

    } else if (eventRoll < 0.48) {
      // Withdrawal
      const amount = pick([50,100,200,500,1000]);
      mixpanel.track('Withdrawal Requested', { distinct_id: user.id, ...baseProps, amount, method: pick(PAYMENT_METHODS) });
      if (Math.random() > 0.1) {
        mixpanel.track('Withdrawal Approved', { distinct_id: user.id, ...baseProps, amount });
      }
      fired += 2;

    } else if (eventRoll < 0.55) {
      // Promo interaction
      const promo = pick(PROMOS);
      mixpanel.track('Promo Viewed', { distinct_id: user.id, ...baseProps, promo });
      if (Math.random() > 0.4) {
        mixpanel.track('Promo Claimed', { distinct_id: user.id, ...baseProps, promo });
      }
      fired += 2;

    } else if (eventRoll < 0.60) {
      // Registration funnel
      mixpanel.track('Registration Started', { distinct_id: user.id, ...baseProps });
      if (Math.random() > 0.3) {
        mixpanel.track('Registration Completed', { distinct_id: user.id, ...baseProps, source: pick(['organic','email','paid_social','referral','affiliate']) });
        if (Math.random() > 0.4) {
          mixpanel.track('KYC Document Uploaded', { distinct_id: user.id, ...baseProps, doc_type: pick(['Passport','ID Card','Utility Bill']) });
        }
      }
      fired += 2;

    } else if (eventRoll < 0.65) {
      // Session end
      mixpanel.track('Session Ended', {
        distinct_id: user.id, ...baseProps,
        duration_minutes: rand(2, 90),
        games_played: rand(1, 25),
        total_wagered: randFloat(5, 500),
      });
      fired++;

    } else if (eventRoll < 0.70) {
      // Login
      mixpanel.track('Login', { distinct_id: user.id, ...baseProps });
      fired++;

    } else if (eventRoll < 0.74) {
      // Responsible gambling
      mixpanel.track('Responsible Gambling Limit Set', {
        distinct_id: user.id, ...baseProps,
        limit_type: pick(['daily_deposit','weekly_loss','session_time','cooling_off']),
        value: pick([50,100,200,500]),
      });
      fired++;

    } else if (eventRoll < 0.78) {
      // Live table
      mixpanel.track('Live Table Joined', { distinct_id: user.id, ...baseProps, table_name: pick(GAMES.slice(8)) });
      fired++;

    } else if (eventRoll < 0.82) {
      // Bonus wagering progress
      mixpanel.track('Bonus Wagering Progress', {
        distinct_id: user.id, ...baseProps,
        bonus: pick(PROMOS),
        progress_pct: rand(0, 100),
      });
      fired++;

    } else if (eventRoll < 0.86) {
      // Search
      mixpanel.track('Search Performed', {
        distinct_id: user.id, ...baseProps,
        query: pick(['blackjack','roulette','mega moolah','football odds','free spins','live casino']),
      });
      fired++;

    } else if (eventRoll < 0.90) {
      // VIP upgrade
      if (user.vip) {
        mixpanel.track('VIP Status Upgraded', {
          distinct_id: user.id, ...baseProps,
          new_tier: pick(['Silver','Gold','Platinum','Diamond']),
        });
        fired++;
      }

    } else {
      // Page view
      mixpanel.track('Page Viewed', {
        distinct_id: user.id, ...baseProps,
        page: pick(['Casino Home','Live Casino','Sportsbook','Promotions','My Account','VIP Lobby']),
      });
      fired++;
    }
  }

  console.log(`[MixStake Simulator] Batch complete — ${fired} events fired to Mixpanel project.`);
}

// ─────────────────────────────────────────────
// CRON SCHEDULE — every 30 minutes
// ─────────────────────────────────────────────
cron.schedule('*/30 * * * *', () => {
  fireBatch(40);
});

// Also fire a small batch on server start so the project
// is never empty when someone first opens the site
setTimeout(() => fireBatch(80), 3000);

// ─────────────────────────────────────────────
// MANUAL TRIGGER ENDPOINT (useful for testing)
// ─────────────────────────────────────────────
app.post('/api/simulate', (req, res) => {
  const size = parseInt(req.body.size) || 40;
  fireBatch(size);
  res.json({ ok: true, message: `Fired batch of ${size} events` });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎰 MixStake demo server running on port ${PORT}`);
  console.log(`📊 Mixpanel token: ${MP_TOKEN}`);
  console.log(`⏰ Background simulator: fires every 30 minutes\n`);
});
