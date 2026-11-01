# Kalshi Weather Center 3000

Weather Edge V2 — weather-only Kalshi activity research and paper-trading validation.

Independent Weather Edge project. Kalshi daily-high-temperature activity research dashboard with read-only markets and hypothetical trading only.

Live dashboard: https://weather-edge-radar.cuvvvvv.chatgpt.site

## Quick start

For the dependency-free continuous scanner, use Node.js 22.18 or newer:

    node agent-kit/runner.mjs --once
    node agent-kit/runner.mjs --notify
    node agent-kit/report.mjs

For the web application, use the pinned pnpm version in package.json:

    corepack enable
    pnpm install --frozen-lockfile
    pnpm dev

The web source retains the existing Weather Edge Sites hosting identity. The GitHub repository is an independent source repository. The live Site is not automatically redeployed by GitHub pushes. See agent-kit/README.md for scanner operation and limitations.

## Source provenance

Initial source release: Weather Edge V2, Site source commit `880a894652f8790159b9aebf6e4d49e1a5f5d3b2`.

## Earlier discovery

Seven verified weather series, both YES and NO. EARLY alerts compare one-minute volume with the per-minute rate of the preceding nine minutes. Default gates: at least 25 contracts in the latest minute, 3x acceleration and at least 25 baseline contracts. CONFIRMED alerts use at least 100 contracts over five minutes, 2x preceding-five-minute volume, and ask >=75 cents. Both stages need a complete ten-minute trade response, two-sided book, <=3 cent spread, >=10 best-ask contracts, book receipt <=15 seconds old and at least 30 minutes before close.

Early preset: 55–90 cent asks, 24h volume >=250. High-implied-odds preset: 75–95 cents, 24h volume >=1,000. Experimental thresholds are not statistically optimized. Up to 12 distinct contracts receive tape/book audits per scan, mixing volume leaders, city diversity and rotating coverage; both sides share requests. A selected review contract is prioritized on the next scan. The rest stay visibly queued. This remains a sampled REST scanner rather than an exhaustive real-time feed.

## Evidence and entry discipline

Review displays exact settlement rules and supplemental NWS station observations/forecasts when the contract contains a recognized CLI product. Mappings: CLINYC/KNYC, CLIMDW/KMDW, CLIMIA/KMIA, CLILAX/KLAX, CLIAUS/KAUS, CLIDEN/KDEN, CLIPHL/KPHL. The user must verify the mapping, event date and source. NWS context is not substituted for the contract's settlement record and is not turned into an arbitrary probability.

A paper entry requires: point probability, conservative probability floor <= point probability, HTTPS evidence URL, issue time within two hours, reviewed station/date/source/window, complete fresh audit, spread <=3 cents, >=10 depth, supported quadratic fee schedule and >=30 minutes before close. The entry ceiling is the greatest whole-cent ask preserving at least 3 cents expected net per contract under that conservative floor, after estimated taker fee and a 1 cent slippage reserve, with an absolute cap of 90 cents. One open paper position per city/day event limits correlated exposure across buckets/sides. All results remain conditional on the user's uncalibrated probability estimate.

Fees use the series quadratic fee multiplier and order-level rounding, not a guaranteed broker charge. Paper fills at displayed asks are not assured. Realized paper P&L uses entry fees; expected-value estimates also reserve slippage. No actual account connection or order placement.

## Measurement

First EARLY and CONFIRMED alerts are saved with their prices. The browser records 15- and 60-minute bid marks only if a fresh same-contract audit is observed within five minutes of the target time. Missing marks stay missing; no look-ahead or synthetic fill-in. Bid change from initial ask is not net return or evidence of calibrated probabilities. Negative marks remain in the journal. Journal export includes alerts, evidence and hypothetical entries. Settlements are looked up from actual Kalshi market results; nonbinary/ambiguous results stay unresolved.

Existing V1 browser journals are retained under their existing keys. Browser journals and standalone runner journals are separate and device-local. Export backups. The downloadable runner has a restart-aware stage-specific cooldown, JSONL alerts, bid-mark state and a small observational report.

## Operation and verification

    node --test tests/*.test.mjs
    node node_modules/typescript/bin/tsc --noEmit
    node agent-kit/runner.mjs --once

Dashboard requests a scan every 15 seconds while active, with nonoverlap and stale-data indication. Browser throttling and API latency can delay cycles. Request pacing and one rate-limit retry bound API pressure. Supplemental weather is fetched only on review and cached five minutes. In-app/browser alerts require the page; the standalone Node scanner requires an awake host/process supervisor. No unattended host or iPhone push is provisioned.

Before real money: ingest matched historical forecasts and official outcomes, calibrate probability floors out of sample, assess correlated weather-day exposure and validate net returns on a holdout period. This release improves discovery and measurement; it does not establish profitability.


## Data quality release

The Data quality tab now ingests exact-station NWS and NOAA aviation observations, date-matched daily and hourly forecasts, raw station reports, provider issue times and quality flags. Missing, stale, mismatched and outlying inputs remain visible. A shared D1 archive stores distinct source revisions for later analysis, triggered by visits/requests. See docs/DATA_SOURCES.md for provenance, thresholds, retention, provider independence, and the remaining official-settlement/probability gaps. No paid feed or calibrated probability model is connected.

## Trader research release

The Trader research tab combines a bounded public Kalshi leaderboard sample from predicting.top with reported all-time Climate and Weather category P&L and visible Kalshi Social activity. It matches explicit recent taker buys against exact radar tickers/sides and current executable quotes; maker intent, hidden activity, stale data and missing history remain unknown. All entries retain the independent probability, fee and paper-entry gates. No real orders are placed. See [docs/TRADER_DATA.md](docs/TRADER_DATA.md) for sources, sampling limits, matching rules, provider access and the remaining profitability evidence gaps. The standalone scanner remains an anonymous flow scanner; trader research runs in the dashboard while its tab is open.

## Kalshi trade-slip links

Radar rows, activity alerts, paper ledger entries, visible trader buys and contract reviews can open the exact event, contract bucket and YES/NO side in Kalshi's buy ticket. Reviews also offer Copy slip link. The link uses Kalshi's native `op_market_ticker`, `op_order_side`, `op_side=BUY`, and `op_order_type=dollars` parameters, observed on the public site and checked after reload. It does not prefill an amount or price or submit an order. Sign-in and iOS app handoff are controlled by Kalshi; the app handoff has not been verified on a physical iPhone. Supported series are restricted to the seven daily-high cities, with date/series consistency checks.
