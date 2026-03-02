/**
 * seed-markets.cjs — Create 4 seed markets on Stacks testnet.
 *
 * Usage:
 *   cd contracts && node scripts/seed-markets.cjs
 *
 * Reads the deployer mnemonic from settings/Testnet.toml.
 * Calls initialize (if not yet done), then creates 4 markets.
 */

const fs = require("fs");
const path = require("path");
const {
  makeContractCall,
  broadcastTransaction,
  uintCV,
  stringUtf8CV,
  principalCV,
  AnchorMode,
  getAddressFromPrivateKey,
  fetchCallReadOnlyFunction,
} = require("@stacks/transactions");

// @scure packages are ESM-only, use dynamic import
let HDKey, mnemonicToSeedSync;
async function loadESM() {
  const bip32 = await import("@scure/bip32");
  const bip39 = await import("@scure/bip39");
  HDKey = bip32.HDKey;
  mnemonicToSeedSync = bip39.mnemonicToSeedSync;
}

// ── Config ──────────────────────────────────────────────────────────────────

const API_URL = "https://api.testnet.hiro.so";
const DEPLOYER = "ST1XHPEWSZYNN2QA9QG9JG9GHRVF6GZSFRWTFB5VV";
const CONTRACT = "prediction-market";

// Seed markets from README
const SEED_MARKETS = [
  {
    question: "Will Bitcoin surpass $150,000 by June 30, 2026?",
    imageUrl: "/images/markets/btc.png",
    durationBlocks: 172800, // ~120 days
  },
  {
    question: "Will STX reach $5 by May 15, 2026?",
    imageUrl: "/images/markets/stx.png",
    durationBlocks: 108000, // ~75 days
  },
  {
    question: "Will Ethereum surpass $8,000 by July 31, 2026?",
    imageUrl: "/images/markets/eth.png",
    durationBlocks: 216000, // ~150 days
  },
  {
    question: "Will Solana flip BNB in market cap by April 30, 2026?",
    imageUrl: "/images/markets/sol.png",
    durationBlocks: 86400, // ~60 days
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function readMnemonic() {
  const tomlPath = path.resolve(__dirname, "../settings/Testnet.toml");
  const content = fs.readFileSync(tomlPath, "utf8");
  const match = content.match(/mnemonic\s*=\s*"([^"]+)"/);
  if (!match) throw new Error("Could not find mnemonic in Testnet.toml");
  return match[1];
}

function derivePrivateKey(mnemonic) {
  // Standard Stacks derivation path: m/44'/5757'/0'/0/0
  const seed = mnemonicToSeedSync(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive("m/44'/5757'/0'/0/0");
  if (!child.privateKey) throw new Error("Failed to derive private key");
  // Return hex string (Stacks expects 33-byte compressed key with 01 suffix)
  const hex = Buffer.from(child.privateKey).toString("hex") + "01";
  return hex;
}

async function getNonce(address) {
  const res = await fetch(`${API_URL}/v2/accounts/${address}`);
  const data = await res.json();
  return data.nonce;
}

async function getMarketCount() {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: DEPLOYER,
    contractName: CONTRACT,
    functionName: "get-market-count",
    functionArgs: [],
    network: "testnet",
    senderAddress: DEPLOYER,
  });
  // result is a ClarityValue with type UInt
  return Number(result.value);
}

async function isInitialized() {
  // Try reading market count. If the contract isn't initialized,
  // it still returns 0, so we check the initialized var via get-accumulated-fees or similar.
  // Actually, initialized is a data-var. Let's just try calling get-market-count — it works
  // regardless of initialization. We'll read the nonce to see if initialize was called.
  // Simplest: try to read market count and check if > 0.
  // Better: try calling initialize and let it fail gracefully if already done.
  return false; // We'll attempt initialize and handle error
}

async function broadcastAndWait(tx) {
  const result = await broadcastTransaction({ transaction: tx, network: "testnet" });

  if (typeof result === "object" && result.error) {
    console.error("  Broadcast error:", result.error, result.reason);
    return null;
  }

  const txid = typeof result === "string" ? result : result.txid;
  console.log(`  Broadcast OK — txid: ${txid}`);
  console.log(`  Explorer: https://explorer.hiro.so/txid/${txid}?chain=testnet`);

  // Wait for confirmation (up to 20 minutes)
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(20000); // 20s
    try {
      const res = await fetch(`${API_URL}/extended/v1/tx/${txid}`);
      const data = await res.json();
      if (data.tx_status === "success") {
        console.log("  ✓ Confirmed!");
        return txid;
      }
      if (data.tx_status === "abort_by_response" || data.tx_status === "abort_by_post_condition") {
        console.error(`  ✗ Transaction aborted: ${data.tx_status}`);
        if (data.tx_result) console.error(`    Result: ${JSON.stringify(data.tx_result)}`);
        return null;
      }
      process.stdout.write(".");
    } catch {
      process.stdout.write("?");
    }
  }
  console.log("\n  ⚠ Timed out waiting for confirmation");
  return txid;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await loadESM();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  iPredict — Seed Market Creator (Testnet)");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Derive key
  const mnemonic = readMnemonic();
  const privateKey = derivePrivateKey(mnemonic);
  const address = getAddressFromPrivateKey(privateKey, "testnet");
  console.log(`Deployer address: ${address}`);

  if (address !== DEPLOYER) {
    console.error(`  ✗ Derived address ${address} does not match expected ${DEPLOYER}`);
    console.error("  Check your mnemonic in settings/Testnet.toml");
    process.exit(1);
  }

  // 2. Check current state
  let nonce = await getNonce(address);
  const marketCount = await getMarketCount();
  console.log(`Current nonce: ${nonce}`);
  console.log(`Current market count: ${marketCount}\n`);

  if (marketCount >= 4) {
    console.log("✓ 4 seed markets already exist. Nothing to do.");
    return;
  }

  // 3. Initialize (if needed — will fail gracefully if already done)
  if (marketCount === 0) {
    console.log("Step 1: Calling initialize...");
    try {
      const initTx = await makeContractCall({
        contractAddress: DEPLOYER,
        contractName: CONTRACT,
        functionName: "initialize",
        functionArgs: [
          principalCV(`${DEPLOYER}.${CONTRACT}`),
        ],
        senderKey: privateKey,
        network: "testnet",
        anchorMode: AnchorMode.Any,
        nonce: nonce++,
        fee: 50000, // 0.05 STX
      });
      const initResult = await broadcastAndWait(initTx);
      if (!initResult) {
        console.log("  Initialize may have already been called. Continuing...\n");
      }
    } catch (err) {
      console.log(`  Initialize attempt: ${err.message}. Continuing...\n`);
    }
  }

  // 4. Create seed markets
  const startIdx = marketCount;
  const marketsToCreate = SEED_MARKETS.slice(startIdx);

  for (let i = 0; i < marketsToCreate.length; i++) {
    const m = marketsToCreate[i];
    const marketNum = startIdx + i + 1;
    console.log(`\nStep ${i + 2}: Creating market #${marketNum}`);
    console.log(`  Question: "${m.question}"`);
    console.log(`  Duration: ${m.durationBlocks} blocks (~${Math.round(m.durationBlocks * 10 / 60 / 24)} days)`);

    const tx = await makeContractCall({
      contractAddress: DEPLOYER,
      contractName: CONTRACT,
      functionName: "create-market",
      functionArgs: [
        stringUtf8CV(m.question),
        stringUtf8CV(m.imageUrl),
        uintCV(m.durationBlocks),
      ],
      senderKey: privateKey,
      network: "testnet",
      anchorMode: AnchorMode.Any,
      nonce: nonce++,
      fee: 50000, // 0.05 STX
    });

    await broadcastAndWait(tx);
  }

  // 5. Verify
  await sleep(5000);
  const finalCount = await getMarketCount();
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  Done! Market count: ${finalCount}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
