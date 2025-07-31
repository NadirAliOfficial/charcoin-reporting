const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.SOLSCAN_API_KEY;
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";

// 👇 Replace this with holder.owner address
const HOLDER_OWNER = "34vReZu1vXhyCkBYVDZw7a2Z5kPvso3ZFg6bRBzLqVEh";

const headers = {
  token: API_KEY,
  accept: "application/json"
};

async function getTotalCharTxs(owner) {
  const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${owner}&page=1&page_size=100&sort_by=block_time&sort_order=desc`;

  try {
    const res = await axios.get(url, { headers });
    const transfers = res.data?.data || [];
    const charTransfers = transfers.filter(tx => tx.token_address === TOKEN_MINT);
    return charTransfers.length;
  } catch (err) {
    console.error(" Error:", err.response?.data || err.message);
    return 0;
  }
}

(async () => {
  const total = await getTotalCharTxs(HOLDER_OWNER);
  console.log(`🔢 Total CHAR transactions for ${HOLDER_OWNER}: ${total}`);
})();
