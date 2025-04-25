import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect, assert } from "chai";
import { Medilock } from "../target/types/medilock";

describe('Medilock', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.Medilock as Program<Medilock>;
  
  const doctorKeypair = Keypair.generate();
  const patientKeypair = Keypair.generate();
  const authority = provider.wallet;
  
  const RECORD_SEED = Buffer.from("record");
  const ACCESS_SEED = Buffer.from("access");
  const USER_SEED = Buffer.from("user");
  
  const doctorDid = "did:web:doctor.example.com";
  const patientDid = "did:web:patient.example.com";
  const recordCid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const recordMetadata = "Medical examination results";
  const accessScope = "Read access to medical records";
  const recordCounter = 0;
  
  // Account addresses
  let doctorAddress: PublicKey;
  let patientAddress: PublicKey;
  let recordAddress: PublicKey;
  let accessRequestAddress: PublicKey;
  let latestBlockHash: Readonly<{
    blockhash: anchor.web3.Blockhash;
    lastValidBlockHeight: number;
  }>;

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropDoctor = await provider.connection.requestAirdrop(doctorKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropDoctor,
    });

    const airdropPatient = await provider.connection.requestAirdrop(patientKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropPatient,
    });

    // Calculate PDA addresses
    [doctorAddress] = PublicKey.findProgramAddressSync(
      [USER_SEED, doctorKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    [patientAddress] = PublicKey.findProgramAddressSync(
      [USER_SEED, patientKeypair.publicKey.toBuffer()],
      program.programId
    );
    
    [recordAddress] = PublicKey.findProgramAddressSync(
      [RECORD_SEED, patientAddress.toBuffer(), Buffer.from([recordCounter])],
      program.programId
    );
    
    [accessRequestAddress] = PublicKey.findProgramAddressSync(
      [ACCESS_SEED, doctorAddress.toBuffer(), patientAddress.toBuffer()],
      program.programId
    );
    
    // Register doctor and patient
    await program.methods
      .register(doctorDid, { doctor: {} })
      .accounts({
        userAccount: doctorAddress,
        authority: doctorKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([doctorKeypair])
      .rpc();
      
    await program.methods
      .register(patientDid, { patient: {} })
      .accounts({
        userAccount: patientAddress,
        authority: patientKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([patientKeypair])
      .rpc();
  });

  describe('Add Record Tests', () => {
    it('should add a medical record', async () => {
      await program.methods
        .addRecord(
          recordCounter, 
          recordCid, 
          recordMetadata
        )
        .accounts({
          recordAccount: recordAddress,
          doctorAccount: doctorAddress,
          patientAccount: patientAddress,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Fetch the record and verify data
      const recordAccount = await program.account.medicalRecord.fetch(recordAddress);
      if(!recordAccount){
        assert.fail("Account not found")
      }
      expect(recordAccount.cid).to.equal(recordCid);
      expect(recordAccount.doctorDid).to.equal(doctorDid);
      expect(recordAccount.patientDid).to.equal(patientDid);
      expect(recordAccount.metadata).to.equal(recordMetadata);
      // assert(recordAccount.timestamp > 0, "Timestamp should be set");
    });
    
    it('should fail if non-doctor tries to add record', async () => {
      // Create a non-doctor user
      const nonDoctorKeypair = Keypair.generate();
      const [nonDoctorAddress] = PublicKey.findProgramAddressSync(
        [
          USER_SEED, 
          nonDoctorKeypair.publicKey.toBuffer()
        ],
        program.programId
      );
      const airdropSignature = await provider.connection.requestAirdrop(nonDoctorKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      });
      // Register as patient
      await program.methods
        .register("did:web:another.patient.com", { patient: {} })
        .accounts({
          userAccount: nonDoctorAddress,
          authority: nonDoctorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonDoctorKeypair])
        .rpc();
        
      // Try to add record as non-doctor (should fail)
      const [failRecordAddress] = PublicKey.findProgramAddressSync(
        [RECORD_SEED, patientAddress.toBuffer(), Buffer.from([recordCounter + 1])],
        program.programId
      );
      try {
        await program.methods
          .addRecord(
            recordCounter + 1, 
            recordCid, 
            recordMetadata
          )
          .accounts({
            recordAccount: failRecordAddress,
            doctorAccount: nonDoctorAddress,
            patientAccount: patientAddress,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        assert.fail("Expected error but transaction succeeded");
      } catch (error) {
        expect(error.toString()).to.include("UnauthorizedRole");
      }
    });
  });

  describe('Request Access Tests', () => {
    it('should create an access request', async () => {
      const expirationTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      
      // Request access
      await program.methods
        .requestAccess(accessScope, new anchor.BN(expirationTime))
        .accounts({
          accessRequest: accessRequestAddress,
          doctorAccount: doctorAddress,
          patientAccount: patientAddress,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Fetch the access request and verify data
      const accessRequest = await program.account.accessRequest.fetch(accessRequestAddress);
      
      expect(accessRequest.doctorDid).to.equal(doctorDid);
      expect(accessRequest.patientDid).to.equal(patientDid);
      expect(accessRequest.scope).to.equal(accessScope);
      expect(accessRequest.expiresAt.toString()).to.equal(expirationTime.toString());
      expect(accessRequest.status.pending).to.not.be.undefined;
      // assert(accessRequest.requestedAt > 0, "Requested timestamp should be set");
    });
    
    it('should fail if non-doctor tries to request access', async () => {
      const nonDoctorKeypair = Keypair.generate();
      const anotherPatientKeypair = Keypair.generate();
      
      const [nonDoctorAddress] = PublicKey.findProgramAddressSync(
        [USER_SEED, nonDoctorKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const [anotherPatientAddress] = PublicKey.findProgramAddressSync(
        [USER_SEED, anotherPatientKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const nonDoctorAirdrop = await provider.connection.requestAirdrop(nonDoctorKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: nonDoctorAirdrop,
      });
      const anotherPatientAirdrop = await provider.connection.requestAirdrop(anotherPatientKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: anotherPatientAirdrop,
      });
      
      // Register both as patients
      await program.methods
        .register("did:web:patient1.example.com", { patient: {} })
        .accounts({
          userAccount: nonDoctorAddress,
          authority: nonDoctorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonDoctorKeypair])
        .rpc();
        
      await program.methods
        .register("did:web:patient2.example.com", { patient: {} })
        .accounts({
          userAccount: anotherPatientAddress,
          authority: anotherPatientKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([anotherPatientKeypair])
        .rpc();
      
      // Try to request access as non-doctor (should fail)
      const [failAccessRequestAddress] = PublicKey.findProgramAddressSync(
        [ACCESS_SEED, nonDoctorAddress.toBuffer(), anotherPatientAddress.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .requestAccess(accessScope, new anchor.BN(Math.floor(Date.now() / 1000) + 86400))
          .accounts({
            accessRequest: failAccessRequestAddress,
            doctorAccount: nonDoctorAddress,
            patientAccount: anotherPatientAddress,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        assert.fail("Expected error but transaction succeeded");
      } catch (error) {
        expect(error.toString()).to.include("UnauthorizedRole");
      }
    });
  });

  describe('Respond Access Tests', () => {
    it('should approve an access request', async () => {
      // Respond to access request with approval
      await program.methods
        .respondAccess(true)
        .accounts({
          accessRequest: accessRequestAddress,
          doctorAccount: doctorAddress,
          patientAccount: patientAddress,
          authority: patientKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([patientKeypair])
        .rpc();
      
      // Fetch the access request and verify data
      const accessRequest = await program.account.accessRequest.fetch(accessRequestAddress);
      
      expect(accessRequest.status.approved).to.not.be.undefined;
      // assert(accessRequest.respondedAt > 0, "Responded timestamp should be set");
    });
    
    it('should deny an access request', async () => {
      // Create a new access request
      const newDoctorKeypair = Keypair.generate();
      const [newDoctorAddress] = PublicKey.findProgramAddressSync(
        [USER_SEED, newDoctorKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const newDoctorAirdrop = await provider.connection.requestAirdrop(newDoctorKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: newDoctorAirdrop,
      });
      // Register as doctor
      await program.methods
        .register("did:web:newdoctor.example.com", { doctor: {} })
        .accounts({
          userAccount: newDoctorAddress,
          authority: newDoctorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newDoctorKeypair])
        .rpc();
      
      // Create new access request
      const [newAccessRequestAddress] = PublicKey.findProgramAddressSync(
        [ACCESS_SEED, newDoctorAddress.toBuffer(), patientAddress.toBuffer()],
        program.programId
      );
      
      await program.methods
        .requestAccess(accessScope, new anchor.BN(Math.floor(Date.now() / 1000) + 86400))
        .accounts({
          accessRequest: newAccessRequestAddress,
          doctorAccount: newDoctorAddress,
          patientAccount: patientAddress,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Deny access request
      await program.methods
        .respondAccess(false)
        .accounts({
          accessRequest: newAccessRequestAddress,
          doctorAccount: newDoctorAddress,
          patientAccount: patientAddress,
          authority: patientKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([patientKeypair])
        .rpc();
      
      // Fetch the access request and verify data
      const accessRequest = await program.account.accessRequest.fetch(newAccessRequestAddress);
      
      expect(accessRequest.status.denied).to.not.be.undefined;
      // assert(accessRequest.respondedAt > 0, "Responded timestamp should be set");
    });
    
    it('should fail if non-patient tries to respond to access request', async () => {
      // Create a new access request
      const newDoctorKeypair = Keypair.generate();
      const anotherPatientKeypair = Keypair.generate();
      
      const [newDoctorAddress] = PublicKey.findProgramAddressSync(
        [USER_SEED, newDoctorKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const [anotherPatientAddress] = PublicKey.findProgramAddressSync(
        [USER_SEED, anotherPatientKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const newDoctorAirdrop = await provider.connection.requestAirdrop(newDoctorKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: newDoctorAirdrop,
      });
      const anotherPatientAirdrop = await provider.connection.requestAirdrop(anotherPatientKeypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
      latestBlockHash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: anotherPatientAirdrop,
      });
      
      // Register as doctor and patient
      await program.methods
        .register("did:web:doctor2.example.com", { doctor: {} })
        .accounts({
          userAccount: newDoctorAddress,
          authority: newDoctorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newDoctorKeypair])
        .rpc();
        
      await program.methods
        .register("did:web:patient2.example.com", { patient: {} })
        .accounts({
          userAccount: anotherPatientAddress,
          authority: anotherPatientKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([anotherPatientKeypair])
        .rpc();
      
      // Create access request
      const [accessRequestAddr] = PublicKey.findProgramAddressSync(
        [ACCESS_SEED, newDoctorAddress.toBuffer(), anotherPatientAddress.toBuffer()],
        program.programId
      );
      
      await program.methods
        .requestAccess(accessScope, new anchor.BN(Math.floor(Date.now() / 1000) + 86400))
        .accounts({
          accessRequest: accessRequestAddr,
          doctorAccount: newDoctorAddress,
          patientAccount: anotherPatientAddress,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Try to respond with wrong authority (not the patient)
      try {
        await program.methods
          .respondAccess(true)
          .accounts({
            accessRequest: accessRequestAddr,
            doctorAccount: newDoctorAddress,
            patientAccount: anotherPatientAddress,
            authority: doctorKeypair.publicKey, // Using doctor key instead of patient
            systemProgram: SystemProgram.programId,
          })
          .signers([doctorKeypair])
          .rpc();
        assert.fail("Expected error but transaction succeeded");
      } catch (error) {
        expect(error.toString()).to.include("UnauthorizedRole");
      }
    });
  });
});