const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.SOLSCAN_API_KEY;
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";

// 👇 Replace this with holder.owner address
const HOLDER_OWNER = "3ysUct4aGjG4sW6HLERsyVD2WqeJTzuXMFWNbBFPpinz";

const headers = {
  token: API_KEY,
  accept: "application/json",
};

async function getTotalCharTxs(owner) {
  let page = 1;
  let allTransfers = [];

  while (true) {
    const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${owner}&page=${page}&page_size=100&sort_by=block_time&sort_order=desc`;

    try {
      const res = await axios.get(url, { headers });
      const transfers = res.data?.data || [];

      if (transfers.length === 0) break; // no more pages

      allTransfers = allTransfers.concat(transfers);
      page++;
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
      break;
    }
  }

  // Filter for CHAR-related transfers
  const charTransfers = allTransfers.filter(
    (tx) =>
      tx.token_address === TOKEN_MINT || // direct transfer
      tx.change_amount?.token_address === TOKEN_MINT // sometimes nested here
  );

  return charTransfers.length;
}

(async () => {
  const total = await getTotalCharTxs(HOLDER_OWNER);
  console.log(`🔢 Total CHAR transactions for ${HOLDER_OWNER}: ${total}`);
})();
