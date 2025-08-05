const axios = require("axios");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
require("dotenv").config();


const API_KEY = process.env.SOLSCAN_API_KEY;
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";
const PAGE_SIZE = 10;

// 🟡 CHANGE THESE
const startDate = new Date("2025-07-26");
const endDate = new Date("2025-08-03");
const minUsd = 50;

const headers = {
  token: API_KEY,
  accept: "application/json"
};

const csvWriter = createCsvWriter({
  path: "charcoin_holders_filtered.csv",
  header: [
    { id: "wallet", title: "Wallet Address" },
    { id: "txs", title: "Transactions (CHAR)" },
    { id: "char", title: "Balance CHAR" },
    { id: "usd", title: "Balance USD" },
    { id: "firstTx", title: "Registration (First Tx)" },
    { id: "lastTx", title: "Last Tx" }
  ]
});

async function getAllHolders() {
  const all = [];
  let page = 1;

  while (true) {
    const url = `https://pro-api.solscan.io/v2.0/token/holders?address=${TOKEN_MINT}&page=${page}&page_size=${PAGE_SIZE}`;
    try {
      const res = await axios.get(url, { headers });
      const items = res.data?.data?.items || [];
      all.push(...items);
      console.log(`📦 Page ${page} fetched, total holders: ${all.length}`);
      if (items.length < PAGE_SIZE) break;
      page++;
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`❌ Error on page ${page}:`, err.message);
      break;
    }
  }

  return all;
}

async function getCharStats(ownerWallet, mintAddress) {
  const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${ownerWallet}&page=1&page_size=100&sort_by=block_time&sort_order=desc`;

  try {
    const res = await axios.get(url, { headers });
    const transfers = res.data?.data?.filter(tx => tx.token_address === mintAddress) || [];

    if (transfers.length === 0) {
      return { total: 0, first: null, last: null };
    }

    const lastTime = new Date(transfers[0].block_time * 1000);
    const firstTime = new Date(transfers[transfers.length - 1].block_time * 1000);

    return { total: transfers.length, first: firstTime, last: lastTime };

  } catch (err) {
    console.error(`⚠️ Failed to get stats for ${ownerWallet}:`, err.message);
    return { total: "Error", first: null, last: null };
  }
}

function dateInRange(date) {
  return date && date >= startDate && date <= endDate;
}

async function main() {
  const holders = await getAllHolders();
  const result = [];

  for (const holder of holders) {
    const amount = holder.amount / Math.pow(10, holder.decimals);
    const usd = parseFloat(holder.value.toFixed(2));
    const stats = await getCharStats(holder.owner, TOKEN_MINT);

    const inRange = dateInRange(stats.first) || dateInRange(stats.last);
    const usdOk = usd >= minUsd;

    if (inRange && usdOk) {
      result.push({
        wallet: holder.owner,
        txs: stats.total,
        char: amount.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        usd: `$${usd.toFixed(2)}`,
        firstTx: stats.first?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) || "N/A",
        lastTx: stats.last?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) || "N/A"
      });

      console.log(`✅ ${holder.owner} matched filter`);
    } else {
      console.log(`⛔ ${holder.owner} skipped`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  await csvWriter.writeRecords(result);
  console.log(`\n✅ ${result.length} wallets saved to charcoin_holders_filtered.csv`);
}

main();
