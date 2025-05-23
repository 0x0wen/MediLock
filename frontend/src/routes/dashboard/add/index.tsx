import { useState, useEffect, FormEvent } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { 
  uploadToIPFS, 
  addMedicalRecord, 
  getRecordPDA,
  getConnection,
  getUserPDA
} from '../../../utils';
import { useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';

export const Route = createFileRoute('/dashboard/add/')({
  component: UploadPage,
})

function UploadPage() {
  const navigate = useNavigate();
  const { publicKey, signMessage, connected, disconnect } = useWallet();
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
  // Add a record counter state to keep track of the current record count
  const [recordCounter, setRecordCounter] = useState(0);
  // Sample FHIR JSON for demo purposes
  const sampleFHIR = {
    "resourceType": "Patient",
    "id": "example",
    "active": true,
    "name": [
      {
        "use": "official",
        "family": "Smith",
        "given": ["John"]
      }
    ],
    "gender": "male",
    "birthDate": "1974-12-25",
    "address": [
      {
        "use": "home",
        "line": ["123 Main St"],
        "city": "Anytown",
        "state": "CA",
        "postalCode": "12345"
      }
    ]
  };

  useEffect(() => {
    // Set sample FHIR data for convenience
    setInputText(JSON.stringify(sampleFHIR, null, 2));
    
    // Check if wallet is connected
    checkWalletConnection();
    
    // Find the next available record counter when wallet is connected
    if (connected && publicKey) {
      findNextAvailableCounter();
    }
  }, [connected, publicKey]);


  // Function to find the next available record counter for the specified public key
  const findNextAvailableCounter = async () => {
    if (!publicKey) return;
    
    try {
      addLog(`Finding next available record counter...`);
      const connection = getConnection();
      
      // Get user PDA to check if user is registered
      const userPDA = getUserPDA(publicKey);
      const userAccount = await connection.getAccountInfo(userPDA);
      
      if (!userAccount) {
        addLog("User account not found. Please register first.", 'warning');
        navigate({ to: '/' }); // Redirect to registration
        return 0;
      }
      
      // Debug log the PDA derivation process
      addLog(`User wallet: ${publicKey.toString()}`);
      addLog(`User PDA: ${userPDA.toString()}`);
      
      // Start from 0 and increment until we find an unused account
      for (let counter = 0; counter < 100; counter++) {
        try {
          // Get the Record PDA (which now correctly uses the user PDA)
          const recordPDA = getRecordPDA(publicKey, counter);
          addLog(`Checking Record PDA for counter ${counter}: ${recordPDA.toBase58()}`);
          
          // Check if the account exists
          const accountInfo = await connection.getAccountInfo(recordPDA);
          
          if (accountInfo === null) {
            // Found an unused counter
            addLog(`Found available counter: ${counter}`, 'success');
            setRecordCounter(counter);
            return counter;
          } else {
            addLog(`Counter ${counter} is already used, trying next...`);
          }
        } catch (e) {
          console.error(`Error checking counter ${counter}:`, e);
          addLog(`Error checking counter ${counter}: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
      }
      
      // If we reach here, we couldn't find an available counter
      addLog(`Could not find an available counter after checking 100 values`, 'error');
      return 0;
    } catch (error) {
      console.error("Error finding next counter:", error);
      addLog(`Error finding next counter: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return 0;
    }
  };

  // Add log entry with timestamp
  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
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
      console.log('encryptedData', encryptedData);
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
    if (!walletAdapter.publicKey) {
      addLog("Error: Wallet not connected.");
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
      
      // 0. Verify user registration and account existence
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      const connection = getConnection();
      const userPDA = getUserPDA(publicKey);
      const userAccount = await connection.getAccountInfo(userPDA);
      
      if (!userAccount) {
        addLog("User account not found. Please register first.", 'warning');
        navigate({ to: '/' });
        return;
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
      
      const targetPublicKeyStr = publicKey.toString();
      addLog(`Using public key: ${targetPublicKeyStr.slice(0, 6)}...${targetPublicKeyStr.slice(-4)}`);
      
      // Create metadata for the medical record
      const metadata = JSON.stringify({
        patientId: targetPublicKeyStr,
        recordType: parsedJson.resourceType || "Unknown",
        timestamp: new Date().toISOString(),
        createdBy: publicKey.toString()
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
      // Verify PDA derivation first to make sure we have the right counter value
      const recordPDA = getRecordPDA(publicKey, recordCounter);
      
      // Check if record account already exists
      const recordAccount = await connection.getAccountInfo(recordPDA);
      if (recordAccount) {
        addLog(`Record with counter ${recordCounter} already exists. Finding next available counter...`, 'warning');
        const newCounter = await findNextAvailableCounter();
        setRecordCounter(newCounter || 0);
        addLog(`Using new counter value: ${newCounter}`, 'info');
      } else {
        addLog(`Record PDA is available: ${recordPDA.toBase58()}`);
      }
      
      addLog(`Step 4: Recording medical record on Solana blockchain with counter ${recordCounter}...`);
      
      const result = await addMedicalRecord(
        walletAdapter,
        targetPublicKeyStr,
        metadata,
        ipfsResponse.cid,
        recordCounter
      );
      console.log('result', result);
      
      // 5. Set the response
      const uploadResult = {
        ipfs: {
          hash: ipfsResponse.cid,
          url: `https://${import.meta.env.VITE_PINATA_GATEWAY_URL}/ipfs/${ipfsResponse.cid}`
        },
        blockchain: {
          signature: result.signature,
          success: result.success
        },
        timestamp: new Date().toISOString()
      };
      
      setUploadResponse(uploadResult);
      
      // Increment the record counter for the next submission
      setRecordCounter(prevCounter => prevCounter + 1);
      addLog(`Record counter incremented to ${recordCounter + 1} for next submission`, 'info');
      
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
      console.log('fetchUrl', fetchUrl);
      // If this is a gateway URL, use it directly
      // Otherwise construct a fetch URL using a gateway
      if (!fetchUrl.startsWith('http')) {
        // Use a public IPFS gateway
        fetchUrl = `https://${import.meta.env.VITE_PINATA_GATEWAY_URL}/ipfs/${ipfsUrl}`;
      }
      
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      addLog("Parsing encrypted data...");
      const encryptedData = (await response.json()).data;
      
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Upload FHIR Record
          </h1>
          <div className="flex items-center space-x-4">
            {connected && publicKey && (
              <div className="text-sm text-gray-600">
                Wallet: {publicKey.toString()}
              </div>
            )}
            <Link
              to="/"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Back to Home
            </Link>
            {connected && (
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {!connected || !publicKey && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p className="font-bold">Not Connected</p>
            <p>Please connect and register your wallet first.</p>
            <Link
              to="/"
              className="mt-2 inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Go to Registration
            </Link>
          </div>  
       )}
            
            {/* Main Content Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">FHIR Data Input</h2>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono"
                  placeholder="Enter FHIR formatted JSON here..."
                />
                
                <div className="mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Encrypt & Upload FHIR Data'}
                  </button>
                </div>
              </div>
              
              {/* Response/Output Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Result</h2>
                
                {uploadResponse ? (
                  <div className="h-64 overflow-auto p-3 border border-gray-300 rounded-md bg-gray-50">
                    <h3 className="font-semibold text-green-600 mb-2">Upload Successful!</h3>
                    
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700">IPFS Hash:</p>
                      <p className="text-sm font-mono bg-gray-200 p-1 rounded">{uploadResponse.ipfs.hash}</p>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700">URL:</p>
                      <a 
                        href={uploadResponse.ipfs.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-blue-600 hover:underline break-all"
                      >
                        {uploadResponse.ipfs.url}
                      </a>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700">Blockchain Transaction:</p>
                      <a 
                        href={`https://explorer.solana.com/tx/${uploadResponse.blockchain.signature}?cluster=devnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-blue-600 hover:underline break-all"
                      >
                        {uploadResponse.blockchain.signature.slice(0, 10)}...{uploadResponse.blockchain.signature.slice(-10)}
                      </a>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700">Uploaded at:</p>
                      <p className="text-sm">{new Date(uploadResponse.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => fetchAndDecrypt(uploadResponse.ipfs.hash)}
                        disabled={fetchingData}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50"
                      >
                        {fetchingData ? 'Decrypting...' : 'Decrypt Content'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border border-gray-300 rounded-md bg-gray-50">
                    <p className="text-gray-500">Upload results will appear here</p>
                  </div>
                )}
              </div>
            </div>
        {decryptedData && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Decrypted FHIR Data</h2>
            <div className="overflow-auto p-3 border border-gray-300 rounded-md bg-gray-50">
              <pre className="text-sm whitespace-pre-wrap">
                {typeof decryptedData === 'object' 
                  ? JSON.stringify(decryptedData, null, 2) 
                  : decryptedData}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Process Logs</h2>
          <div className="h-48 overflow-auto p-3 border border-gray-300 rounded-md bg-black text-white font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">Logs will appear here as you perform actions</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`text-sm mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  'text-gray-300'
                }`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}