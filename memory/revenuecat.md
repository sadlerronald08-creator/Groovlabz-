# RevenueCat — integrated (2026-06)
This file serves as memory for interacting with the user's RevenueCat account via the integration proxy later.

## Identifiers (from /setup response — verbatim)
- rc_project_id: projac550481
- apple_app_id: appa3b0f49a48
- play_app_id: app6ce29b1cd8
- entitlement_lookup_key: pro
- offering_lookup_key: default
- Packages (package -> product_id, current price):
  - $rc_monthly -> prod667676ad81   ($9.99 / P1M, trial: none)
  - $rc_annual  -> prod6eabdab4e4   ($79.99 / P1Y, trial: none)
- Dashboard: https://app.revenuecat.com/projects/projac550481

## Status
- connection_state: connected, project_state: connected
- Bundle id / package: com.emergent.jamnowstudio.fr57we
- Status check:
  curl -sS -H "$AUTH" "$INTEGRATION_PROXY_URL/internal/revenuecat/projects/fdfdb7cb-aed1-49db-8866-466c28418293/status"

## Later updates (integration proxy APIs ONLY — never call RevenueCat REST API)
- Change price/duration/trial OR add a package (upsert):
  POST $INTEGRATION_PROXY_URL/internal/revenuecat/projects/fdfdb7cb-aed1-49db-8866-466c28418293/products
  body: {"products":[{"package":"$rc_monthly","price":14.99,"currency":"USD","period":"P1M","trial":"P1W","prices":[{"amount_micros":14990000,"currency":"USD"}]}]}
- Remove a package:
  DELETE $INTEGRATION_PROXY_URL/internal/revenuecat/projects/fdfdb7cb-aed1-49db-8866-466c28418293/products/%24rc_monthly
- Recover identifiers / repopulate .env: re-run the idempotent /setup call.

## Going live (USER does these; store-side, cannot be automated)
All steps to take IAP live are in the FAQ section of the payments panel: upload ASC API key (.p8) + Play service-account JSON to RevenueCat, create matching IAP products with the same product IDs, then release build + review.
