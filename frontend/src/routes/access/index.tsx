import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Bell,
  ChevronDown,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import * as web3 from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor';
import { 
  getConnection,
  getUserPDA,
  checkIsDoctor,
  getAccessRequests,
  getAccessRequestPDA,
  getProgram,
  createProviderFromWallet,
  respondToAccess
} from '../../utils';

export const Route = createFileRoute('/access/')({
  component: AccessPage,
})
  
export default function AccessPage() {
  const { publicKey, connected, wallet, signMessage, signAllTransactions } = useWallet();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<"patient" | "doctor">("patient");
  const [userPDA, setUserPDA] = useState<string | null>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [approvedAccesses, setApprovedAccesses] = useState<any[]>([]);

  useEffect(() => {
    // Check if wallet is connected
    if (!connected || !publicKey) {
      addLog("No wallet connected. Please connect your wallet first.", "warning");
      return;
    }
    
    // Fetch user details
    fetchUserAccountDetails();
  }, [connected, publicKey]);

  // Add log entry with timestamp
  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const fetchUserAccountDetails = async () => {
    if (!connected || !publicKey) return;
    
    try {
      const connection = getConnection();
      const userPDAAddress = getUserPDA(publicKey);
      const isDoctor = await checkIsDoctor(publicKey);
      
      setUserPDA(userPDAAddress.toBase58());
      setUserRole(isDoctor ? "doctor" : "patient");
      
      // Fetch appropriate data based on role
      if (isDoctor) {
        fetchApprovedAccesses();
      } else {
        fetchAccessRequests();
      }
    } catch (error) {
      console.error("Error fetching user account details:", error);
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const fetchAccessRequests = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setFetchingRequests(true);
      addLog("Fetching access requests from blockchain...");
      
      // Get connection
      const connection = getConnection();
      
      // Get all access request PDAs for this patient
      try {
        const accessRequestAccounts = await getAccessRequests(connection, publicKey.toString());
        
        addLog(`Found ${accessRequestAccounts.length} access requests`, "info");
        
        // Process and display access requests
        const fetchedRequests = await Promise.all(accessRequestAccounts.map(async (account, index) => {
          try {
            // Get the access request account and deserialize it
            const accessRequestPDA = account.pubkey;
            const accessRequestAccount = await connection.getAccountInfo(accessRequestPDA);
            
            if (!accessRequestAccount) {
              throw new Error("Account not found");
            }
            
            // In a real implementation, you would properly deserialize the account data
            // For simplicity, we extract basics like timestamp from binary data
            
            // Assume the first 8 bytes after account discriminator are for doctorId
            const doctorIdStart = 8;
            const doctorIdEnd = doctorIdStart + 32; // 32 bytes for a pubkey
            
            // Extract doctor public key bytes (this is simplified)
            const doctorIdBytes = accessRequestAccount.data.slice(doctorIdStart, doctorIdEnd);
            const doctorId = new web3.PublicKey(doctorIdBytes).toString();
            
            // Extract timestamp (assuming it's at a specific offset - this would need adjustment)
            // This is purely illustrative and should be adjusted based on actual account layout
            const timestampBytes = accessRequestAccount.data.slice(doctorIdEnd, doctorIdEnd + 8);
            const timestamp = new DataView(timestampBytes.buffer).getBigUint64(0, true);
            
            return {
              id: accessRequestPDA.toString(),
              doctorId: doctorId,
              doctorName: `Dr. ${doctorId.substring(0, 6)}`,
              timestamp: Number(timestamp),
              recordCount: Math.floor(Math.random() * 5) + 1, // This would come from record count in real impl
              status: 'pending' as const,
            };
          } catch (error) {
            console.error("Error processing access request account:", error);
            return null;
          }
        }));
        
        // Filter out any null entries from errors
        const validRequests = fetchedRequests.filter(req => req !== null) as Array<{
          id: string;
          doctorId: string;
          doctorName: string;
          timestamp: number;
          recordCount: number;
          status: 'pending';
        }>;
        
        setAccessRequests(validRequests);
        
        if (validRequests.length === 0) {
          addLog("No pending access requests found", "info");
        } else {
          addLog(`Successfully fetched ${validRequests.length} access requests`, "success");
        }
      } catch (error) {
        console.error("Error searching for access requests:", error);
        addLog(`Error searching for access requests: ${error instanceof Error ? error.message : String(error)}`, "error");
        setAccessRequests([]);
      }
    } catch (error) {
      console.error("Error fetching access requests:", error);
      addLog(`Error fetching access requests: ${error instanceof Error ? error.message : String(error)}`, "error");
      setAccessRequests([]);
    } finally {
      setFetchingRequests(false);
    }
  };

  const fetchApprovedAccesses = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setApprovedAccesses([]);
      addLog("Fetching your approved access requests from blockchain...");
      
      // Get connection
      const connection = getConnection();
      
      // Get all access requests where this doctor is the requester
      try {
        const accessRequests = await getAccessRequests(connection, publicKey.toString());
        
        addLog(`Found ${accessRequests.length} access requests to process`, "info");
        
        // Filter for requests with status = approved and description field set
        const approvedRequests = [];
        
        for (const request of accessRequests) {
          try {
            // Get the access request account data
            const accessRequestPDA = request.pubkey;
            const accessRequestAccount = await connection.getAccountInfo(accessRequestPDA);
            
            if (!accessRequestAccount) {
              continue; // Skip if account not found
            }
            
            // In real implementation, properly deserialize the account data to check status
            // For simplicity, we're using account data size as a proxy for "has description/CID"
            // which would indicate it's an approved request
            
            // The status field would be at a specific offset in the account data
            // This is a simplified check - actual implementation would deserialize properly
            const hasStatusApproved = accessRequestAccount.data.length > 120;
            
            if (hasStatusApproved) {
              // Extract patient public key (simplified)
              const patientIdStart = 8 + 32; // After discriminator and doctor pubkey
              const patientIdEnd = patientIdStart + 32;
              const patientIdBytes = accessRequestAccount.data.slice(patientIdStart, patientIdEnd);
              const patientId = new web3.PublicKey(patientIdBytes).toString();
              
              // Extract CID/description (simplified)
              // In a real implementation, properly parse the variable length string
              // For now, we'll create a demo CID
              const descriptionBytes = accessRequestAccount.data.slice(patientIdEnd + 24);
              const decoder = new TextDecoder();
              let cid = "QmW8FLuCuTqn3yLvshGsjvEhsWy8mLKeJ8QfPYQN2RtTh5"; // Default fallback
              
              // Try to extract actual CID if it exists in the data
              try {
                const description = decoder.decode(descriptionBytes);
                if (description.startsWith("Qm")) {
                  cid = description.split(" ")[0]; // Extract first word if it looks like a CID
                }
              } catch (e) {
                console.warn("Could not decode description field", e);
              }
              
              approvedRequests.push({
                id: accessRequestPDA.toString(),
                patientId: patientId,
                patientName: `Patient ${patientId.substring(0, 8)}`,
                timestamp: Date.now() - 3600000, // Would extract from account in real impl
                cidLink: cid,
                status: 'approved' as const
              });
            }
          } catch (error) {
            console.error("Error processing access request:", error);
            continue; // Skip this one and try the next
          }
        }
        
        setApprovedAccesses(approvedRequests);
        
        if (approvedRequests.length === 0) {
          addLog("No approved access requests found", "info");
        } else {
          addLog(`Found ${approvedRequests.length} approved access requests`, "success");
        }
      } catch (error) {
        console.error("Error searching for approved accesses:", error);
        addLog(`Error searching for approved accesses: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    } catch (error) {
      console.error("Error fetching approved accesses:", error);
      addLog(`Error fetching approved accesses: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  };

  // Add function to approve access request
  const approveAccessRequest = async (doctorId: string) => {
    try {
      if (!connected || !publicKey || !wallet) {
        addLog("Error: Wallet not connected", "error");
        return;
      }
      
      setLoading(true);
      addLog(`Approving access request from doctor: ${doctorId}`);
      
      // Create proper doctor pubkey from string
      const doctorPubkey = new web3.PublicKey(doctorId);
      
      // Get connection and program
      const connection = getConnection();
      
      // We need to create a new provider differently since the wallet types don't match
      const provider = new anchor.AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction: async (tx) => {
            if (!wallet.adapter) throw new Error("Wallet adapter not found");
            tx.feePayer = publicKey;
            return await wallet.adapter.sendTransaction(tx, connection);
          },
          signAllTransactions: signAllTransactions
        } as anchor.Wallet,
        { commitment: 'confirmed' }
      );
      
      const program = getProgram(provider);
      
      // Get PDAs
      const doctorPDA = getUserPDA(doctorPubkey);
      const patientPDA = getUserPDA(publicKey);
      const accessRequestPDA = getAccessRequestPDA(doctorPubkey, publicKey);
      
      addLog("Creating transaction to approve access request on-chain...");
      
      // Generate a demo IPFS CID for the description
      const description = "QmRanDomCiDForDemoPurposes";
      
      // Create a new transaction
      const tx = new web3.Transaction();
      
      // Add the respondAccess instruction
      const ix = await program.methods
        .respondAccess(true, description)
        .accounts({
          accessRequest: accessRequestPDA,
          doctorAccount: doctorPDA,
          patientAccount: patientPDA,
          authority: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction();
      
      tx.add(ix);
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      if ('feePayer' in tx) {
        tx.feePayer = publicKey;
      }
      
      // Send the transaction using the wallet adapter
      if (!wallet.adapter) throw new Error("Wallet adapter not found");
      const signature = await wallet.adapter.sendTransaction(tx, connection);
      
      addLog(`Transaction sent: ${signature}`, "info");
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      addLog(`Access approval transaction confirmed: ${signature}`, "success");
      
      // Remove the request from the UI
      setAccessRequests(prev => prev.filter(r => r.doctorId !== doctorId));
      
      alert(`You have successfully granted access to your records.`);
    } catch (error) {
      console.error("Error approving access:", error);
      addLog(`Error approving access: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Add function to deny access request
  const denyAccessRequest = async (doctorId: string) => {
    try {
      if (!connected || !publicKey || !wallet) {
        addLog("Error: Wallet not connected", "error");
        return;
      }
      
      setLoading(true);
      addLog(`Denying access request from doctor: ${doctorId}`);
      
      // Create proper doctor pubkey from string
      const doctorPubkey = new web3.PublicKey(doctorId);
      
      // Get connection and program
      const connection = getConnection();
      
      // We need to create a new provider differently since the wallet types don't match
      const provider = new anchor.AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction: async (tx) => {
            if (!wallet.adapter) throw new Error("Wallet adapter not found");
            tx.feePayer = publicKey;
            return await wallet.adapter.sendTransaction(tx, connection);
          },
          signAllTransactions: signAllTransactions
        } as anchor.Wallet,
        { commitment: 'confirmed' }
      );
      
      const program = getProgram(provider);
      
      // Get PDAs
      const doctorPDA = getUserPDA(doctorPubkey);
      const patientPDA = getUserPDA(publicKey);
      const accessRequestPDA = getAccessRequestPDA(doctorPubkey, publicKey);
      
      addLog("Creating transaction to deny access request on-chain...");
      
      // Create a new transaction
      const tx = new web3.Transaction();
      
      // Add the respondAccess instruction with false for denial
      const ix = await program.methods
        .respondAccess(false, "")  // false = denied, empty description
        .accounts({
          accessRequest: accessRequestPDA,
          doctorAccount: doctorPDA,
          patientAccount: patientPDA,
          authority: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction();
      
      tx.add(ix);
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      if ('feePayer' in tx) {
        tx.feePayer = publicKey;
      }
      
      // Send the transaction using the wallet adapter
      if (!wallet.adapter) throw new Error("Wallet adapter not found");
      const signature = await wallet.adapter.sendTransaction(tx, connection);
      
      addLog(`Transaction sent: ${signature}`, "info");
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      addLog(`Access denial transaction confirmed: ${signature}`, "success");
      
      // Remove the request from the UI
      setAccessRequests(prev => prev.filter(r => r.doctorId !== doctorId));
      
      alert(`You have successfully denied access to your records.`);
    } catch (error) {
      console.error("Error denying access:", error);
      addLog(`Error denying access: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to view approved records from IPFS
  const viewApprovedRecords = async (cidLink: string, patientName: string) => {
    try {
      setLoading(true);
      addLog(`Fetching approved records from IPFS with CID: ${cidLink}`);
      
      // Try to fetch from IPFS gateway
      try {
        const response = await fetch(`${import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://ipfs.io/ipfs/'}${cidLink}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
        }
        
        // Success message
        addLog(`Successfully loaded records for ${patientName}`, "success");
        navigate({ to: '/dashboard' });
      } catch (error) {
        console.error("Error fetching from IPFS:", error);
        addLog(`Error fetching records: ${error instanceof Error ? error.message : String(error)}`, "error");
        
        // Even if there's an error, navigate to dashboard
        navigate({ to: '/dashboard' });
      }
    } catch (error) {
      console.error("Error viewing approved records:", error);
      addLog(`Error viewing approved records: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Simplified render
  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#e6e7ec] bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#1a81cd]">Log Access</span>
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
          <h1 className="text-2xl font-bold text-[#313233] mb-2">Access Management</h1>
          <p className="text-[#5a5a5a]">
            {userRole === "patient" 
              ? "Manage access requests to your medical records."
              : "View your approved access to patient records."
            }
          </p>
        </div>

        {/* Conditional content based on role */}
        {userRole === "patient" ? (
          <div className="bg-white p-4 rounded-md border border-[#e6e7ec]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Access Requests</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1"
                onClick={fetchAccessRequests}
                disabled={fetchingRequests}
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4V8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 20V16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12C4 9.79086 5.79086 8 8 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 12C20 14.2091 18.2091 16 16 16H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {fetchingRequests ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {fetchingRequests && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {!fetchingRequests && accessRequests.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <p>No pending access requests</p>
              </div>
            )}
            
            <div className="space-y-3">
              {accessRequests.map(request => (
                <div key={request.id} className="p-3 border rounded-md bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Doctor
                        </Badge>
                        {request.doctorName} ({request.doctorId.substring(0, 8)}...)
                      </div>
                      <div className="text-sm mt-1">
                        Requested access to your medical records ({request.recordCount} records)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(request.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => denyAccessRequest(request.doctorId)}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Deny"}
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white" 
                        size="sm"
                        onClick={() => approveAccessRequest(request.doctorId)}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Approve & Sign"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-md border border-[#e6e7ec]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Approved Patient Records</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1"
                onClick={fetchApprovedAccesses}
                disabled={loading}
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4V8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 20V16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12C4 9.79086 5.79086 8 8 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 12C20 14.2091 18.2091 16 16 16H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {loading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {!loading && approvedAccesses.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <p>No patients have approved your access requests yet</p>
              </div>
            )}
            
            <div className="space-y-3">
              {approvedAccesses.map(access => (
                <div key={access.id} className="p-3 border rounded-md bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Patient
                        </Badge>
                        {access.patientName} ({access.patientId.substring(0, 8)}...)
                      </div>
                      <div className="text-sm mt-1">
                        Approved access to medical records
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(access.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white" 
                        size="sm"
                        onClick={() => viewApprovedRecords(access.cidLink, access.patientName)}
                        disabled={loading}
                      >
                        View Records
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Logs */}
        <div className="mt-6 bg-white rounded-md border border-[#e6e7ec] p-4">
          <h2 className="text-md font-semibold mb-2">Process Logs</h2>
          <div className="h-32 overflow-auto p-3 border border-gray-300 rounded-md bg-black text-white font-mono">
            {logs.map((log, index) => (
              <div key={index} className={`text-xs mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 
                'text-gray-300'
              }`}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
} 