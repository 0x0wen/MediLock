/**
 * Simple script to request SOL airdrop on Solana Devnet
 * Usage: node solana-airdrop.js <your-wallet-address>
 */

const {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} = require("@solana/web3.js");

async function requestAirdrop() {
  try {
    if (process.argv.length < 3) {
      console.error("Please provide a wallet address as command line argument");
      console.error("Usage: node solana-airdrop.js <your-wallet-address>");
      process.exit(1);
    }

    // Get wallet address from command line arguments
    const walletAddress = process.argv[2];

    // Validate wallet address
    let publicKey;
    try {
      publicKey = new PublicKey(walletAddress);
      console.log(`Wallet address valid: ${publicKey.toString()}`);
    } catch (error) {
      console.error(
        "Invalid wallet address. Please provide a valid Solana address."
      );
      process.exit(1);
    }

    // Connect to Solana Devnet
    console.log("Connecting to Solana Devnet...");
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Request airdrop (2 SOL)
    const amount = 2 * LAMPORTS_PER_SOL; // 2 SOL
    console.log(
      `Requesting ${
        amount / LAMPORTS_PER_SOL
      } SOL airdrop for ${publicKey.toString()}...`
    );

    const signature = await connection.requestAirdrop(publicKey, amount);
    console.log(`Airdrop requested. Transaction signature: ${signature}`);

    // Wait for confirmation
    console.log("Waiting for transaction confirmation...");
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature,
    });

    console.log("✅ Airdrop successful!");
    console.log(
      `📊 Transaction details: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );

    // Get balance to verify
    const balance = await connection.getBalance(publicKey);
    console.log(`💰 Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    process.exit(1);
  }
}

requestAirdrop();
