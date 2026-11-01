# Data sources and validation boundary

## Current ingestion

| Feed | Exact role | Match and quality checks | Limit |
| --- | --- | --- | --- |
| Kalshi public REST | Tradable contract rules, bids, asks, depth and trade tape | Weather-category whitelist, contract ticker, complete tape, receipt timestamps, spread and depth | Sampled REST, not an exhaustive tick feed |
| NWS station observations | Supplemental measured temperature | Exact ICAO ID, explicit units, original observation time, MADIS quality flag V required for preferred NWS context, 75-minute freshness threshold | QC/ingestion can delay observations; not a final settlement record |
| NOAA Aviation Weather Center METAR | Alternate delivery of station observations with raw report | Exact ICAO ID, newest observation epoch, null/unit checks, 75-minute freshness threshold; raw QC field retained | Often the same physical ASOS sensor as NWS; not independent model confirmation |
| NWS daily station-grid forecast | Date-matched daytime high | Coordinates from verified station metadata, original issue time, requested local date, six-hour issue-time threshold | Daytime forecast can differ from the full-day climate maximum |
| NWS hourly station-grid forecast | Temperature trajectory for the selected date | Original issue time, local-date matching, explicit temperature units | Future/remaining forecast hours only; no synthetic completion of elapsed hours |
| Shared D1 snapshot archive | Revision history for later calibration | Content fingerprints, original provider times and capture time; distinct revisions retained | Collection occurs on visits/requests, not continuously; no synthetic backfill |

The station registry maps the market's CLI product to its reference ICAO station. It does not infer a new site from a nearby city or airport. Users must still check the exact market station and settlement window. Chicago daily-high coverage is Midway (CLIMDW/KMDW), not O'Hare.

## What quality labels mean

FRESH_CONTEXT means the selected checks passed; it does not mean verified final weather, calibrated probability, or a tradable advantage. REVIEW exposes a missing, stale, unverified, date-mismatched or flagged input. Comparable observation disagreement is checked only when report times are within 15 minutes, with a 3°F review threshold. These freshness and discrepancy thresholds are experimental operations settings, not learned error bounds.

The maintenance marker `$` is preserved and flagged without assuming which sensor is affected. AWC raw QC bits are not decoded into a claim that all checks passed. NWS and AWC values are not averaged into a false consensus probability.

## Official outcome and probability gaps

The actual current market rules name the authoritative settlement source. weather.com/kalshi provides a verification page, but no programmatic final settlement feed is connected here. Ordinary TWC observations, daily summaries, and generic forecasts must not be assumed identical to the Kalshi-specific final record. TWC's generic historical daily summary can use a different day window; its daytime-high forecast fields also differ from calendar-day extremes.

No paid Weather Company subscription, key or redistribution entitlement has been configured. The provider's daily forecast and probabilistic products require appropriately entitled credentials. Public website redistribution terms would need to match the chosen feed's agreement before integration.

Hourly marginal temperature distributions do not by themselves define the distribution of the daily maximum. A validated dependence model or a dedicated daily-extreme probability product is needed. No true probability, confidence bound, or profitability is inferred from the current deterministic forecast.

## Archive and calibration path

Distinct station/forecast revisions are archived with original issue/observation timestamps and source URLs, deduplicated by content fingerprint. Retention is 90 days with bounded cleanup on writes. `/api/weather?product=CLIMDW&date=2026-11-01&history=1` reads up to 48 recent snapshots for that station/date. The UI can export a full individual source snapshot.

Before probability-based alerts: acquire and match the exact final settlement outcome; preserve forecast vintages available at each decision time; estimate residual distributions by station, season and lead time; calibrate on training days and assess Brier score/reliability and net trading results on later holdout days. Group correlated buckets and same-day observations. Missing data, losing signals and provider outages must remain visible.

## Primary documentation

- NWS API: https://www.weather.gov/documentation/services-web-api
- NWS API schema: https://api.weather.gov/openapi.json
- NOAA Aviation Weather Center API: https://aviationweather.gov/data/api/
- Contract outcome verification: https://weather.com/kalshi
- Weather Company daily forecasts: https://developer.weather.com/docs/openapi/daily-forecast-3-0-0
- Weather Company probabilistic forecasts: https://developer.weather.com/docs/probabilistic-forecast
