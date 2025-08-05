const axios = require("axios");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
require("dotenv").config();

const API_KEY = process.env.SOLSCAN_API_KEY;
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";
const PAGE_SIZE = 40;

const DAYS = 5;        // Last X days (change as needed)
const WINNERS = 10;     // How many wallets to pick

const headers = {
  token: API_KEY,
  accept: "application/json"
};

const csvWriter = createCsvWriter({
  path: "charity_lottery_winners.csv",
  header: [
    { id: "wallet", title: "Wallet Address" },
    { id: "lastTxDate", title: "Last CHAR Tx Date" }
  ]
});

// Helpers
function getMinTimestamp(daysAgo) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  return Math.floor(now.getTime() / 1000);
}

function shuffle(array) {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m]; array[m] = array[i]; array[i] = t;
  }
  return array;
}

async function getAllHolders() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `https://pro-api.solscan.io/v2.0/token/holders?address=${TOKEN_MINT}&page=${page}&page_size=${PAGE_SIZE}`;
    const res = await axios.get(url, { headers });
    const items = res.data?.data?.items || [];
    all.push(...items);
    console.log(`📦 Page ${page} fetched, total holders so far: ${all.length}`);
    if (items.length < PAGE_SIZE) break;
    page++;
    await new Promise(r => setTimeout(r, 250));
  }
  return all;
}

// Check for CHAR txs in last X days, return last tx date if found
async function getRecentCharTxDate(walletAddress, minTimestamp) {
  const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${walletAddress}&page=1&page_size=100&sort_by=block_time&sort_order=desc`;
  try {
    const res = await axios.get(url, { headers });
    const txs = res.data?.data || [];
    const charTxs = txs.filter(tx => tx.token_address === TOKEN_MINT);
    for (const tx of charTxs) {
      if (tx.block_time >= minTimestamp) {
        const dateStr = new Date(tx.block_time * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        return dateStr;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

// MAIN
(async () => {
  const minTimestamp = getMinTimestamp(DAYS);
  const holders = await getAllHolders();

  const eligible = [];
  let checked = 0;

  for (const h of holders) {
    checked++;
    process.stdout.write(`\r🔍 [${checked}/${holders.length}] Checking: ${h.owner.slice(0,8)}...   `);
    const lastTxDate = await getRecentCharTxDate(h.owner, minTimestamp);
    if (lastTxDate) {
      eligible.push({ wallet: h.owner, lastTxDate });
      console.log(`✅ Eligible: ${h.owner} (Last CHAR tx: ${lastTxDate})`);
    } else {
      // Uncomment to log not eligible: 
      // console.log(`❌ Not eligible: ${h.address}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n✅ TOTAL eligible wallets in last ${DAYS} days: ${eligible.length}`);

  // Pick random winners and save to CSV
  const winners = shuffle(eligible).slice(0, WINNERS);
  console.log(`\n🎉 CHARITY LOTTERY WINNERS (${WINNERS} wallets):`);
  winners.forEach((w, i) => console.log(`${i + 1}. ${w.wallet} (Last CHAR tx: ${w.lastTxDate})`));

  await csvWriter.writeRecords(winners);
  console.log(`\n✅ Winners saved to charity_lottery_winners.csv`);
})();
