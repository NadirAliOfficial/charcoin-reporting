// Example: Fetch CHAR/USDT OHLCV (daily candles) from GeckoTerminal

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const POOL_ID = "37RvFVQerdbKxrUJJ8U5dUg3S7QjMwkURYpwkKtwFmAm";
const BASE = "https://api.geckoterminal.com/api/v2";

async function getOHLCV() {
  const url = `${BASE}/networks/solana/pools/${POOL_ID}/ohlcv/day?aggregate=1&limit=1000`;
  const res = await fetch(url);
  const json = await res.json();

  const ohlcv = json.data.attributes.ohlcv_list.map(candle => ({
    timestamp: new Date(candle[0] * 1000),  // UNIX → JS Date
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5],
  }));

  console.log(ohlcv.slice(0,5)); // print first 5 rows
}

getOHLCV();
