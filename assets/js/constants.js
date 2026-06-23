// ── File paths ────────────────────────────────────────────────────────────────
const DATA_STOTRAMS_INDEX    = 'data/stotrams.json';
const DATA_SUBHASHITAM_INDEX = 'data/subhashitam/_index.json';
const DATA_SEARCH_INDEX      = 'data/search-index.json';

// ── UI parameters ─────────────────────────────────────────────────────────────
const SECTION_TAB_THRESHOLD  = 6;   // ≤ this → pill tabs; > this → dropdown

// ── Feature flags ─────────────────────────────────────────────────────────────
const ENABLE_SUBHASHITAM     = true;
const ENABLE_STOTRAM_MEANING = true;

// ── Beta tokens ───────────────────────────────────────────────────────────────
// Share ?beta=<token> URL to grant early access when a flag is false.
// Change the token string to revoke all existing tester access.
const SUBHASHITAM_BETA_TOKEN = 'sub-beta-1';
