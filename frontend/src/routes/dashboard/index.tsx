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
  getConnection
} from '../../utils';

export const Route = createFileRoute('/dashboard/')({
  component: MedicalRecordArchive,
})
  
export default function MedicalRecordArchive() {
  const [records, setRecords] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("patient");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const wallet = useWallet();
  const { publicKey, signMessage, signTransaction, signAllTransactions, connected, disconnect } = useWallet();
  const walletAdapter = useWallet();
  const [inputText, setInputText] = useState('');
  const [uploadResponse, setUploadResponse] = useState<{
    ipfs: { hash: string; url: string };
    blockchain: { signature: string; success: boolean };
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [recordCounter, setRecordCounter] = useState(0);
  const [patientPublicKey, setPatientPublicKey] = useState('');
  const [patientSearchError, setPatientSearchError] = useState('');
  const [isPatientMode, setIsPatientMode] = useState(false);
  const [patientRecordCounter, setPatientRecordCounter] = useState(0);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [validPatient, setValidPatient] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // In a real app, we would fetch records from the blockchain based on the user's role
    addLog("Dashboard loaded. You can now view and manage your medical records.");
    
    // Check wallet connection and find next available counter
    if (connected && publicKey) {
      findNextAvailableCounter();
    }
  }, [connected, publicKey]);

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

  // Handle saving a new FHIR record
  const handleSaveRecord = async (data: any) => {
    if (!connected || !publicKey) {
      addLog("Error: Wallet not connected", "error");
      return;
    }
    
    console.log("Saving FHIR record:", data);
    
    // Add log messages
    addLog(`Creating new ${data.resourceType || "FHIR Bundle"} record...`);
    
    try {
      setLoading(true);
      
      // 1. Encrypt the data
      addLog("Step 1: Encrypting FHIR data...");
      const jsonString = JSON.stringify(data);
      const encryptedData = await encryptData(jsonString);
      
      // 2. Prepare for IPFS upload
      addLog("Step 2: Preparing encrypted data for IPFS...");
      const encryptedJson = {
        data: encryptedData,
        patientPublicKey: publicKey.toString(),
        timestamp: Date.now()
      };
      
      // 3. Upload to IPFS
      addLog("Step 3: Uploading encrypted data to IPFS...");
      const ipfsResponse = await uploadToIPFS(encryptedJson);
      addLog(`Encrypted data uploaded to IPFS with hash: ${ipfsResponse.cid}`, 'success');
      
      // 4. Create metadata for blockchain
      const metadata = JSON.stringify({
        patientId: publicKey.toString(),
        recordType: data.resourceType || "Unknown",
        timestamp: new Date().toISOString(),
        createdBy: publicKey.toString(),
        isPatientRecord: true
      });
      
      // 5. Record on blockchain
      addLog("Step 4: Recording on Solana blockchain...");
      const result = await addMedicalRecord(
        walletAdapter,
        publicKey.toString(), // Convert PublicKey to string
        metadata,
        ipfsResponse.cid,
        recordCounter
      );
      
      // Determine record type specific details
      let diagnosisText = "General Health Record";
      if (data.resourceType === "Observation" && data.code?.text) {
        diagnosisText = data.code.text;
      } else if (data.resourceType === "MedicationStatement" && data.medicationCodeableConcept?.text) {
        diagnosisText = data.medicationCodeableConcept.text;
      } else if (data.resourceType === "Patient") {
        diagnosisText = "Patient Information";
      } else if (data.resourceType === "Bundle") {
        diagnosisText = "Complete Medical Record";
      }
      
      // 6. Create new record for UI display
      const newRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        type: data.resourceType || "FHIR Bundle",
        doctor: userRole === "doctor" ? "Dr. Self" : "Self-Reported",
        hospital: userRole === "doctor" ? "Your Hospital" : "Self-Reported",
        diagnosis: diagnosisText,
        data: data,
        self_reported: userRole === "patient",
        ipfsHash: ipfsResponse.cid,
        signature: result.signature
      };
      
      // Add new record to state
      setRecords([newRecord, ...records]);
      setRecordCounter(prevCounter => prevCounter + 1);
      addLog(`Record saved successfully!`, 'success');
      
    } catch (error: any) {
      console.error('Process error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Process failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = (value: string) => {
    setUserRole(value);
    // In a real application, you might fetch different records based on the role
    addLog(`Switched to ${value} role`);
  };

  // Function to find the next available record counter for the current user
  const findNextAvailableCounter = async () => {
    if (!publicKey) return;
    
    try {
      addLog(`Finding next available record counter...`);
      const connection = getConnection();
      let counter = 0;
      let accountExists = true;
      
      // Look for unused counter value
      while (accountExists && counter < 100) { // Limit to avoid infinite loops
        // Use the PublicKey directly with getRecordPDA
        const recordPDA = getRecordPDA(publicKey, counter);
        const accountInfo = await connection.getAccountInfo(recordPDA);
        
        if (accountInfo === null) {
          // Found an unused counter
          accountExists = false;
          break;
        } else {
          // This counter is already used, try the next one
          counter++;
        }
      }
      
      setRecordCounter(counter);
      addLog(`Next available record counter: ${counter}`, 'info');
      return counter;
    } catch (error) {
      console.error("Error finding next counter:", error);
      addLog(`Error finding next counter: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return 0;
    }
  };

  // Function to validate a patient's public key
  const validatePatient = async () => {
    if (!patientPublicKey) {
      setPatientSearchError("Please enter a patient public key");
      setValidPatient(false);
      return;
    }
    
    try {
      setSearchingPatient(true);
      setPatientSearchError('');
      addLog("Validating patient public key...");
      
      // Validate public key format
      let patientPubkey: web3.PublicKey;
      try {
        patientPubkey = new web3.PublicKey(patientPublicKey);
        addLog("Public key format is valid");
      } catch (e) {
        setPatientSearchError("Invalid public key format");
        setValidPatient(false);
        addLog("Invalid public key format", 'error');
        return;
      }
      
      // Could add additional checks here (e.g., check if the public key is registered as a patient)
      // For now, we'll just find the next available counter
      const counter = await findNextAvailableCounter(patientPubkey);
      setPatientRecordCounter(counter || 0);
      
      setValidPatient(true);
      setIsPatientMode(true);
      addLog(`Patient public key validated. Ready to upload records for ${patientPublicKey.slice(0, 6)}...${patientPublicKey.slice(-4)}`, 'success');
    } catch (error) {
      console.error("Error validating patient:", error);
      setPatientSearchError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setValidPatient(false);
      addLog(`Patient validation failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setSearchingPatient(false);
    }
  };
  const checkWalletConnection = () => {
    console.log('checkWalletConnection', connected, publicKey);
    if (connected && publicKey) {
      const publicKeyStr = publicKey.toString();
      addLog(`Connected to wallet: ${publicKeyStr.slice(0, 6)}...${publicKeyStr.slice(-4)}`, 'success');
    } else {
      // Not connected, redirect to registration
      addLog("No wallet connected. Redirecting to home page...", 'warning');
      navigate({ to: '/' });
    }
  };

  const disconnectWallet = () => {
    if (disconnect) {
      disconnect();
      addLog("Disconnected from wallet");
    }
    setDecryptedData(null);
    
    // Redirect to registration page
    navigate({ to: '/' });
  };

  // Helper function to convert a string to ArrayBuffer
  const stringToArrayBuffer = (str: string) => {
    return new TextEncoder().encode(str);
  };

  // Helper function to convert from Uint8Array to hex string
  const bufferToHex = (buffer: ArrayBuffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Helper function to convert hex string to Uint8Array
  const hexToBuffer = (hex: string) => {
    const matches = hex.match(/.{1,2}/g);
    return new Uint8Array(matches!.map(byte => parseInt(byte, 16)));
  };

  const deriveEncryptionKey = async (message: string) => {
    if (!connected || !publicKey) {
      throw new Error('Please connect your wallet first');
    }

    try {
      addLog(`Deriving encryption key from wallet signature...`);
      
      // Use wallet to sign the message
      const encodedMessage = stringToArrayBuffer(message);
      
      addLog("Requesting wallet signature...");
      
      if (!signMessage) {
        throw new Error('Wallet does not support message signing');
      }
      
      // Use the signMessage function from useWallet hook
      const signatureBytes = await signMessage(encodedMessage);
      addLog("Received wallet signature");
      
      addLog("Hashing signature to create encryption key...");
      // Hash the signature bytes
      const hashBuffer = await crypto.subtle.digest('SHA-256', signatureBytes);
      
      // Import the hash as an AES-GCM key
      addLog("Importing hash as AES-GCM key...");
      const key = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      
      addLog("Encryption key derived successfully", 'success');
      return { key, hashBuffer };
    } catch (error: unknown) {
      console.error('Error deriving key:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Key derivation failed: ${errorMessage}`, 'error');
      throw new Error(`Failed to derive encryption key: ${errorMessage}`);
    }
  };

  const encryptData = async (data: string) => {
    try {
      addLog("Starting encryption process...");
      
      if (!data) {
        throw new Error('No data to encrypt');
      }

      // Derive key from wallet signature
      const { key } = await deriveEncryptionKey('EMR Encryption Key');

      // Generate initialization vector
      addLog("Generating encryption IV...");
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      addLog("Encrypting data with AES-GCM...");
      const dataBuffer = stringToArrayBuffer(data);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        dataBuffer
      );

      // Convert binary data to hex strings for JSON storage
      addLog("Converting encrypted data to hex format...");
      const ivHex = bufferToHex(iv);
      const encryptedHex = bufferToHex(encryptedBuffer);
      
      // Store as JSON with hex strings
      const resultObj = {
        iv: ivHex,
        data: encryptedHex
      };
      
      addLog("Encryption completed successfully", 'success');
      return resultObj;
    } catch (error: unknown) {
      console.error('Encryption error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Encryption failed: ${errorMessage}`, 'error');
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  };

  const decryptData = async (encryptedData: { iv: string; data: string }) => {
    try {
      addLog("Starting decryption process...");
      
      if (!encryptedData || !encryptedData.iv || !encryptedData.data) {
        throw new Error('Invalid encrypted data format');
      }

      // Derive the same key used for encryption
      const { key } = await deriveEncryptionKey('EMR Encryption Key');
      
      // Convert hex strings back to binary
      addLog("Converting hex format back to binary...");
      const iv = hexToBuffer(encryptedData.iv);
      const encryptedBuffer = hexToBuffer(encryptedData.data);
      
      // Decrypt the data
      addLog("Decrypting data with AES-GCM...");
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encryptedBuffer
      );
      
      // Convert decrypted buffer to string
      addLog("Converting decrypted data to string...");
      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      
      addLog("Decryption completed successfully", 'success');
      return decryptedString;
    } catch (error: unknown) {
      console.error('Decryption error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Decryption failed: ${errorMessage}`, 'error');
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!walletAdapter.publicKey || !patientPublicKey) {
      addLog("Error: Wallet not connected or patient not selected.", walletAdapter.publicKey);
      addLog("Error: Wallet not connected or patient not selected.", patientPublicKey);
      return;
    }

    if (!inputText.trim()) {
      addLog("Error: FHIR data cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadResponse(null);
      setDecryptedData(null);
      
      addLog("Starting upload process...");
      
      // Validate input
      let parsedJson;
      try {
        parsedJson = JSON.parse(inputText);
        addLog("FHIR JSON validated successfully");
      } catch (jsonError) {
        addLog("Invalid JSON format", 'error');
        throw new Error('Invalid JSON format');
      }
      
      // 1. Encrypt the data
      addLog("Step 1: Encrypting FHIR data...");
      const encryptedData = await encryptData(inputText);
      
      // 2. Convert the encrypted data to a file for IPFS upload
      addLog("Step 2: Preparing encrypted data for IPFS...");
      const encryptedBlob = new Blob([JSON.stringify(encryptedData)], { type: 'application/json' });
      const encryptedFile = new File([encryptedBlob], `encrypted-emr-${Date.now()}.json`, { type: 'application/json' });
      
      // 3. Upload to IPFS via utils.ts function
      addLog("Step 3: Uploading encrypted data to IPFS...");
      
      // Determine which public key to use (patient's or doctor's)
      let targetPublicKeyStr: string;
      let targetPublicKey: web3.PublicKey;
      let useCounter: number;
      
      if (isPatientMode && validPatient) {
        targetPublicKeyStr = patientPublicKey;
        targetPublicKey = new web3.PublicKey(patientPublicKey);
        useCounter = patientRecordCounter;
        addLog(`Using patient's public key: ${targetPublicKeyStr.slice(0, 6)}...${targetPublicKeyStr.slice(-4)}`);
      } else {
        if (!publicKey) {
          throw new Error('Wallet not connected');
        }
        targetPublicKeyStr = publicKey.toString();
        targetPublicKey = publicKey;
        useCounter = recordCounter;
        addLog(`Using doctor's own public key: ${targetPublicKeyStr.slice(0, 6)}...${targetPublicKeyStr.slice(-4)}`);
      }
      
      // Create metadata for the medical record
      const metadata = JSON.stringify({
        patientId: targetPublicKeyStr,
        recordType: parsedJson.resourceType || "Unknown",
        timestamp: new Date().toISOString(),
        createdBy: publicKey?.toString() || 'unknown',
        isPatientRecord: isPatientMode && validPatient
      });
      
      // First upload to IPFS - Convert encryptedData to a JSON object to upload
      const encryptedJson = {
        data: encryptedData,
        patientPublicKey: targetPublicKeyStr,
        timestamp: Date.now()
      };
      
      const ipfsResponse = await uploadToIPFS(encryptedJson);
      
      addLog(`Encrypted data uploaded to IPFS with hash: ${ipfsResponse.cid}`, 'success');
      
      // 4. Add the medical record to blockchain
      addLog(`Step 4: Recording medical record on Solana blockchain with counter ${useCounter}...`);
      
      const result = await addMedicalRecord(
        walletAdapter,
        targetPublicKeyStr,
        metadata,
        ipfsResponse.cid,
        useCounter
      );
      console.log('result', result);
      
      // 5. Set the response
      const uploadResult = {
        ipfs: {
          hash: ipfsResponse.cid,
          url: `https://ipfs.io/ipfs/${ipfsResponse.cid}`
        },
        blockchain: {
          signature: result.signature,
          success: result.success
        },
        timestamp: new Date().toISOString()
      };
      
      setUploadResponse(uploadResult);
      
      // Increment the record counter for the next submission
      if (isPatientMode && validPatient) {
        setPatientRecordCounter(prevCounter => prevCounter + 1);
        addLog(`Patient record counter incremented to ${patientRecordCounter + 1} for next submission`, 'info');
      } else {
        setRecordCounter(prevCounter => prevCounter + 1);
        addLog(`Record counter incremented to ${recordCounter + 1} for next submission`, 'info');
      }
      
      addLog("FHIR data has been encrypted, uploaded to IPFS, and recorded on Solana blockchain!", 'success');
    } catch (error: unknown) {
      console.error('Process error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      addLog(`Process failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndDecrypt = async (ipfsUrl: string) => {
    try {
      setFetchingData(true);
      setError('');
      setDecryptedData(null);
      
      addLog("Fetching encrypted data from IPFS...");
      
      // Extract the IPFS hash if it's a URL, or use directly if it's just a hash
      let fetchUrl = ipfsUrl;
      
      // If this is a gateway URL, use it directly
      // Otherwise construct a fetch URL using a gateway
      if (!fetchUrl.startsWith('http')) {
        // Use a public IPFS gateway
        fetchUrl = `https://ipfs.io/ipfs/${ipfsUrl}`;
      }
      
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      addLog("Parsing encrypted data...");
      const encryptedData = await response.json();
      
      // Decrypt the fetched data
      addLog("Decrypting fetched data...");
      const decrypted = await decryptData(encryptedData);
      
      // Try to parse as JSON for display formatting
      let parsedData;
      try {
        parsedData = JSON.parse(decrypted);
        addLog("Successfully parsed decrypted data as JSON", 'success');
      } catch (e) {
        // If not valid JSON, use the raw string
        parsedData = decrypted;
        addLog("Decrypted data is not valid JSON, using raw string", 'info');
      }
      
      setDecryptedData(parsedData);
      addLog("Data successfully decrypted and displayed!", 'success');
      return parsedData;
    } catch (error: unknown) {
      console.error('Fetch and decrypt error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to fetch and decrypt: ${errorMessage}`);
      addLog(`Fetch and decrypt failed: ${errorMessage}`, 'error');
      return null;
    } finally {
      setFetchingData(false);
    }
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
  return <Link to="/dashboard/add" />

  return (
    <div className="flex min-h-screen bg-[#fbfbfb]">
      {/* Sidebar */}
      <div className="w-[232px] border-r border-[#e6e7ec] bg-white">
        <div className="p-4 border-b border-[#e6e7ec]">
          <div className="flex items-center gap-2 text-[#1a81cd]">
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">Collapse menu</span>
          </div>
        </div>
  
        <nav className="p-2 space-y-1">
          <Link to="/" className="flex items-center gap-3 p-2 rounded-md text-[#5a5a5a] hover:bg-[#f5f5f5]">
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
  
          <Link to="/" className="flex items-center gap-3 p-2 rounded-md bg-[#e8f4fc] text-[#1a81cd]">
            <div className="h-5 w-5 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16.25 3.125H3.75C3.40482 3.125 3.125 3.40482 3.125 3.75V16.25C3.125 16.5952 3.40482 16.875 3.75 16.875H16.25C16.5952 16.875 16.875 16.5952 16.875 16.25V3.75C16.875 3.40482 16.5952 3.125 16.25 3.125Z"
                  stroke="#1a81cd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.875 7.5H13.125"
                  stroke="#1a81cd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.875 10H13.125"
                  stroke="#1a81cd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.875 12.5H10"
                  stroke="#1a81cd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">Medical Records</span>
          </Link>
  
          <Link to="/" className="flex items-center gap-3 p-2 rounded-md text-[#5a5a5a] hover:bg-[#f5f5f5]">
            <div className="h-5 w-5 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8.75 11.875C10.8211 11.875 12.5 10.1961 12.5 8.125C12.5 6.05393 10.8211 4.375 8.75 4.375C6.67893 4.375 5 6.05393 5 8.125C5 10.1961 6.67893 11.875 8.75 11.875Z"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 15.625C15 13.8991 12.2713 12.5 8.75 12.5C5.22875 12.5 2.5 13.8991 2.5 15.625"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 8.125H17.5"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.25 6.875V9.375"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">Access</span>
          </Link>
  
          <Link to="/" className="flex items-center gap-3 p-2 rounded-md text-[#5a5a5a] hover:bg-[#f5f5f5]">
            <div className="h-5 w-5 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2.5 3.75H17.5V16.25H2.5V3.75Z"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 7.5H17.5"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.25 11.25H13.75"
                  stroke="#5a5a5a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">Marketplace</span>
          </Link>
        </nav>
  
        <div className="absolute bottom-0 w-[232px] border-t border-[#e6e7ec]">
          <Link to="/" className="flex items-center gap-3 p-4 text-[#df0004]">
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Log out</span>
          </Link>
        </div>
      </div>
  
      {/* Main Content */}
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
              <span className="text-sm font-medium">Owen Tobias</span>
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#e8f4fc]">
                {userRole === "doctor" ? 
                  <Stethoscope className="h-3 w-3 text-[#1a81cd]" /> : 
                  <User className="h-3 w-3 text-[#1a81cd]" />
                }
              </div>
              <ChevronDown className="h-4 w-4 text-[#5a5a5a]" />
            </div>
          </div>
        </header>
  
        {/* Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#313233] mb-2">Medical Record Archive</h1>
            <p className="text-[#5a5a5a]">
              Access and manage your verified health records with end-to-end encryption and full data control.
            </p>
          </div>
          
          {/* Role indicator card */}
          <Card className="mb-6 bg-[#e8f4fc] border-[#d0d5dd]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {userRole === "doctor" ? (
                  <>
                    <Stethoscope className="h-5 w-5 text-[#1a81cd]" />
                    <div>
                      <h3 className="font-medium text-[#1a81cd]">Doctor Mode</h3>
                      <p className="text-sm text-[#5a5a5a]">You can request access to patient medical records.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5 text-[#1a81cd]" />
                    <div>
                      <h3 className="font-medium text-[#1a81cd]">Patient Mode</h3>
                      <p className="text-sm text-[#5a5a5a]">You can add your own health records to your medical history.</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
  
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2 text-[#5a5a5a] border-[#d9d9d9]">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
  
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5a5a5a]" />
              <Input placeholder="Search" className="pl-10 h-9 w-[200px] border-[#d9d9d9] text-sm" />
            </div>
  
            <Button variant="outline" size="sm" className="gap-2 text-[#5a5a5a] border-[#d9d9d9]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7.33333H2.66667V12H4V7.33333Z" fill="#5a5a5a" />
                <path d="M8.66667 4H7.33333V12H8.66667V4Z" fill="#5a5a5a" />
                <path d="M13.3333 2H12V12H13.3333V2Z" fill="#5a5a5a" />
                <path d="M1.33333 13.3333H14.6667V14.6667H1.33333V13.3333Z" fill="#5a5a5a" />
                <path d="M1.33333 1.33333H14.6667V2.66667H1.33333V1.33333Z" fill="#5a5a5a" />
              </svg>
              Start date - End date
            </Button>
            
            <div className="relative h-9">
              <Select 
                value={userRole} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="h-9 w-[140px] gap-2 border-[#d9d9d9] text-sm">
                  <UserRound className="h-4 w-4 text-[#5a5a5a]" />
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            <div className="ml-auto">
              {userRole === "patient" ? (
                <FHIRDialogForm 
                  onSave={handleSaveRecord} 
                  buttonText="Add health record"
                  buttonClassName="gap-2 bg-[#22c55e] hover:bg-[#22c55e]/90"
                />
              ) : (
                <Button className="gap-2 bg-[#1a81cd] hover:bg-[#1a81cd]/90">
                  Request access
                  <Zap className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
  
          {/* Records Table */}
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
                {records.map((record) => (
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Download className="h-4 w-4 text-[#5a5a5a]" />
                        </Button>
                        {record.self_reported && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <FileText className="h-4 w-4 text-[#5a5a5a]" />
                          </Button>
                        )}
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
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-md">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-md bg-[#1a81cd] text-white border-[#1a81cd]"
                >
                  1
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-md">
                  2
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md bg-[#1a81cd] text-white border-[#1a81cd]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
  
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#5a5a5a]">Result per page</span>
                <div className="flex items-center gap-1 border rounded px-2 py-1">
                  <span className="text-sm">10</span>
                  <ChevronDown className="h-4 w-4 text-[#5a5a5a]" />
                </div>
              </div>
            </div>
  
            <div className="px-4 py-2 text-xs text-[#5a5a5a]">1-50 of 1,250</div>
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
      </div>
    </div>
  )
}
  