const axios = require("axios");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTM4OTk5MTgzNDIsImVtYWlsIjoiaGVsbG9AY2hhcmNvaW4ub3JnIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzUzODk5OTE4fQ.ag5imHIn4_imWHeDUxQCqgrzsv8VEpidom9BnueZTuk";  
const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";
const PAGE_SIZE = 10;

const headers = {
  token: API_KEY,
  accept: "application/json"
};

const csvWriter = createCsvWriter({
  path: "charcoin_holders_detailed.csv",
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
    const res = await axios.get(url, { headers });

    const items = res.data?.data?.items || [];
    all.push(...items);
    console.log(`📦 Page ${page} fetched, total holders so far: ${all.length}`);

    if (items.length < PAGE_SIZE) break;
    page++;
    await new Promise(r => setTimeout(r, 300)); // prevent rate limit
  }

  return all;
}

async function getCharStats(ownerWallet, mintAddress) {
  const url = `https://pro-api.solscan.io/v2.0/account/transfer?address=${ownerWallet}&page=1&page_size=100&sort_by=block_time&sort_order=desc`;

  try {
    const res = await axios.get(url, { headers });
    const transfers = res.data?.data?.filter(tx => tx.token_address === mintAddress) || [];

    if (transfers.length === 0) {
      return {
        total: 0,
        first: "N/A",
        last: "N/A"
      };
    }

    const lastTime = new Date(transfers[0].block_time * 1000);
    const firstTime = new Date(transfers[transfers.length - 1].block_time * 1000);

    const format = { month: "short", day: "numeric", year: "numeric" };

    return {
      total: transfers.length,
      first: firstTime.toLocaleDateString("en-US", format),
      last: lastTime.toLocaleDateString("en-US", format)
    };

  } catch (err) {
    return {
      total: "Error",
      first: "Failed",
      last: "Failed"
    };
  }
}

async function main() {
  const holders = await getAllHolders();
  const result = [];

  for (const holder of holders) {
    const amount = holder.amount / Math.pow(10, holder.decimals);
    const stats = await getCharStats(holder.owner, TOKEN_MINT);

    result.push({
      wallet: holder.address,
      txs: stats.total,
      char: amount.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      usd: `$${holder.value.toFixed(2)}`,
      firstTx: stats.first,
      lastTx: stats.last
    });

    console.log(`${holder.owner} → Tx: ${stats.total}, First: ${stats.first}, Last: ${stats.last}`);
    await new Promise(r => setTimeout(r, 300)); // delay to prevent hitting rate limit
  }

  await csvWriter.writeRecords(result);
  console.log("\n All data saved to charcoin_holders_detailed.csv");
}

main();
