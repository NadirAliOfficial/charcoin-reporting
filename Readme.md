
# CharCoin Insights

**Analytics, Reporting, and Global Donation Tools for the CharCoin Ecosystem**

---

## Overview

CharCoin Insights provides backend scripts for transparent analytics, fee tracking, wallet leaderboards, and donation statistics — empowering CHAR Coin’s mission of community-driven charity and accountability.

---

## Features

- **Global Donation Tracking:**  
  Track all transaction fees collected (the “Global Donation”) from every CHAR transaction.
- **Top Tier Wallets:**  
  Identify and rank wallets by transaction volume, fee contribution, and recent activity.
- **Charity Lottery:**  
  Randomly select eligible wallets for monthly charity rewards, based on activity or time window.
- **Wallet and Transaction Reports:**  
  Export full wallet lists, transaction counts, and fee stats to CSV.
- **Volume & Price Analytics:**  
  Fetch 24h volume, price, and price change stats (via DexScreener).

---

## Scripts

| Script               | Description                                 |
|----------------------|---------------------------------------------|
| `donated_so_far.js`  | Calculates total CHAR fees (global donation)|
| `top_tier.js`        | Gets top wallets by activity/volume         |
| `charity_lottery.js` | Selects random eligible wallets for charity |
| `total_txs.js`       | Gets total CHAR tx count for a wallet       |
| `total_vol.js`       | Gets 24h/7d/1m volume & price (DexScreener) |
| `user_and_wallets.js`| Exports user/wallet info to CSV             |

---

## Getting Started

### 1. **Clone the repo**

```bash
git clone https://github.com/YourUsername/charcoin-insights.git
cd charcoin-insights
````

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Set up your `.env`**

Create a `.env` file in the project root:

```
SOLSCAN_API_KEY=your_solscan_api_key_here
```

*(Get an API key at [Solscan Pro](https://pro.solscan.io/))*

### 4. **Run any script**

```bash
node donated_so_far.js
node charity_lottery.js
node top_tier.js
```

*(Check each script for specific usage/config.)*

---

## Output

* **CSV files** for reporting and dashboard import
* **Console output** for quick reference and validation

---

## Contributing

* PRs and suggestions welcome!
* To add a new script: copy a template, add to `Readme.md`, and push.

---

## License

MIT — Free to use for all CharCoin builders, holders, and charities.

---

**CHARCoin — Built for Good. Powered by Community.**
