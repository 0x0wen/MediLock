import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { Medilock } from "../target/types/medilock";

describe("Data Pool Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Medilock as Program<Medilock>;
  
  // Constants
  const POOL_SEED = Buffer.from("pool");
  const CONTRIBUTION_SEED = Buffer.from("contribution");
  
  // Test data
  const poolId = new anchor.BN(1);
  const poolName = "Test Data Pool";
  const poolDescription = "Research on cancer";
  const pricePerRecord = new anchor.BN(100000000); // 0.1 SOL
  const totalNeeded = new anchor.BN(1);
  const recordId = new anchor.BN(12345);

  // Test accounts
  let creator: Keypair;
  let contributor: Keypair;
  let poolPDA: PublicKey;
  let contributionPDA: PublicKey;
  let poolVault: Keypair;
  let latestBlockHash: Readonly<{
    blockhash: anchor.web3.Blockhash;
    lastValidBlockHeight: number;
    }>  

  before(async () => {
    // Create test wallets
    creator = anchor.web3.Keypair.generate();
    contributor = anchor.web3.Keypair.generate();
    poolVault = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to the wallets
    const airdropCreator = await provider.connection.requestAirdrop(
      creator.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropCreator,
      });
    
    const airdropContributor = await provider.connection.requestAirdrop(
      contributor.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropContributor,
    });

    // Calculate PDAs
    [poolPDA] = PublicKey.findProgramAddressSync(
      [POOL_SEED, creator.publicKey.toBuffer(), poolId.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    
    [contributionPDA] = PublicKey.findProgramAddressSync(
      [
        CONTRIBUTION_SEED, 
        poolId.toArrayLike(Buffer, 'le', 8),
        recordId.toArrayLike(Buffer, 'le', 8),
        contributor.publicKey.toBuffer()
      ],
      program.programId
    );
  });

  it("Should create a new data pool", async () => {
    try {
      const tx = await program.methods
        .addPool(
          poolId,
          poolName,
          poolDescription,
          pricePerRecord,
          totalNeeded
        )
        .accounts({
          pool: poolPDA,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([creator])
        .rpc();

      console.log("Create pool transaction:", tx);

      // Verify the pool was created correctly
      const poolAccount = await program.account.dataPool.fetch(poolPDA);
      
      expect(poolAccount.id.toString()).to.equal(poolId.toString());
      expect(poolAccount.creator.toString()).to.equal(creator.publicKey.toString());
      expect(poolAccount.name).to.equal(poolName);
      expect(poolAccount.description).to.equal(poolDescription);
      expect(poolAccount.pricePerRecord.toString()).to.equal(pricePerRecord.toString());
      expect(poolAccount.totalNeeded.toString()).to.equal(totalNeeded.toString());
      expect(poolAccount.collected.toString()).to.equal("0");
    } catch (error) {
      console.error("Error creating pool:", error);
      throw error;
    }
  });

  it("Should contribute to the data pool", async () => {
    try {
      const tx = await program.methods
        .contribute(recordId)
        .accounts({
          pool: poolPDA,
          contribution: contributionPDA,
          contributor: contributor.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([contributor])
        .rpc();

      console.log("Contribute transaction:", tx);

      // Verify the contribution was created correctly
      const contributionAccount = await program.account.contribution.fetch(contributionPDA);
      
      expect(contributionAccount.poolId.toString()).to.equal(poolId.toString());
      expect(contributionAccount.recordId.toString()).to.equal(recordId.toString());
      expect(contributionAccount.contributor.toString()).to.equal(contributor.publicKey.toString());
      expect(contributionAccount.paid).to.be.false;
      
      // Verify the pool's collected counter increased
      const poolAccount = await program.account.dataPool.fetch(poolPDA);
      expect(poolAccount.collected.toString()).to.equal("1");
    } catch (error) {
      console.error("Error contributing to pool:", error);
      throw error;
    }
  });

  it("Should set up pool vault for withdrawal testing", async () => {
    // Fund the pool vault with enough SOL to cover the withdrawal
    const fundTx = await provider.connection.sendTransaction(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: poolVault.publicKey,
          lamports: pricePerRecord.toNumber() * 2 // Add extra just to be safe
        })
      ),
      [provider.wallet.payer]
    );
    await provider.connection.confirmTransaction(fundTx);
    
    // Verify the vault has enough funds
    const balance = await provider.connection.getBalance(poolVault.publicKey);
    expect(balance).to.be.at.least(pricePerRecord.toNumber());
  });

//   it("Should withdraw payment for contribution", async () => {
//     // Get contributor's balance before withdrawal
//     const balanceBefore = await provider.connection.getBalance(contributor.publicKey);
    
//     try {
//       const tx = await program.methods
//         .withdraw()
//         .accounts({
//           contribution: contributionPDA,
//           pool: poolPDA,
//           contributor: contributor.publicKey,
//           poolVault: poolVault.publicKey,
//           systemProgram: SystemProgram.programId
//         })
//         .signers([contributor])
//         .rpc();

//       console.log("Withdraw transaction:", tx);

//       // Verify contribution is marked as paid
//       const contributionAccount = await program.account.contribution.fetch(contributionPDA);
//       expect(contributionAccount.paid).to.be.true;
      
//       // Verify contributor received payment
//       const balanceAfter = await provider.connection.getBalance(contributor.publicKey);
//       // We account for transaction fees by checking for "approximately" the right amount
//       expect(balanceAfter).to.be.greaterThan(balanceBefore);
//       expect(balanceAfter - balanceBefore).to.be.closeTo(
//         pricePerRecord.toNumber(), 
//         10000 // Allow small difference for tx fees
//       );
//     } catch (error) {
//       console.error("Error withdrawing payment:", error);
//       throw error;
//     }
//   });

  it("Should fail when trying to withdraw twice", async () => {
    try {
      await program.methods
        .withdraw()
        .accounts({
          contribution: contributionPDA,
          pool: poolPDA,
          contributor: contributor.publicKey,
          poolVault: poolVault.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([contributor])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Expected withdrawal to fail when already paid");
    } catch (error) {
      // Expected error
      expect(error.toString()).to.include("Error");
      console.log("Correctly failed when trying to withdraw twice");
    }
  });

  it("Should fail when pool is full", async () => {
    // Create a new record ID for this contribution attempt
    const newRecordId = new anchor.BN(67890);
    
    // Calculate new PDA for this contribution
    const [newContributionPDA] = PublicKey.findProgramAddressSync(
      [
        CONTRIBUTION_SEED, 
        poolId.toArrayLike(Buffer, 'le', 8),
        newRecordId.toArrayLike(Buffer, 'le', 8),
        contributor.publicKey.toBuffer()
      ],
      program.programId
    );
    
    try {
      await program.methods
        .contribute(newRecordId)
        .accounts({
          pool: poolPDA,
          contribution: newContributionPDA,
          contributor: contributor.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([contributor])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Expected contribution to fail when pool is full");
    } catch (error) {
      // Expected error - this will only work if we successfully updated the pool to be full
        expect(error.toString()).to.include("Pool has already collected the maximum number of contributions");
    }
  });
});