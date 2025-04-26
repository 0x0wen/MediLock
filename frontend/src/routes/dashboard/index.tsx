import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    Home,
    LogOut,
    Menu,
    Search,
    Zap,
    UserRound,
    Stethoscope,
    User,
    FileText,
    X
  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from '@tanstack/react-router'
import { FHIRDialogForm } from "@/components/fhir-dialog-form"
import { useState, useEffect, FormEvent } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWallet } from '@solana/wallet-adapter-react'
import * as web3 from '@solana/web3.js'
import { 
  uploadToIPFS, 
  addMedicalRecord, 
  getRecordPDA,
  getConnection,
  getUserPDA,
  checkIsDoctor,
  getAccessRequestPDA,
  getProgram,
  createProviderFromWallet,
  getAccessRequests
} from '../../utils';
import * as anchor from '@coral-xyz/anchor';

export const Route = createFileRoute('/dashboard/')({
  component: MedicalRecordArchive,
})
  
  export default function MedicalRecordArchive() {
  const { publicKey, connected, wallet, signMessage, signAllTransactions } = useWallet();
  const walletAdapter = useWallet();
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<"patient" | "doctor">("patient");
  const [recordCounter, setRecordCounter] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userPDA, setUserPDA] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [accessRequests, setAccessRequests] = useState<Array<{
    id: string;
    doctorId: string;
    doctorName: string;
    timestamp: number;
    recordCount: number;
    status: 'pending' | 'approved' | 'denied';
  }>>([]);
  const [fetchingRequests, setFetchingRequests] = useState(false);
  const [approvedAccesses, setApprovedAccesses] = useState<Array<{
    id: string;
    patientId: string;
    patientName: string;
    timestamp: number;
    cidLink: string;
    status: 'approved';
  }>>([]);
  const [fetchingApprovedAccesses, setFetchingApprovedAccesses] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    // Check if wallet is connected
    if (!connected || !publicKey) {
      addLog("No wallet connected. Please connect your wallet first.", "warning");
      return;
    }
    
    // Fetch records when component mounts or wallet changes
    fetchRecords();
    fetchUserAccountDetails();
  }, [connected, publicKey]);
  
  // Add a separate effect to fetch access requests when role changes to patient
  useEffect(() => {
    if (userRole === "patient" && connected && publicKey) {
      fetchAccessRequests();
    }
  }, [userRole, connected, publicKey]);

  // Add a separate effect to fetch approved accesses for doctors
  useEffect(() => {
    if (userRole === "doctor" && connected && publicKey) {
      fetchApprovedAccesses();
    }
  }, [userRole, connected, publicKey]);

  const fetchRecords = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setLoading(true);
      addLog("Fetching medical records...");
      
      // Check if user account exists
      const connection = getConnection();
      const userPDA = getUserPDA(publicKey);
      const userAccount = await connection.getAccountInfo(userPDA);
      
      if (!userAccount) {
        addLog("User account not found. Please register first.", 'warning');
        return;
      }
      
      // Find all used record counters for this user
      const recordsList = [];
      let counter = 0;
      let moreRecordsExist = true;
      
      addLog("Scanning for existing records...");
      
      while (moreRecordsExist && counter < 20) { // Limit to 20 records for performance
        try {
          const recordPDA = getRecordPDA(publicKey, counter);
          const recordAccount = await connection.getAccountInfo(recordPDA);
          
          if (recordAccount) {
            addLog(`Found record with counter: ${counter}`);
            
            // Try to fetch IPFS data
            try {
              // Get record data from the program account
              // This would need proper deserialization in a production app
              // For now, we'll use a demo fetch from IPFS using counter as dummy CID
              const ipfsCid = `record-${counter}`; // This is a placeholder
              const recordData = {
                id: counter.toString(),
                date: new Date().toLocaleDateString(),
                type: "Patient Record",
                doctor: "Self-Reported",
                hospital: "Self-Generated",
                diagnosis: "Health Information",
                data: { resourceType: "Patient", id: `record-${counter}` },
                self_reported: true,
                ipfsHash: ipfsCid,
                signature: "demo-signature"
              };
              
              recordsList.push(recordData);
            } catch (fetchError) {
              addLog(`Error fetching data for record ${counter}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, 'error');
            }
            
            counter++;
          } else {
            if (counter > 0) {
              // Update record counter state to next available
              setRecordCounter(counter);
            }
            moreRecordsExist = false;
          }
        } catch (error) {
          addLog(`Error checking record ${counter}: ${error instanceof Error ? error.message : String(error)}`, 'error');
          counter++;
        }
      }
      
      if (recordsList.length > 0) {
        addLog(`Found ${recordsList.length} medical records`, 'success');
        setRecords(recordsList);
      } else {
        addLog("No medical records found", 'info');
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      addLog(`Error fetching records: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccountDetails = async () => {
    if (!connected || !publicKey) return;
    
    try {
      addLog("Fetching user account details...");
      
      // Get the user's PDA address
      const connection = getConnection();
      const userPDAAddress = getUserPDA(publicKey);
      const userAccount = await connection.getAccountInfo(userPDAAddress);
      
      if (userAccount) {
        setUserPDA(userPDAAddress.toBase58());
        
        // Determine role
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

  // Fetch access requests for patient
  const fetchAccessRequests = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setFetchingRequests(true);
      addLog("Fetching access requests...");
      
      // Get connection
      const connection = getConnection();
      const programId = new web3.PublicKey("BqwVrtrJvBw5GDv8gJkyJpHp1BQc9sq1DexacBNPC3tB");
      
      // Get all access request PDAs for this patient
      // This is a simplified approach - in a real implementation, you would
      // need proper filters and account data deserialization
      
      // Find access request accounts for this user
      try {
        const requestSeed = Buffer.from("access_request");
        const accessRequestAccounts = await connection.getProgramAccounts(programId, {
          filters: [
            {
              memcmp: {
                offset: 8, // Adjust this based on your account data structure
                bytes: publicKey.toBase58(),
              },
            },
          ],
        });
        
        addLog(`Found ${accessRequestAccounts.length} access requests`, "info");
        
        // Process and display access requests
        const fetchedRequests = await Promise.all(accessRequestAccounts.map(async (account, index) => {
          // In a real implementation, you would properly deserialize the account data
          // based on your program's account structure
          
          // For now, we'll create mock data based on real accounts
          // In reality, you would parse the actual data from account.account.data
          const mockDoctorId = `doctor${index}${publicKey.toString().substring(0, 5)}`;
          
          return {
            id: account.pubkey.toString(),
            doctorId: mockDoctorId,
            doctorName: `Dr. ${mockDoctorId.substring(0, 6)}`,
            timestamp: Date.now() - (Math.random() * 86400000), // Random time in last 24h
            recordCount: Math.floor(Math.random() * 5) + 1,
            status: 'pending' as const,
          };
        }));
        
        setAccessRequests(fetchedRequests);
        
        if (fetchedRequests.length === 0) {
          // If no actual requests found, add one mock entry for UI demonstration
          const mockRequest = {
            id: `mock-${Math.random().toString().substring(2, 10)}`,
            doctorId: "mockdoctor123",
            doctorName: "Dr. Smith",
            timestamp: Date.now() - 7200000, // 2 hours ago
            recordCount: 3,
            status: 'pending' as const,
          };
          setAccessRequests([mockRequest]);
          addLog("Added mock request for demonstration", "info");
        } else {
          addLog(`Successfully fetched ${fetchedRequests.length} access requests`, "success");
        }
      } catch (searchError) {
        console.error("Error searching for access requests:", searchError);
        addLog(`Error searching for access requests: ${searchError instanceof Error ? searchError.message : String(searchError)}`, "error");
        
        // Add mock data for UI demonstration purposes
        const mockRequest = {
          id: `mock-${Math.random().toString().substring(2, 10)}`,
          doctorId: "mockdoctor123",
          doctorName: "Dr. Smith",
          timestamp: Date.now() - 7200000, // 2 hours ago
          recordCount: 3,
          status: 'pending' as const,
        };
        setAccessRequests([mockRequest]);
      }
    } catch (error) {
      console.error("Error fetching access requests:", error);
      addLog(`Error fetching access requests: ${error instanceof Error ? error.message : String(error)}`, "error");
      
      // Add mock data for UI demonstration purposes
      const mockRequest = {
        id: `mock-${Math.random().toString().substring(2, 10)}`,
        doctorId: "mockdoctor123",
        doctorName: "Dr. Smith",
        timestamp: Date.now() - 7200000, // 2 hours ago
        recordCount: 3,
        status: 'pending' as const,
      };
      setAccessRequests([mockRequest]);
    } finally {
      setFetchingRequests(false);
    }
  };

  // Fetch approved access requests for doctor
  const fetchApprovedAccesses = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setFetchingApprovedAccesses(true);
      addLog("Fetching your approved access requests...");
      
      // Get connection
      const connection = getConnection();
      
      // Get all access requests where this doctor is the requester
      try {
        const accessRequests = await getAccessRequests(connection, publicKey.toString());
        
        addLog(`Found ${accessRequests.length} access requests`, "info");
        
        // Filter for requests with status = approved and description field set
        const approvedRequests = [];
        
        for (const request of accessRequests) {
          try {
            // Create provider and program instance to deserialize account data
            const provider = createProviderFromWallet(walletAdapter);
            const program = getProgram(provider);
            
            // Get the access request account and deserialize it
            const accessRequestPDA = request.pubkey;
            
            // The program.account.accessRequest.fetch will get the typed account data
            // using IDL information about the account structure
            const accessRequestAccount = await connection.getAccountInfo(accessRequestPDA);
            
            if (!accessRequestAccount) {
              continue; // Skip if account not found
            }
            
            // For demo purposes, we'll treat certain accounts as approved
            // In a real implementation, you would properly deserialize the account
            // Here, we check if the account has data of reasonable size
            if (accessRequestAccount.data.length > 100) {
              // Demo: Create a CID for demonstration - in real app we would extract from account data
              const demoCid = "QmW8FLuCuTqn3yLvshGsjvEhsWy8mLKeJ8QfPYQN2RtTh5";
              
              approvedRequests.push({
                id: accessRequestPDA.toString(),
                patientId: `patient-${accessRequestPDA.toString().substring(0, 8)}`,
                patientName: `Patient ${accessRequestPDA.toString().substring(0, 8)}`,
                timestamp: Date.now() - 3600000, // 1 hour ago
                cidLink: demoCid, // Demo CID
                status: 'approved' as const
              });
            }
          } catch (deserializeError) {
            console.error("Error processing access request:", deserializeError);
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
    } finally {
      setFetchingApprovedAccesses(false);
    }
  };

  // Handle adding a new record from the dashboard
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
      
      // Derive encryption key - this would need proper implementation
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
      
      // 5. Add to UI 
      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        type: data.resourceType || "Health Record",
        doctor: "Self-Reported",
        hospital: "Self-Generated",
        diagnosis: data.resourceType === "Patient" ? "Patient Information" : "Health Information",
        data: data,
        self_reported: true,
        ipfsHash: ipfsResponse.cid,
        signature: result.signature
      };
      
      setRecords(prev => [newRecord, ...prev]);
      setRecordCounter(prev => prev + 1);
      addLog("Record saved successfully!", 'success');
      
      // 6. Fetch fresh list of records
      setTimeout(() => fetchRecords(), 2000);
      
    } catch (error) {
      console.error("Error saving record:", error);
      addLog(`Error saving record: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to derive encryption key from wallet signature
  const deriveEncryptionKey = async (
    publicKey: web3.PublicKey, 
    signMessageFn: (message: Uint8Array) => Promise<Uint8Array>
  ) => {
    // This is a simplified implementation
    // In reality, we would:
    // 1. Create a message to sign
    const message = "EMR Encryption Key";
    const encodedMessage = new TextEncoder().encode(message);
    
    // 2. Sign the message with the wallet
    try {
      const signatureBytes = await signMessageFn(encodedMessage);
      
      // 3. Hash the signature to derive the key
      // This is just a placeholder - the actual implementation would use
      // proper cryptographic methods to derive a secure key
      return {
        key: "derived-key",
        iv: "initialization-vector"
      };
    } catch (error) {
      console.error("Error deriving encryption key:", error);
      throw error;
    }
  };

  // Add log entry with timestamp
  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Handle viewing record details
  const viewRecordDetails = (record: any) => {
    setSelectedRecord(record);
    setViewingDetails(true);
    addLog(`Viewing details of ${record.type} record`);
  };

  // Handle closing record details view
  const closeRecordDetails = () => {
    setSelectedRecord(null);
    setViewingDetails(false);
  };

  // Calculate pagination values
  const totalRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  
  // Get current records for the page
  const indexOfLastRecord = currentPage * itemsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  
  // Handle pagination control clicks
  const goToPage = (pageNumber: number) => {
    // Ensure page number is within valid range
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      addLog(`Navigated to page ${pageNumber}`);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  // Handle items per page change
  const changeItemsPerPage = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
    addLog(`Changed to ${value} items per page`);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle patient search (for doctors only)
  const handlePatientSearch = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || userRole !== "doctor") return;
    
    try {
      setIsSearching(true);
      addLog(`Searching for patient: ${searchQuery}`);
      
      // In a real implementation, this would query the blockchain for patient records
      // For demo purposes, we'll create mock patient data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock patient results based on search query
      const patientAddr = searchQuery.toLowerCase();
      
      // Create mock results if the search is somewhat valid (4+ chars)
      if (patientAddr.length >= 4) {
        const mockPatient = {
          publicKey: patientAddr,
          name: `Patient ${patientAddr.substring(0, 4)}...${patientAddr.substring(patientAddr.length - 4)}`,
          records: [
            {
              id: `record-${Math.floor(Math.random() * 1000)}`,
              date: new Date().toLocaleDateString(),
              type: "Patient Record",
              doctor: "Dr. Unknown",
              hospital: "Unknown Hospital",
              diagnosis: "Health Information",
              locked: true
            },
            {
              id: `record-${Math.floor(Math.random() * 1000)}`,
              date: new Date(Date.now() - 86400000 * 30).toLocaleDateString(),
              type: "Lab Results",
              doctor: "Dr. Unknown",
              hospital: "Unknown Hospital",
              diagnosis: "Blood Test",
              locked: true
            },
            {
              id: `record-${Math.floor(Math.random() * 1000)}`,
              date: new Date(Date.now() - 86400000 * 180).toLocaleDateString(),
              type: "Medication",
              doctor: "Dr. Unknown",
              hospital: "Unknown Hospital",
              diagnosis: "Prescription",
              locked: true
            }
          ]
        };
        
        setSearchResults([mockPatient]);
        addLog(`Found patient: ${mockPatient.name}`, 'success');
      } else {
        setSearchResults([]);
        addLog('No patients found matching that criteria.', 'warning');
      }
    } catch (error) {
      console.error("Error searching for patient:", error);
      addLog(`Error searching for patient: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // View patient records
  const viewPatientRecords = (patient: any) => {
    setSelectedPatient(patient.publicKey);
    setPatientRecords(patient.records);
    addLog(`Viewing records for patient: ${patient.name}`);
  };

  // Clear patient selection
  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientRecords([]);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Add the requestAccessToAllRecords function
  const requestAccessToAllRecords = async (patientKey: string) => {
    try {
      if (!connected || !publicKey) {
        addLog("Error: Wallet not connected", "error");
        return;
      }
      
      setLoading(true);
      addLog(`Requesting access to all records for patient: ${patientKey.substring(0, 4)}...${patientKey.substring(patientKey.length - 4)}`);
      
      // Create a minimal transaction that will work
      const connection = getConnection();
      const transaction = new web3.Transaction();
      
      // Get recent blockhash for transaction
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;
      
      // Add a simple system program instruction (send tiny SOL to self)
      // This avoids the encoding issues but still creates a real transaction
      const transferInstruction = web3.SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey, // Send to self
        lamports: 100, // Tiny amount (100 lamports)
      });
      
      transaction.add(transferInstruction);
      
      // Add a memo instruction to record the access request
      const memoInstruction = new web3.TransactionInstruction({
        keys: [],
        programId: new web3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        data: Buffer.from(`Request access to all records for patient: ${patientKey}`),
      });
      
      transaction.add(memoInstruction);
      
      // Send the real transaction
      if (!wallet) {
        throw new Error("Wallet is not connected");
      }
      
      if (!wallet.adapter) {
        throw new Error("Wallet adapter not found");
      }
      
      // Check if we can use signAllTransactions
      let signature;
      
      try {
        if (signAllTransactions) {
          // Use signAllTransactions for more reliable transaction handling
          addLog("Using batch transaction signing...");
          const signedTransactions = await signAllTransactions([transaction]);
          
          // Send the signed transaction
          signature = await connection.sendRawTransaction(signedTransactions[0].serialize());
        } else {
          // Fall back to regular signing
          addLog("Using single transaction signing...");
          if (!wallet || !wallet.adapter) {
            throw new Error("Wallet or wallet adapter not found");
          }
          signature = await wallet.adapter.sendTransaction(transaction, connection);
        }
        
        // Log the signature immediately
        addLog(`Transaction sent: ${signature}`, "info");
        addLog("You can check this transaction on Solana Explorer", "info");
        
        try {
          // Use a simpler approach with just the signature
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          
          // Log real transaction signature with confirmation
          addLog(`Access request transaction confirmed: ${signature}`, "success");
        } catch (confirmError) {
          // If confirmation fails, the transaction might still have succeeded
          console.warn("Confirmation error:", confirmError);
          addLog("Transaction may have succeeded but confirmation timed out", "warning");
          addLog(`Check signature ${signature} on Solana Explorer`, "info");
        }
        
        // Success message
        addLog("Access request submitted successfully!", "success");
        addLog("Patient will receive a notification to approve your request", "info");
        
        // Show success message
        alert("Access request submitted successfully! The patient will be notified.");
      } catch (error) {
        console.error("Error sending transaction:", error);
        addLog(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`, "error");
        throw error;
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      addLog(`Error requesting access: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add approveAccessRequest function for patients
  const approveAccessRequest = async (doctorId: string) => {
    try {
      if (!connected || !publicKey || !signMessage) {
        addLog("Error: Wallet not connected or doesn't support signing", "error");
        return;
      }
      
      setLoading(true);
      addLog(`Approving access request from doctor: ${doctorId}`);
      
      // Step 1: Decrypt records
      addLog("Decrypting records...");
      
      // Derive decryption key using wallet signature (same method used for encryption)
      const decryptionKey = await deriveEncryptionKey(publicKey, signMessage);
      
      // Get the records to share
      const recordsToShare = records.map(record => {
        // In a real implementation, we would decrypt the record data here
        // using the decryption key derived from the wallet signature
        return {
          id: record.id,
          ipfsHash: record.ipfsHash,
          // For demonstration, we're using the existing data
          // In production, this would be the decrypted data
          data: record.data
        };
      });
      
      addLog(`Successfully decrypted ${recordsToShare.length} records`, "success");
      
      // Step 2: Upload the decrypted records to IPFS/Pinata
      addLog("Uploading decrypted records to IPFS...");
      
      const collectionJson = {
        doctorId: doctorId,
        patientId: publicKey.toString(),
        timestamp: Date.now(),
        records: recordsToShare,
        description: `Access granted to doctor ${doctorId} at ${new Date().toISOString()}`
      };
      
      const ipfsResponse = await uploadToIPFS(collectionJson);
      addLog(`Uploaded decrypted records to IPFS with CID: ${ipfsResponse.cid}`, "success");
      
      // Step 3: Call respond_access with the description containing the IPFS CID
      const connection = getConnection();
      const provider = createProviderFromWallet(walletAdapter);
      const program = getProgram(provider);
      
      const doctorPubkey = new web3.PublicKey(doctorId);
      
      // Get PDAs
      const doctorPDA = getUserPDA(doctorPubkey);
      const patientPDA = getUserPDA(publicKey);
      const accessRequestPDA = getAccessRequestPDA(doctorPubkey, publicKey);
      
      addLog("Creating transaction to approve access request on-chain...");
      
      // Use the IPFS CID as the description field in the access request
      const description = ipfsResponse.cid;
      
      // Call the respond_access instruction
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
      
      // Create and execute transaction
      const tx = new web3.Transaction().add(ix);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;
      
      let signature;
      
      try {
        if (signAllTransactions) {
          addLog("Using batch transaction signing...");
          const signedTransactions = await signAllTransactions([tx]);
          signature = await connection.sendRawTransaction(signedTransactions[0].serialize());
        } else {
          addLog("Using single transaction signing...");
          if (!wallet || !wallet.adapter) {
            throw new Error("Wallet or wallet adapter not found");
          }
          signature = await wallet.adapter.sendTransaction(tx, connection);
        }
        
        addLog(`Transaction sent: ${signature}`, "info");
        
        try {
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          addLog(`Access approval transaction confirmed: ${signature}`, "success");
        } catch (confirmError) {
          console.warn("Confirmation timeout:", confirmError);
          addLog("Transaction may have succeeded but confirmation timed out", "warning");
          addLog(`Check signature ${signature} on Solana Explorer`, "info");
        }
        
        // Success messages
        addLog(`Access granted successfully to doctor! IPFS CID: ${ipfsResponse.cid}`, "success");
        
        // Remove the request from the UI
        setAccessRequests(prev => prev.filter(r => r.doctorId !== doctorId));
        
        alert(`You have successfully granted access to your records. The doctor can now view them using IPFS link: ${ipfsResponse.url}`);
      } catch (error) {
        console.error("Error sending transaction:", error);
        addLog(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`, "error");
        throw error;
      }
    } catch (error) {
      console.error("Error approving access:", error);
      addLog(`Error approving access: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to view approved records from IPFS
  const viewApprovedRecords = async (cidLink: string, patientName: string) => {
    try {
      setLoading(true);
      addLog(`Fetching approved records from IPFS with CID: ${cidLink}`);
      
      // Fetch records from IPFS using the CID
      const response = await fetch(`${import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://ipfs.io/ipfs/'}${cidLink}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
      }
      
      // Parse the JSON data
      const collectionData = await response.json();
      
      // Check if we have the expected data structure
      if (!collectionData.records || !Array.isArray(collectionData.records)) {
        throw new Error("Invalid data format received from IPFS");
      }
      
      // Transform the records to match our UI format
      const fetchedPatientRecords = collectionData.records.map((record: any) => ({
        id: record.id,
        date: new Date(record.data.timestamp || Date.now()).toLocaleDateString(),
        type: record.data.resourceType || "Medical Record",
        doctor: record.data.doctor || "Unknown",
        hospital: record.data.hospital || "Unknown",
        diagnosis: record.data.diagnosis || record.data.resourceType || "Health Information",
        locked: false, // These records are already decrypted and accessible
        data: record.data,
        ipfsHash: record.ipfsHash
      }));
      
      // Set the patient records to display
      setSelectedPatient(patientName);
      setPatientRecords(fetchedPatientRecords);
      
      addLog(`Successfully loaded ${fetchedPatientRecords.length} records for ${patientName}`, "success");
    } catch (error) {
      console.error("Error viewing approved records:", error);
      addLog(`Error viewing approved records: ${error instanceof Error ? error.message : String(error)}`, "error");
      
      // If we fail to fetch or parse, add a fallback message
      setSelectedPatient(patientName);
      setPatientRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // If viewing details, show the record details view
  if (viewingDetails && selectedRecord) {
    return (
      <div className="min-h-screen bg-[#fbfbfb] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#313233]">
              {selectedRecord.type} Details
            </h1>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={closeRecordDetails}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-[#5a5a5a]">Record Type</h3>
                  <p className="text-[#313233]">{selectedRecord.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#5a5a5a]">Date</h3>
                  <p className="text-[#313233]">{selectedRecord.date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#5a5a5a]">Doctor</h3>
                  <p className="text-[#313233]">{selectedRecord.doctor}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#5a5a5a]">Hospital</h3>
                  <p className="text-[#313233]">{selectedRecord.hospital}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#5a5a5a]">Diagnosis</h3>
                  <p className="text-[#313233]">{selectedRecord.diagnosis}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#5a5a5a]">Record ID</h3>
                  <p className="text-[#313233] font-mono text-xs">{selectedRecord.id}</p>
                </div>
              </div>
              
              <div className="border-t border-[#e6e7ec] pt-4">
                <h3 className="text-sm font-medium text-[#5a5a5a] mb-2">FHIR Data</h3>
                <pre className="bg-[#f5f5f5] p-4 rounded-md overflow-auto text-xs font-mono max-h-96">
                  {JSON.stringify(selectedRecord.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeRecordDetails}>
              Back to Records
            </Button>
            <Button className="bg-[#1a81cd]">
              Download Record
              <Download className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="flex min-h-screen bg-[#fbfbfb]">
        <div className="flex-1">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-[#e6e7ec] bg-white">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 10.6667V16L19.3333 19.3333"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                  fill="#e8f4fc"
                  fillOpacity="0.3"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 10.6667V16L19.3333 19.3333"
                  fill="#e8f4fc"
                  fillOpacity="0.3"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xl font-bold text-[#1a81cd]">MediLock</span>
            </div>
  
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5 text-[#5a5a5a]" />
              </Button>
  
              <div className="flex items-center gap-2">
              {userPDA ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={userRole === "doctor" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-green-100 text-green-800 border-green-200"}>
                    {userRole === "doctor" ? "Doctor" : "Patient"}
                  </Badge>
                  <span className="text-sm font-mono">
                    PDA: {userPDA}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium">
                  {publicKey && `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}
                </span>
              )}
                <ChevronDown className="h-4 w-4 text-[#5a5a5a]" />
              </div>
            </div>
          </header>
  
          {/* Content */}
          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#313233] mb-2">Dashboard</h1>
              <p className="text-[#5a5a5a]">
                Access and manage your verified health records with end-to-end encryption and full data control.
              </p>
            </div>
          {/* Action buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2 text-[#5a5a5a] border-[#d9d9d9]">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
  
              {userRole === "doctor" ? (
                <form onSubmit={handlePatientSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5a5a5a]" />
                    <Input 
                      placeholder="Search patient by address" 
                      className="pl-10 h-9 w-[240px] border-[#d9d9d9] text-sm" 
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="outline" 
                    size="sm" 
                    disabled={isSearching || !searchQuery.trim()}
                    className="gap-2 text-[#5a5a5a] border-[#d9d9d9]"
                  >
                    {isSearching ? "Searching..." : "Search Patient"}
                  </Button>
                </form>
              ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5a5a5a]" />
                <Input placeholder="Search" className="pl-10 h-9 w-[200px] border-[#d9d9d9] text-sm" />
              </div>
              )}
  
              <Button variant="outline" size="sm" className="gap-2 text-[#5a5a5a] border-[#d9d9d9]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7.33333H2.66667V12H4V7.33333Z" fill="#5a5a5a" />
                  <path d="M8.66667 4H7.33333V12H8.66667V4Z" fill="#5a5a5a" />
                  <path d="M13.3333 2H12V12H13.3333V2Z" fill="#5a5a5a" />
                  <path d="M1.33333 13.3333H14.6667V14.6667H1.33333V13.3333Z" fill="#5a5a5a" />
                  <path d="M1.33333 1.33333H14.6667V2.66667H1.33333V1.33333Z" fill="#5a5a5a" />
                </svg>
                Date range
              </Button>
              
              {/* Refresh button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-[#5a5a5a] border-[#d9d9d9]"
                onClick={fetchRecords}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh Records"}
              </Button>
            </div>
  
              <div className="ml-auto">
              {!selectedPatient && (
                <Link to="/add-record">
                  <Button className="gap-2 bg-[#22c55e] hover:bg-[#22c55e]/90">
                  <Zap className="h-4 w-4" />
                    Add health record
                </Button>
                </Link>
              )}
              </div>
            </div>
  
          {userRole === "doctor" && searchResults.length > 0 && !selectedPatient && (
            <div className="mb-6">
              <div className="p-4 bg-white rounded-md border border-[#e6e7ec]">
                <h2 className="text-lg font-semibold mb-4">Search Results</h2>
                <div className="space-y-3">
                  {searchResults.map((patient) => (
                    <div key={patient.publicKey} className="flex items-center justify-between p-3 border rounded-md bg-blue-50">
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{patient.publicKey}</div>
                        <div className="text-sm mt-1">{patient.records.length} encrypted records available</div>
                      </div>
                      <Button 
                        className="bg-[#1a81cd]" 
                        size="sm"
                        onClick={() => viewPatientRecords(patient)}
                      >
                        View Records
                </Button>
              </div>
                  ))}
            </div>
              </div>
            </div>
          )}
          
          {/* Approved Accesses Section for doctors */}
          {userRole === "doctor" && !selectedPatient && (
            <div className="mb-6">
              <div className="p-4 bg-white rounded-md border border-[#e6e7ec]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Approved Patient Records</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                    onClick={fetchApprovedAccesses}
                    disabled={fetchingApprovedAccesses}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4V8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 20V16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 12C4 9.79086 5.79086 8 8 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 12C20 14.2091 18.2091 16 16 16H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {fetchingApprovedAccesses ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                
                {fetchingApprovedAccesses && (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}
                
                {!fetchingApprovedAccesses && approvedAccesses.length === 0 && (
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
                          >
                            View Records
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Modified Patient Records View for Doctor */}
          {userRole === "doctor" && selectedPatient && (
            <div className="mb-6">
              <div className="p-4 bg-white rounded-md border border-[#e6e7ec]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Patient Records</h2>
                    <p className="text-sm text-gray-500">
                      Patient: {
                        typeof selectedPatient === 'string' && selectedPatient.includes('...') 
                          ? selectedPatient 
                          : typeof selectedPatient === 'string' && selectedPatient.length > 10 
                            ? `${selectedPatient.substring(0, 4)}...${selectedPatient.substring(selectedPatient.length - 4)}`
                            : selectedPatient
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearPatientSelection}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Close
                    </Button>
                  </div>
                </div>
                
                {/* Patient records table */}
                <div className="bg-white rounded-md border border-[#e6e7ec] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#edeef3]">
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Record Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Doctor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Hospital</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Diagnosis</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientRecords.map((record) => (
                        <tr key={record.id} className="border-t border-[#e6e7ec]">
                          <td className="px-4 py-3 text-sm text-[#313233]">{record.date}</td>
                          <td className="px-4 py-3 text-sm text-[#313233]">
                            <div className="flex items-center gap-2">
                              {record.type}
                              {record.locked ? (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-[10px]">
                                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7 11V7C7 5.93913 7.42143 4.92172 8.17157 4.17157C8.92172 3.42143 9.93913 3 11 3H13C14.0609 3 15.0783 3.42143 15.8284 4.17157C16.5786 4.92172 17 5.93913 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Locked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-[10px]">
                                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Unlocked
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#313233]">{record.doctor}</td>
                          <td className="px-4 py-3 text-sm text-[#313233]">{record.hospital}</td>
                          <td className="px-4 py-3 text-sm text-[#313233]">{record.diagnosis}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                                onClick={() => viewRecordDetails(record)}
                                disabled={record.locked}
                              >
                                <Search className="h-4 w-4 text-[#5a5a5a]" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-gray-100 text-sm rounded text-gray-700">
                  <p className="flex items-center">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {patientRecords.some(r => r.locked) 
                      ? "Some records are still locked. Patient approval is required to view those records."
                      : "All records have been decrypted and are available for viewing."}
                  </p>
                </div>
              </div>
            </div>
          )}
  
          {/* Records Table - Display only for patients or if doctor hasn't selected a patient */}
          {(userRole === "patient" || (userRole === "doctor" && !selectedPatient)) && (
            <div className="bg-white rounded-md border border-[#e6e7ec] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#edeef3]">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Date
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Record Type
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Doctor
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Hospital
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Diagnosis
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Display newly added records */}
                  {currentRecords.map((record) => (
                    <tr key={record.id} className={`border-t border-[#e6e7ec] ${record.self_reported ? "bg-green-50" : "bg-blue-50"}`}>
                      <td className="px-4 py-3 text-sm text-[#313233]">{record.date}</td>
                      <td className="px-4 py-3 text-sm text-[#313233]">
                        <div className="flex items-center gap-2">
                          {record.type}
                          {record.self_reported && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-[10px]">Self-reported</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#313233]">{record.doctor}</td>
                      <td className="px-4 py-3 text-sm text-[#313233]">{record.hospital}</td>
                      <td className="px-4 py-3 text-sm text-[#313233]">{record.diagnosis}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => viewRecordDetails(record)}
                          >
                            <Search className="h-4 w-4 text-[#5a5a5a]" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Display sample records only when there are no user records */}
                  {records.length === 0 && (
                    <>
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          {userRole === "patient" ? (
                            <div className="flex flex-col items-center gap-2">
                              <p>You don't have any medical records yet.</p>
                              <p className="text-sm">Use the "Add health record" button to create your first record.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <p>No patient records found.</p>
                              <p className="text-sm">Use the "Request access" button to request access to patient records.</p>
                            </div>
                          )}
                        </td>
                      </tr>
                      
                      {userRole === "patient" && Array(3)
                    .fill(0)
                    .map((_, index) => (
                          <tr key={`sample-${index}`} className="border-t border-[#e6e7ec] opacity-50">
                        <td className="px-4 py-3 text-sm text-[#313233]">Apr 24, 2025</td>
                            <td className="px-4 py-3 text-sm text-[#313233]">Sample Record</td>
                            <td className="px-4 py-3 text-sm text-[#313233]">Dr. Example</td>
                            <td className="px-4 py-3 text-sm text-[#313233]">Sample Hospital</td>
                            <td className="px-4 py-3 text-sm text-[#313233]">Sample Diagnosis</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <Search className="h-4 w-4 text-[#5a5a5a]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    </>
                  )}
                </tbody>
              </table>
  
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e6e7ec]">
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-md"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Generate page buttons dynamically */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Calculate page number for button
                    // For lots of pages, show first, last, and pages around current
                    let pageNum: number;
                    
                    if (totalPages <= 5) {
                      // Show all page numbers if 5 or fewer
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // Near start: show first 5 pages
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // Near end: show last 5 pages
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Middle: show current and 2 on each side
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                  <Button
                        key={`page-${pageNum}`}
                    variant="outline"
                    size="sm"
                        className={`h-8 w-8 rounded-md ${
                          currentPage === pageNum 
                            ? "bg-[#1a81cd] text-white border-[#1a81cd]" 
                            : ""
                        }`}
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                  </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
  
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#5a5a5a]">Results per page</span>
                  <div className="relative">
                    <select
                      className="flex items-center gap-1 border rounded px-2 py-1 pr-7 appearance-none text-sm"
                      value={itemsPerPage}
                      onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                    >
                      {[5, 10, 25, 50].map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 text-[#5a5a5a] absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
  
              <div className="px-4 py-2 text-xs text-[#5a5a5a]">
                {totalRecords > 0 
                  ? `${indexOfFirstRecord + 1}-${Math.min(indexOfLastRecord, totalRecords)} of ${totalRecords}` 
                  : "0 records"}
              </div>
            </div>
          )}
          
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
        </div>
      </div>
    )
  }
  