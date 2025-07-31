const axios = require("axios");

const TOKEN_MINT = "charyAhpBstVjf5VnszNiY8UUVDbvA167dQJqpBY2hw";

async function getDexScreenerStats() {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`;
  try {
    const res = await axios.get(url);
    // Sometimes there are multiple pools; pick the first one with volume
    const pool = res.data.pairs.find(p => p.volume && p.volume.h24);
    if (!pool) throw new Error("No data for this token yet");

    const priceUsd = pool.priceUsd;
    const volume24h = pool.volume.h24;
    const volume7d = pool.volume.d7 || 0; // fallback to 0
    const volume1m = pool.volume.m1 || 0; // fallback to 0
    const priceChange24h = pool.priceChange.h24; // as percent, can be negative
    
    console.log(`💸 CHAR 24h Volume: $${Number(volume24h).toLocaleString()}`);
    console.log(`📊 CHAR 7d Volume: $${Number(volume7d).toLocaleString()}`);
    console.log(`📈 CHAR 30d Volume: $${Number(volume1m).toLocaleString()}`);
    console.log(`📈 CHAR price: $${priceUsd}`);
    console.log(`🔺 24h Price Change: ${priceChange24h}%`);
    
    return {
      priceUsd,
      volume24h,
      priceChange24h
    };
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

getDexScreenerStats();
