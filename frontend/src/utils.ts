// @ts-nocheck
// ^ Disable TypeScript checking for this file as there are compatibility 
// issues between the IDL types and Anchor's expected types

import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Medilock, IDL } from './medilock'; // Import the type
import { PinataSDK } from 'pinata';
import { Buffer } from 'buffer';
import {  Program, AnchorProvider, IdlAccounts } from '@coral-xyz/anchor';
// Import the IDL from JSON file
import idl from './idl/medilock.json';

// Define TypeScript interface to match IDL method names with snake_case
export interface MedilockMethods {
  add_record: (recordCounter: number, cid: string, metadata: string) => any;
  request_access: (scope: string, expiration: anchor.BN) => any;
  respond_access: (approved: boolean) => any;
  register: (did: string, role: any) => any;
  // Add other methods as needed
}

// Constants (moved from backend config.ts)
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const PROGRAM_ID = new web3.PublicKey('BqwVrtrJvBw5GDv8gJkyJpHp1BQc9sq1DexacBNPC3tB');

// Seeds (moved from backend)
export const USER_SEED = Buffer.from('user');
export const RECORD_SEED = Buffer.from('record');
export const ACCESS_SEED = Buffer.from('access');

// IPFS gateway URL for reading files
export const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';

// For pinata API (if you want to keep using it)
export const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
export const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';

// Connection and program
let connection: web3.Connection;

export function getConnection(): web3.Connection {
  if (!connection) {
    connection = new web3.Connection(SOLANA_RPC_URL, 'confirmed');
  }
  return connection;
}

// Define program type

export function getProgram(provider: AnchorProvider) {
  try {
    // Use the latest Anchor package which handles IDL parsing better
    const programId = new web3.PublicKey("BqwVrtrJvBw5GDv8gJkyJpHp1BQc9sq1DexacBNPC3tB");
    const program = new Program(IDL, provider);
    
    return program;
  } catch (error) {
    console.error('Error initializing program:', error);
    throw error;
  }
}
// PDA utility functions (moved from backend)
export function getUserPDA(publicKey: web3.PublicKey): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [USER_SEED, publicKey.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function getRecordPDA(patientPublicKey: web3.PublicKey, counter: number): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [RECORD_SEED, patientPublicKey.toBuffer(), Buffer.from([counter])],
    PROGRAM_ID
  )[0];
}

export function getAccessRequestPDA(doctorPublicKey: web3.PublicKey, patientPublicKey: web3.PublicKey): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [ACCESS_SEED, doctorPublicKey.toBuffer(), patientPublicKey.toBuffer()],
    PROGRAM_ID
  )[0];
}

// Common function to create provider from wallet
export function createProviderFromWallet(wallet: ReturnType<typeof useWallet>): anchor.AnchorProvider {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }
  
  return new anchor.AnchorProvider(
    getConnection(),
    {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions!
    } as anchor.Wallet,
    { commitment: 'confirmed' }
  );
}

// Function to check if a wallet is registered as a doctor
export async function checkIsDoctor(walletPublicKey: web3.PublicKey): Promise<boolean> {
  try {
    if (!walletPublicKey) {
      return false;
    }
    
    const connection = getConnection();
    const userPDA = getUserPDA(walletPublicKey);
    
    // Get account info from the blockchain
    const accountInfo = await connection.getAccountInfo(userPDA);
    
    // If account doesn't exist, user is not registered
    if (!accountInfo) {
      console.log("User account not found");
      return false;
    }
    
    // This is a simplified check - in a real app, you'd properly deserialize the account data
    // For now, we'll check if the account exists and return true to allow testing
    // In a production app, you would deserialize the account data and check the role field
    
    // Create a provider and program instance to properly deserialize the account
    const provider = new anchor.AnchorProvider(
      connection,
      { publicKey: walletPublicKey } as anchor.Wallet,
      { commitment: 'confirmed' }
    );
    
    const program = new Program(IDL, provider);
    
    try {
      // Try to fetch and deserialize the account
      const userAccount = await program.account.user.fetch(userPDA);
      console.log('userAccount', userAccount);
      // Check if the role is doctor
      // The role field is an enum in the IDL, so we need to check if it has a 'doctor' property
      return userAccount.role && Object.keys(userAccount.role).includes('doctor');
    } catch (e) {
      console.error("Error deserializing user account:", e);
      return false;
    }
  } catch (error) {
    console.error("Error checking doctor status:", error);
    return false;
  }
}

// Common function to execute a transaction
async function executeTransaction(tx: web3.Transaction, wallet: ReturnType<typeof useWallet>): Promise<string> {
  const connection = getConnection();
  
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
  const signedTx = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signedTx.serialize());
  
  // Wait for confirmation
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature,
  });
  
  return signature;
}

// User Registration
export async function registerUser(
  wallet: ReturnType<typeof useWallet>, 
  role: "doctor" | "patient"
): Promise<{ success: boolean; signature: string }> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    console.log('SUI');
    const provider = createProviderFromWallet(wallet);
    console.log('SUI', provider);
    const program = getProgram(provider);
    console.log('SUI', program);
    // Get user PDA
    const userPDA = getUserPDA(wallet.publicKey);
    console.log('SUI', userPDA);
    
    // Create instruction using camelCase as in TypeScript
    // @ts-ignore - TypeScript has issues with account names
    const ix = await program.methods
      .register("", { [role.toLowerCase()]: {} })
      .accounts({
        userAccount: userPDA,
        authority: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    
    console.log('SUI');
    // Create and execute transaction
    const tx = new web3.Transaction().add(ix);
    console.log('SUI');
    const signature = await executeTransaction(tx, wallet);
    console.log("User registered successfully! Signature:", signature);
    return { success: true, signature };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

// Request access to patient records
export async function requestAccess(
  wallet: ReturnType<typeof useWallet>,
  patientPublicKey: string,
  scope: string,
  expiration: number
): Promise<{ success: boolean; signature: string }> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    const provider = createProviderFromWallet(wallet);
    const program = getProgram(provider);
    
    const patientPubkey = new web3.PublicKey(patientPublicKey);
    
    // Get PDAs
    const doctorPDA = getUserPDA(wallet.publicKey);
    const patientPDA = getUserPDA(patientPubkey);
    const accessRequestPDA = getAccessRequestPDA(wallet.publicKey, patientPubkey);
    
    // Use camelCase for method names to match TypeScript interface
    // @ts-ignore - TypeScript has issues with account names
    const ix = await program.methods
      .requestAccess(scope, new anchor.BN(expiration))
      .accounts({
        accessRequest: accessRequestPDA,
        doctorAccount: doctorPDA,
        patientAccount: patientPDA,
        authority: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    
    // Create and execute transaction
    const tx = new web3.Transaction().add(ix);
    const signature = await executeTransaction(tx, wallet);
    
    console.log("Access request submitted! Signature:", signature);
    return { success: true, signature };
  } catch (error) {
    console.error("Error requesting access:", error);
    throw error;
  }
}

// Respond to access request
export async function respondToAccess(
  wallet: ReturnType<typeof useWallet>,
  doctorPublicKey: string,
  approved: boolean
): Promise<{ success: boolean; signature: string }> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    const provider = createProviderFromWallet(wallet);
    const program = getProgram(provider);
    
    const doctorPubkey = new web3.PublicKey(doctorPublicKey);
    
    // Get PDAs
    const doctorPDA = getUserPDA(doctorPubkey);
    const patientPDA = getUserPDA(wallet.publicKey);
    const accessRequestPDA = getAccessRequestPDA(doctorPubkey, wallet.publicKey);
    
    // Use camelCase for method names to match TypeScript interface
    // @ts-ignore - TypeScript has issues with account names
    const ix = await program.methods
      .respondAccess(approved)
      .accounts({
        accessRequest: accessRequestPDA,
        doctorAccount: doctorPDA,
        patientAccount: patientPDA,
        authority: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    
    // Create and execute transaction
    const tx = new web3.Transaction().add(ix);
    const signature = await executeTransaction(tx, wallet);
    
    console.log(`Access request ${approved ? 'approved' : 'denied'}! Signature:`, signature);
    return { success: true, signature };
  } catch (error) {
    console.error("Error responding to access request:", error);
    throw error;
  }
}

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT!,
    pinataGateway: import.meta.env.VITE_PINATA_GATEWAY!,
  });

  export async function uploadToIPFS(json: Record<string, any>): Promise<{ url: string; cid: string }> {
    try {
      const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
      const file = new File([blob], `fhir-encrypted-${Date.now()}.json`, { type: 'application/json' });
  
      const upload = await pinata.upload.public.file(file);
      const ipfsLink = await pinata.gateways.public.convert(upload.cid);
  
      return {
        url: ipfsLink,
        cid: upload.cid,
      };
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }
  

// Add medical record
export async function addMedicalRecord(
  wallet: ReturnType<typeof useWallet>,
  patientPublicKey: string,
  metadata: string,
  cid: string,
  recordCounter: number = 0
): Promise<{ success: boolean; signature: string; cid: string }> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    // No need to upload to IPFS here as we're passing the CID directly
    
    // Create transaction to record on-chain
    const provider = createProviderFromWallet(wallet);
    const program = getProgram(provider);
    
    const patientPubkey = new web3.PublicKey(patientPublicKey);
    
    // Get PDAs
    const doctorPDA = getUserPDA(wallet.publicKey);
    const patientPDA = getUserPDA(patientPubkey);
    const recordPDA = getRecordPDA(patientPubkey, recordCounter);
    // Use camelCase for method names to match TypeScript interface
    // @ts-ignore - TypeScript has issues with account names
    const ix = await program.methods
      .addRecord(recordCounter, cid, metadata || '')
      .accounts({
        recordAccount: recordPDA,
        doctorAccount: doctorPDA,
        patientAccount: patientPDA,
        authority: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    
    // Create and execute transaction
    const tx = new web3.Transaction().add(ix);
    const signature = await executeTransaction(tx, wallet);
    
    console.log("Medical record added! Signature:", signature);
    return { success: true, signature, cid };
  } catch (error) {
    console.error("Error adding medical record:", error);
    throw error;
  }
}

// Get an existing medical record
export async function getMedicalRecord(cid: string): Promise<Blob> {
  try {
    // Fetch the file from IPFS gateway
    const response = await fetch(`${IPFS_GATEWAY_URL}${cid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch record: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error("Error fetching medical record:", error);
    throw error;
  }
}

// Get medical records for a patient
export async function getPatientRecords(
  connection: web3.Connection,
  patientPublicKey: string
): Promise<any[]> {
  try {
    // In a real app, you might query using getProgramAccounts
    // This is a simplified example
    const patientPubkey = new web3.PublicKey(patientPublicKey);
    
    // Get all program accounts of the record type
    const programAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        // Filter for record accounts (this would need adjustment based on your actual program layout)
        { memcmp: { offset: 8, bytes: patientPubkey.toBase58() } }
      ]
    });
    
    // Parse the accounts (you'd need to implement a proper parser)
    const records = programAccounts.map(account => {
      // This is a placeholder - you'd need actual account data deserialization
      return {
        pubkey: account.pubkey.toString(),
        // ... parse other fields from account.account.data
      };
    });
    
    return records;
  } catch (error) {
    console.error("Error fetching patient records:", error);
    throw error;
  }
}

// Get access requests for a patient
export async function getAccessRequests(
  connection: web3.Connection,
  patientPublicKey: string
): Promise<any[]> {
  try {
    // Similar to getPatientRecords, but for access requests
    const patientPubkey = new web3.PublicKey(patientPublicKey);
    
    // Get all program accounts of the access request type
    const programAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        // Filter for access request accounts (this would need adjustment based on your actual program layout)
        { memcmp: { offset: 8 + 32, bytes: patientPubkey.toBase58() } }
      ]
    });
    
    // Parse the accounts
    const requests = programAccounts.map(account => {
      // This is a placeholder - you'd need actual account data deserialization
      return {
        pubkey: account.pubkey.toString(),
        // ... parse other fields from account.account.data
      };
    });
    
    return requests;
  } catch (error) {
    console.error("Error fetching access requests:", error);
    throw error;
  }
}

// Additional helper for airdropping SOL for testing (Devnet only)
export async function requestAirdrop(
  publicKey: web3.PublicKey, 
  amount: number = 1000
): Promise<string> {
  try {
    console.log('requestAirdrop', publicKey.toBase58(), amount);
    const connection = getConnection();
    const signature = await connection.requestAirdrop(
      publicKey,
      web3.LAMPORTS_PER_SOL * amount
    );
    
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: signature,
    });
    console.log('requestAirdrop', signature);
    return signature;
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    throw error;
  }
}

// Get account data helper
export async function getAccountData(
  connection: web3.Connection,
  publicKey: web3.PublicKey
): Promise<any> {
  const accountInfo = await connection.getAccountInfo(publicKey);
  if (!accountInfo) {
    throw new Error("Account not found");
  }
  
  // You'd need proper parsing of the account data here
  // This would depend on your specific account structures
  return accountInfo;
}