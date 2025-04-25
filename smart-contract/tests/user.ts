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
  const testNik = "1234567890123456";
  const testFullName = "John Doe";
  const testBloodType = "A+";
  const testBirthdate = 946684800000; // January 1, 2000
  const testGender = { male: {} }; // Can be { male: {} }, { female: {} }, or { other: {} }
  const testEmail = "john.doe@example.com";
  const testPhoneNumber = "0811234567890";
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
        .register(
          testNik,
          testFullName,
          testBloodType,
          new anchor.BN(testBirthdate),
          testGender,
          testEmail,
          testPhoneNumber,
          userRole
        )
        .accounts({
          userAccount: userPDA,
          authority: authority,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .rpc();
  
      console.log("Transaction signature:", tx);
  
      // Fetch the user account data
      const userAccount = await program.account.user.fetch(userPDA);
  
      // Verify the account data
      expect(userAccount.nik).to.equal(testNik);
      expect(userAccount.fullName).to.equal(testFullName);
      expect(userAccount.bloodType).to.equal(testBloodType);
      expect(userAccount.birthdate.toString()).to.equal(testBirthdate.toString());
      expect(JSON.stringify(userAccount.gender)).to.equal(JSON.stringify(testGender));
      expect(userAccount.email).to.equal(testEmail);
      expect(userAccount.phoneNumber).to.equal(testPhoneNumber);
      expect(userAccount.publicKey.toString()).to.equal(authority.toString());
      expect(JSON.stringify(userAccount.role)).to.equal(JSON.stringify(userRole));
      expect(userAccount.createdAt.toNumber()).to.be.greaterThan(0);
    } catch (e) {
      console.error("Error in registration test:", e);
      throw e;
    }
  });

  it("Should fail when trying to register twice with same authority", async () => {
    try {
      await program.methods
        .register(
          "9876543210987654",
          "Jane Doe",
          "O-",
          new anchor.BN(978307200000), // January 1, 2001
          { female: {} },
          "jane.doe@example.com",
          "0819876543210",
          userRole
        )
        .accounts({
          userAccount: userPDA,
          authority: authority,
          systemProgram: anchor.web3.SystemProgram.programId
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
    
    const doctorNik = "9876543210123456";
    const doctorFullName = "Dr. Jane Smith";
    const doctorBloodType = "B+";
    const doctorBirthdate = 915148800000; // January 1, 1999
    const doctorGender = { female: {} };
    const doctorEmail = "dr.smith@hospital.com";
    const doctorPhoneNumber = "0811122334455";
    
    await program.methods
      .register(
        doctorNik,
        doctorFullName,
        doctorBloodType,
        new anchor.BN(doctorBirthdate),
        doctorGender,
        doctorEmail,
        doctorPhoneNumber,
        doctorRole
      )
      .accounts({
        userAccount: doctorPDA,
        authority: doctorWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([doctorWallet])
      .rpc();
    
    const doctorAccount = await program.account.user.fetch(doctorPDA);
    expect(doctorAccount.nik).to.equal(doctorNik);
    expect(doctorAccount.fullName).to.equal(doctorFullName);
    expect(doctorAccount.bloodType).to.equal(doctorBloodType);
    expect(doctorAccount.birthdate.toString()).to.equal(doctorBirthdate.toString());
    expect(JSON.stringify(doctorAccount.gender)).to.equal(JSON.stringify(doctorGender));
    expect(doctorAccount.email).to.equal(doctorEmail);
    expect(doctorAccount.phoneNumber).to.equal(doctorPhoneNumber);
    expect(JSON.stringify(doctorAccount.role)).to.equal(JSON.stringify(doctorRole));
  });
});