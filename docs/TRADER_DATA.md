# Weather trader research

The Trader research tab is read-only research. It does not copy orders, estimate a trader's win probability, or grant a probability increase to a radar signal. No account or trading keys are needed.

## Connected sources

| Source | Data used | Limits |
| --- | --- | --- |
| [predicting.top public API](https://predicting.top/api-docs) | Kalshi 30-day overall P&L leaderboard and per-profile all-time Climate and Weather category P&L/market count | Third-party, unaudited. Category timestamp, fees, realized/unrealized split, drawdown and independent settled outcomes are unspecified. Credit and links appear in the app. |
| Kalshi public Social responses | `/v1/social/trades?nickname=…&page_size=100`; `/v1/social/profile?nickname=…` only to resolve a renamed nickname explicitly | Undocumented, opt-in and sometimes hidden. A page can contain non-weather trades and have a cursor; no claim to complete history. Errors and unknown identities stay unavailable. |
| [Unusual Whales smart-money API](https://api.unusualwhales.com/docs/operations/PublicApi.PredictionController.smart_money) | Evaluated through the connected Unusual Whales tools; no data ingested | The account returned `free_tier_upgrade_required` for the weather-filtered live request. Kalshi-specific coverage and usable weather history were not verified. No subscription was purchased. |

[Layer's trader SDK documentation](https://uselayer.sh/docs/trader-data) and its [public Social reader](https://github.com/uselayer/uselayer-sdk/blob/main/python/src/uselayer/venues/kalshi_social.py) were checked for the public response fields. No Layer package, execution engine, keys or live copying are installed. Layer's copyability scoring is described for Polymarket; it must not be presented as a verified Kalshi weather score.

## Discovery

Read the top 100 Kalshi accounts by provider-reported 30-day overall P&L. To bound requests, inspect category data for the first 18 accounts whose sports share is below 80% or unknown. Rank the resulting weather records by reported all-time category P&L. This is a partial discovery sample, not the global top weather traders. It will miss specialists who do not rank in overall P&L or who trade mostly sports.

The research-history screen requires positive reported category P&L, at least 30 category markets, and a leaderboard sync within 24 hours. Thirty markets are not thirty independent settlements; the screen is a configurable research convention, not statistical evidence of skill. Category timestamps are not supplied, and the leaderboard sync cannot establish when category results were measured. Missing records and failed lookups are not zero P&L. The UI discloses coverage and unavailable metrics.

The first three profiles passing this screen are watched while the trader tab is open; users may replace them with public usernames. Activity is requested every 15 seconds without overlapping polls. A server-local fulfilled-JSON cache retains leader/category responses for five minutes and activity for 15 seconds. No isolate-global promises are retained. There is no unattended collector or mobile background delivery.

## Exact activity matching

Only `KXHIGHNY`, `KXHIGHCHI`, `KXHIGHMIA`, `KXHIGHLAX`, `KXHIGHAUS`, `KXHIGHDEN`, and `KXHIGHPHIL` prints are included. Weather-category profit can include other weather markets; it is not specific proof of daily-high expertise.

A review label requires:

- An explicit named taker, explicit `buy` action and YES/NO side. A maker can have bought one side or sold the other; its intent is left unknown.
- A unique trade ID and valid quantity, timestamp and price. Social `price_dollars` is the YES price, so NO price is its complement.
- A trade no more than five minutes old, activity response no more than 30 seconds old and the reported-history screen above.
- The exact same ticker and side in current radar filters, a complete audit received within 15 seconds, ask 55–95¢, spread at most 3¢, best-ask depth at least 10 contracts and at least 30 minutes before close.
- Current ask no more than 3¢ above the observed trade price.

This label invites contract review. It does not establish positive expected value. Manual paper-entry probability evidence, settlement rules, conservative price ceiling, fees, slippage reserve and correlated-event restrictions continue to apply independently. No trader P&L is converted into event probability.

## Before judging copying profitable

Build a prospective, timestamped dataset rather than selecting winners after the fact. Record first-seen delay, executable book depth, simulated fill cost and fees, exact station/date/rules, exits and actual settlement. Separate daily-high results from other weather contracts and evaluate independent city-days. Compare the full process against a price-only baseline and a held-out time period, including missed/hidden trades, losses and drawdowns. Provider P&L alone cannot establish that a delayed follower earns a positive net return.

Kalshi's documented [public trades endpoint](https://docs.kalshi.com/api-reference/market/get-trades) does not include trader account identities; it remains the primary anonymous market-activity source. [Kalshi's leaderboard is opt-in](https://help.kalshi.com/en/articles/13823809-leaderboard). Do not infer individual identities from anonymous prints or treat private/hidden activity as permission to retrieve it.
