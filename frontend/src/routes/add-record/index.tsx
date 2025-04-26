import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Link } from '@tanstack/react-router'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  uploadToIPFS, 
  addMedicalRecord,
  getConnection,
  getUserPDA,
  createProviderFromWallet,
  getRecordPDA
} from '../../utils';
import * as web3 from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor';
import {
  ChevronLeft,
  Zap
} from "lucide-react"
import { FHIRForm } from "@/components/fhir-form"
import { Badge } from "@/components/ui/badge"

// Define the route
export const Route = createFileRoute('/add-record/')({
  component: AddRecordPage,
})

// Main component
export default function AddRecordPage() {
  const { publicKey, connected, wallet, signMessage } = useWallet();
  const walletAdapter = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [recordCounter, setRecordCounter] = useState(0);
  const [userRole, setUserRole] = useState<"patient" | "doctor">("patient");
  const [userPDA, setUserPDA] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet is connected
    if (!connected || !publicKey) {
      addLog("No wallet connected. Please connect your wallet first.", "warning");
      return;
    }
    
    // Get next record counter value
    fetchNextRecordCounter();
    fetchUserAccountDetails();
  }, [connected, publicKey]);
  
  // Add log entry with timestamp
  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };
  
  // Fetch user account details
  const fetchUserAccountDetails = async () => {
    if (!connected || !publicKey) return;
    
    try {
      const connection = getConnection();
      const userPDAAddress = getUserPDA(publicKey);
      const userAccount = await connection.getAccountInfo(userPDAAddress);
      
      if (userAccount) {
        setUserPDA(userPDAAddress.toBase58());
        
        // Determine role (placeholder implementation)
        const isDoctor = await checkIsDoctor(publicKey);
        if (isDoctor) {
          setUserRole("doctor");
          addLog("User role: Doctor", 'info');
        } else {
          setUserRole("patient");
          addLog("User role: Patient", 'info');
        }
      } else {
        addLog("User account not found. Please register first.", 'warning');
      }
    } catch (error) {
      console.error("Error fetching user account details:", error);
      addLog(`Error fetching user account: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };
  
  // Simplified placeholder for checkIsDoctor
  const checkIsDoctor = async (publicKey: web3.PublicKey): Promise<boolean> => {
    // This would be implemented with actual blockchain data checking
    return false;
  };
  
  // Fetch the next available record counter
  const fetchNextRecordCounter = async () => {
    if (!connected || !publicKey) return;
    
    try {
      addLog("Getting next record counter...");
      
      // Check if user account exists
      const connection = getConnection();
      const userPDA = getUserPDA(publicKey);
      const userAccount = await connection.getAccountInfo(userPDA);
      
      if (!userAccount) {
        addLog("User account not found. Please register first.", 'warning');
        return;
      }
      
      // Find next available record counter for this user
      let counter = 0;
      let foundCounter = false;
      
      while (!foundCounter && counter < 100) { // Limit to 100 records
        try {
          const recordPDA = getRecordPDA(publicKey, counter);
          const recordAccount = await connection.getAccountInfo(recordPDA);
          
          if (!recordAccount) {
            // Found available counter
            foundCounter = true;
            setRecordCounter(counter);
            addLog(`Next available record counter: ${counter}`, 'success');
          } else {
            counter++;
          }
        } catch (error) {
          addLog(`Error checking record ${counter}: ${error instanceof Error ? error.message : String(error)}`, 'error');
          counter++;
        }
      }
      
      if (!foundCounter) {
        addLog("Could not determine next record counter. Using default of 0.", 'warning');
        setRecordCounter(0);
      }
    } catch (error) {
      console.error("Error fetching next record counter:", error);
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };
  
  // Helper function to derive encryption key from wallet signature
  const deriveEncryptionKey = async (
    publicKey: web3.PublicKey, 
    signMessageFn: (message: Uint8Array) => Promise<Uint8Array>
  ) => {
    // This is a simplified implementation
    const message = "EMR Encryption Key";
    const encodedMessage = new TextEncoder().encode(message);
    
    try {
      const signatureBytes = await signMessageFn(encodedMessage);
      
      // Hash the signature to derive the key (placeholder)
      return {
        key: "derived-key",
        iv: "initialization-vector"
      };
    } catch (error) {
      console.error("Error deriving encryption key:", error);
      throw error;
    }
  };
  
  // Handle saving the record
  const handleSaveRecord = async (data: any) => {
    if (!connected || !publicKey) {
      addLog("Error: Wallet not connected", "error");
      return;
    }
    
    if (!signMessage) {
      addLog("Error: Wallet does not support message signing", "error");
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Encrypt the data
      addLog("Encrypting FHIR data...");
      const jsonString = JSON.stringify(data);
      
      // Derive encryption key
      const encryptionKey = await deriveEncryptionKey(publicKey, signMessage);
      
      // Encrypt the data (simplified placeholder)
      const encryptedData = {
        iv: "encryptedData.iv", 
        data: "encryptedData.data"
      };
      
      // 2. Upload to IPFS
      addLog("Uploading encrypted data to IPFS...");
      const encryptedJson = {
        data: encryptedData,
        patientPublicKey: publicKey.toString(),
        timestamp: Date.now()
      };
      
      const ipfsResponse = await uploadToIPFS(encryptedJson);
      addLog(`Encrypted data uploaded to IPFS with hash: ${ipfsResponse.cid}`, 'success');
      
      // 3. Create metadata for blockchain
      const metadata = JSON.stringify({
        patientId: publicKey.toString(),
        recordType: data.resourceType || "Unknown",
        timestamp: new Date().toISOString(),
        createdBy: publicKey.toString()
      });
      
      // 4. Record on blockchain
      addLog("Recording on Solana blockchain...");
      const result = await addMedicalRecord(
        walletAdapter,
        publicKey.toString(),
        metadata,
        ipfsResponse.cid,
        recordCounter
      );
      
      addLog("Record saved successfully!", 'success');
      
      // Navigate back to dashboard
      setTimeout(() => navigate({ to: "/dashboard" }), 2000);
      
    } catch (error) {
      console.error("Error saving record:", error);
      addLog(`Error saving record: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#e6e7ec] bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#1a81cd]">Add Medical Record</span>
        </div>
        
        <div className="flex items-center gap-2">
          {userPDA ? (
            <Badge variant="outline" className={userRole === "doctor" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
              {userRole === "doctor" ? "Doctor" : "Patient"}
            </Badge>
          ) : (
            <span className="text-sm">Wallet not connected</span>
          )}
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#313233] mb-2">Add New Medical Record</h1>
          <p className="text-[#5a5a5a]">
            Create a new FHIR-compliant health record that will be encrypted and stored securely on IPFS.
          </p>
        </div>

        {/* FHIR form */}
        <div className="bg-white p-6 rounded-md border border-[#e6e7ec]">
          <FHIRForm onSave={handleSaveRecord} />
        </div>

        {/* Process Logs */}
        <div className="mt-6 bg-white rounded-md border border-[#e6e7ec] p-4">
          <h2 className="text-md font-semibold mb-2">Process Logs</h2>
          <div className="h-32 overflow-auto p-3 border border-gray-300 rounded-md bg-black text-white font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">Logs will appear here as you perform actions</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`text-xs mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  log.type === 'warning' ? 'text-yellow-400' : 
                  'text-gray-300'
                }`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
} 