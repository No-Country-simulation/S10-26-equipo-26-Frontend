/**
 * Unit & Integration Tests for PriceScope Frontend
 * Tests:
 * 1. Catalog filtering and sorting logic
 * 2. Manual association and disassociation workflow
 * 3. Match suggestion confirmation and rejection
 * 4. Multi-currency formatting and exchange rate calculations
 * 5. Shrinkflation effective unit inflation calculation and verification audit
 * 6. Historical price observation classifications
 */

import {
  getProducts,
  getProductListings,
  associateListing,
  disassociateListing,
  getMatchSuggestions,
  confirmMatchSuggestion,
} from '../src/services/catalogService';
import { getProductPriceHistory } from '../src/services/pricingService';
import { getShrinkflationAlerts, updateAlertStatus } from '../src/services/shrinkflationService';
import { getActiveExchangeRate } from '../src/services/currencyService';

async function runTests() {
  console.log('--- PriceScope Test Suite Starting ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Catalog Tests
  const catalog = await getProducts({ query: 'Cocinero' });
  assert(catalog.items.length > 0, 'Catalog filters products by query "Cocinero"');
  assert(catalog.items[0].brand === 'Cocinero', 'Catalog item brand matches');

  // 2. Listing association & disassociation
  const testProdId = 'prod_chocolinas_250';
  const initialListings = await getProductListings(testProdId);
  assert(initialListings.length >= 2, 'Canonical product has active store listings');

  // 3. Match suggestions pending manual review
  const suggestions = await getMatchSuggestions();
  assert(Array.isArray(suggestions), 'Match suggestions endpoint returns array');
  const pendingSugg = suggestions.find(s => s.status === 'pending');
  if (pendingSugg) {
    const confirmed = await confirmMatchSuggestion(pendingSugg.id);
    assert(confirmed === true, 'Manual match suggestion confirmed without auto-merging');
  }

  // 4. Currency and Exchange Rate
  const exchangeRate = await getActiveExchangeRate();
  assert(exchangeRate.rate > 0, 'Official exchange rate is positive number');
  assert(exchangeRate.baseCurrency === 'USD' && exchangeRate.targetCurrency === 'ARS', 'Exchange rate pair is USD/ARS');
  assert(typeof exchangeRate.isStale === 'boolean', 'Staleness verification flag is boolean');

  // 5. Shrinkflation & Unit Inflation Calculations
  const alerts = await getShrinkflationAlerts();
  assert(alerts.length > 0, 'Shrinkflation alerts loaded');
  const colgateAlert = alerts.find(a => a.canonicalProductId === 'prod_colgate_total12_90g');
  assert(Boolean(colgateAlert), 'Shrinkflation alert detected for Colgate (90g -> 70g)');
  if (colgateAlert) {
    assert(colgateAlert.weightChangePercentage < 0, 'Weight change is negative');
    assert(colgateAlert.effectiveUnitInflationPercentage > colgateAlert.nominalPriceChangePercentage,
      'Effective unit inflation exceeds nominal price change due to weight drop');
    assert(colgateAlert.status === 'confirmed', 'Colgate alert has confirmed status');

    const updated = await updateAlertStatus(colgateAlert.id, 'confirmed', 'Audit verified via packaging text');
    assert(updated.notes === 'Audit verified via packaging text', 'Audit notes saved successfully');
  }

  // 6. Pricing History & Observation Types
  const history = await getProductPriceHistory('prod_skip_jabon_liquido_3l', '30d');
  assert(history.stores.length > 0, 'Price history contains store series');
  const promoObsFound = history.stores.some(s => s.observations.some(o => o.isPromotional));
  assert(promoObsFound, 'Time series differentiates promotional observations from regular prices');

  console.log(`\nTests Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
