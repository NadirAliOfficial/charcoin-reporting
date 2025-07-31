const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.SOLSCAN_API_KEY;
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";
const HOLDER_OWNER = "34vReZu1vXhyCkBYVDZw7a2Z5kPvso3ZFg6bRBzLqVEh";

const headers = {
  token: API_KEY,
  accept: "application/json"
};

// Get CHAR price from Solscan API
async function getCharPrice() {
    try {
      const res = await axios.get(
        `https://pro-api.solscan.io/v2.0/token/price?address=${TOKEN_MINT}`,
        { headers }
      );
      // DEBUG:
      // console.log("DEBUG: price API result", res.data);
  
      // If the API returns price history (array), pick the last price
      const history = res.data?.data;
      if (Array.isArray(history) && history.length > 0) {
        return history[history.length - 1].price || 0;
      }
  
      // Fallback to .priceUsdt (for old response style)
      return res.data?.data?.priceUsdt || 0;
    } catch (err) {
      console.error("❌ Error fetching CHAR price:", err.response?.data || err.message);
      return 0;
    }
  }
  

// ✅ Get CHAR transaction count & total 1% fee
async function getCharTxStats(owner) {
  const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${owner}&page=1&page_size=100&sort_by=block_time&sort_order=desc`;

  try {
    const res = await axios.get(url, { headers });
    const transfers = res.data?.data || [];

    const charTransfers = transfers.filter(tx => tx.token_address === TOKEN_MINT);
    const totalTxs = charTransfers.length;

    let totalFee = 0;
    for (const tx of charTransfers) {
      const rawAmount = tx.amount || 0;
      const decimals = tx.token_decimals || 6;
      const amount = rawAmount / Math.pow(10, decimals);
      totalFee += amount * 0.01;
    }

    return {
      totalTxs,
      totalFee: parseFloat(totalFee.toFixed(4))
    };
  } catch (err) {
    console.error("Error fetching CHAR txs:", err.response?.data || err.message);
    return {
      totalTxs: 0,
      totalFee: 0
    };
  }
}

// Main function to fetch and display stats
(async () => {
  const stats = await getCharTxStats(HOLDER_OWNER);
  const price = await getCharPrice();
  const usd = (stats.totalFee * price).toFixed(2);

  console.log(`\n CHAR Donation Stats for ${HOLDER_OWNER}:\n`);
  console.log(` CHAR price fetched: $${price}`);
  console.log(` Total CHAR transactions: ${stats.totalTxs}`);
  console.log(` Donated So Far: ${stats.totalFee} CHAR`);
  console.log(` USD Equivalent: $${usd}`);
})();
