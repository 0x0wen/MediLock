import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";

// Import your program's IDL
import { Medilock } from "../target/types/medilock";

describe("Register Instruction Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Medilock as Program<Medilock>;
  const authority = provider.wallet.publicKey;
  
  // Test data
  const testDid = "did:example:123456789abcdef";
  const userRole = { patient: {} }; // You can also test with { doctor: {} }

  // Calculate PDA for user account
  const USER_SEED = Buffer.from("user");
  const [userPDA, _] = PublicKey.findProgramAddressSync(
    [USER_SEED, authority.toBuffer()],
    program.programId
  );

  it("Should register a new user", async () => {
    try {
      // Execute the register instruction
      try {
        await program.account.user.fetch(userPDA);
        console.log("Test skipped: User already registered");
        return; // Skip test if account exists
      } catch (e) {
        // Account doesn't exist, proceed with test
      }
      const tx = await program.methods
        .register(testDid, userRole)
        .accounts({
          user_account: userPDA,
          authority: authority,
          system_program: anchor.web3.SystemProgram.programId
        })
        .rpc();
  
      console.log("Transaction signature:", tx);
  
      // Fetch the user account data
      const userAccount = await program.account.user.fetch(userPDA);
  
      // Verify the account data
      expect(userAccount.did).to.equal(testDid);
      expect(userAccount.publicKey.toString()).to.equal(authority.toString());
      expect(JSON.stringify(userAccount.role)).to.equal(JSON.stringify(userRole));
      expect(userAccount.createdAt.toNumber()).to.be.greaterThan(0);
    } catch (e) {
      if (e.toString().includes("UserAlreadyRegistered")) {
        console.log("Test skipped: User already registered");
        // Skip this test or handle it accordingly
        return;
      } else {
        console.error("Unexpected error:", e);
        throw e;
      }
    }
  });

  it("Should fail when trying to register twice with same authority", async () => {
    try {
      await program.methods
        .register("did:example:duplicate", userRole)
        .accounts({
          user_account: userPDA,  // Fixed: using snake_case
          authority: authority,
          system_program: anchor.web3.SystemProgram.programId  // Fixed: using snake_case
        })
        .rpc();
      
      // If we reach here, the test should fail
      expect.fail("Expected transaction to fail");
    } catch (e) {
      // Expected error since the account is already initialized
      expect(e.toString()).to.include("Error");
    }
  });

  it("Should register a doctor role", async () => {
    const doctorRole = { doctor: {} };
    const doctorWallet = anchor.web3.Keypair.generate();
    
    // Airdrop some SOL to the doctor wallet
    const airdropSignature = await provider.connection.requestAirdrop(
      doctorWallet.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    
    // Calculate PDA for the doctor user
    const [doctorPDA, _] = PublicKey.findProgramAddressSync(
      [USER_SEED, doctorWallet.publicKey.toBuffer()],
      program.programId
    );
    
    const doctorDid = "did:example:doctor123";
    await program.methods
      .register(doctorDid, doctorRole)
      .accounts({
        user_account: doctorPDA,  // Fixed: using snake_case
        authority: doctorWallet.publicKey,
        system_program: anchor.web3.SystemProgram.programId  // Fixed: using snake_case
      })
      .signers([doctorWallet])
      .rpc();
    
    const doctorAccount = await program.account.user.fetch(doctorPDA);
    console.log(JSON.stringify(doctorAccount))
    console.log(JSON.stringify(doctorDid))
    expect(doctorAccount.did).to.equal(doctorDid);
    expect(JSON.stringify(doctorAccount.role)).to.equal(JSON.stringify(doctorRole));
  });
});