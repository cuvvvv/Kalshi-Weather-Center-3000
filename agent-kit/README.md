# Weather Edge V2 — early activity research

Requires Node.js 22.18+ and network access to external-api.kalshi.com. No dependencies or account credentials.

    node runner.mjs --once
    node runner.mjs --notify
    node report.mjs

The scanner requests a scan every 15 seconds while running on an awake computer. Slow scans delay later cycles; scans do not overlap. Ctrl+C stops it. A server requires an external process supervisor; none is provisioned by this package.

EARLY: >=25 contracts in 1 minute and >=3x the per-minute rate in the preceding 9 minutes, with >=25 contracts in that baseline. CONFIRMED: >=100 contracts in 5 minutes, >=2x the preceding 5 minutes and ask >=75 cents. Both need complete tape, spread <=3 cents, depth >=10 contracts, fresh book receipt and >=30 minutes before close. Default discovery asks: 55–90 cents; 24h volume >=250. These are experimental thresholds, not optimized or validated for profitability.

Coverage is seven daily-high-temperature weather series (NYC, Chicago/Midway, Miami, Los Angeles, Austin, Denver, Philadelphia). Audits cover up to 12 distinct contracts per scan: volume leaders, city diversity and rotating coverage. Some candidates wait for a future scan. Both sides share the same tape/book request. A contract's volume alone does not show which direction informed money is trading.

weather-edge-alerts.jsonl stores alerts. weather-edge-marks.json stores up to 2,000 alerts and subsequent bid marks observed 15 and 60 minutes later, within a five-minute observation tolerance. Absent future audits remain missing. report.mjs groups observed bid changes by early/confirmed stage; these are not net returns and the groups are not independent trials. Back up journals. Browser and runner journals are separate.

--notify sends local desktop notifications on macOS or Linux when available. Terminal alerts and journals work without it. No iPhone push, email, SMS, order execution, or unattended host is configured.

The dashboard adds supplementary NWS station observations and forecasts for contract-recognized CLI station products. They are context, not the official settlement record or a calibrated probability. Exact market rules remain authoritative.

Dashboard paper entries require a manually documented probability estimate, conservative probability floor, HTTPS evidence source, issue time within two hours, station/rule review, a fresh full audit, <=3 cent spread and depth >=10. Maximum entry ask is the lower of 90 cents and the price preserving >=3 cents expected net per contract after estimated quadratic taker fees and a 1 cent slippage reserve, conditional on that floor. Only one open paper position per city/day is permitted. These gates do not calibrate the user's probability or guarantee profit.
