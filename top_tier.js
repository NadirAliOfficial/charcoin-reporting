const axios = require("axios");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
require("dotenv").config();

const API_KEY = process.env.SOLSCAN_API_KEY;
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";
const PAGE_SIZE = 40;

// ==== CONFIGURE ====
const DAYS = 30;        // Last X days
const TOP_N = 10;       // How many top wallets

const headers = {
  token: API_KEY,
  accept: "application/json"
};

const csvWriter = createCsvWriter({
  path: "char_top_tier_wallets.csv",
  header: [
    { id: "wallet", title: "Wallet Address" },
    { id: "totalChar", title: "Total CHAR Moved" },
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

// Calculate total CHAR moved in last X days for this wallet
async function getTotalCharInPeriod(walletAddress, minTimestamp) {
  const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${walletAddress}&page=1&page_size=100&sort_by=block_time&sort_order=desc`;
  try {
    const res = await axios.get(url, { headers });
    const txs = res.data?.data || [];
    const charTxs = txs.filter(tx =>
      tx.token_address === TOKEN_MINT && tx.block_time >= minTimestamp
    );
    let totalChar = 0;
    let lastTxDate = null;
    for (const tx of charTxs) {
      const amount = (tx.amount || 0) / Math.pow(10, tx.token_decimals || 6);
      totalChar += amount;
      if (!lastTxDate || tx.block_time > lastTxDate) lastTxDate = tx.block_time;
    }
    return {
      totalChar: parseFloat(totalChar.toFixed(2)),
      lastTxDate: lastTxDate
        ? new Date(lastTxDate * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : null
    };
  } catch (err) {
    return { totalChar: 0, lastTxDate: null };
  }
}

// MAIN
(async () => {
  const minTimestamp = getMinTimestamp(DAYS);
  const holders = await getAllHolders();

  const stats = [];
  let checked = 0;
  for (const h of holders) {
    checked++;
    process.stdout.write(`\r🔍 [${checked}/${holders.length}] Checking: ${h.address.slice(0,8)}...   `);
    const { totalChar, lastTxDate } = await getTotalCharInPeriod(h.owner, minTimestamp);
    if (totalChar > 0) {
      stats.push({ wallet: h.address, totalChar, lastTxDate });
      console.log(`✅ ${h.address} — CHAR moved: ${totalChar} (Last CHAR tx: ${lastTxDate})`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // Sort by totalChar descending
  const topStats = stats.sort((a, b) => b.totalChar - a.totalChar).slice(0, TOP_N);

  console.log(`\n🏆 TOP ${TOP_N} CHAR TIER WALLETS (last ${DAYS} days):`);
  topStats.forEach((w, i) =>
    console.log(`${i + 1}. ${w.wallet} — ${w.totalChar} CHAR (Last CHAR tx: ${w.lastTxDate})`)
  );

  await csvWriter.writeRecords(topStats);
  console.log(`\n✅ Top tier wallets saved to char_top_tier_wallets.csv`);
})();
