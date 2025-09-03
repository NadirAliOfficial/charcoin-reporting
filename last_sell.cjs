// last-sell.cjs
require('dotenv/config');
const axios = require('axios');

const WALLET = process.env.WALLET;
const CHAR_MINT = process.env.CHAR_MINT;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

if (!WALLET || !CHAR_MINT || !HELIUS_API_KEY) {
  console.error('Set WALLET, CHAR_MINT, HELIUS_API_KEY in .env');
  process.exit(1);
}

const ago = (tsSec) => {
  if (!tsSec) return 'unknown';
  const ms = Date.now() - tsSec * 1000;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ago`;
  if (h > 0) return `${h}h ${m % 60}m ago`;
  if (m > 0) return `${m}m ${s % 60}s ago`;
  return `${s}s ago`;
};

async function getLastSellViaHelius() {
  const url = `https://api.helius.xyz/v0/addresses/${WALLET}/transactions?api-key=${HELIUS_API_KEY}`;
  const { data } = await axios.get(url, { timeout: 20000 });

  for (const tx of data || []) {
    const transfers = tx.tokenTransfers || [];
    for (const t of transfers) {
      // Outgoing CHAR from this wallet = sell-like (or transfer out)
      if (t.mint === CHAR_MINT && t.fromUserAccount === WALLET) {
        const ts = tx.timestamp || null;
        return {
          signature: tx.signature,
          timestamp: ts ? new Date(ts * 1000).toISOString() : 'unknown',
          when: ts ? ago(ts) : 'unknown',
          amountOut: Number(t.tokenAmount),
          mint: t.mint,
          from: t.fromUserAccount,
          to: t.toUserAccount,
          reason: 'Outgoing CHAR from this wallet (sell/transfer out)',
        };
      }
    }
  }
  return null;
}

(async function main() {
  try {
    const res = await getLastSellViaHelius();
    if (!res) {
      console.log('No outgoing CHAR (SELL) found in the recent history.');
      process.exit(0);
    }
    console.log('Last SELL-like event:');
    console.table(res);
    if (res.signature) {
      console.log(`Explorer: https://solscan.io/tx/${res.signature}`);
    }
  } catch (e) {
    console.error('Error:', e?.response?.data || e.message || e);
    process.exit(1);
  }
})();
