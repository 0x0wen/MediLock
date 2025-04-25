import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { PublicKey } from '@solana/web3.js';
import { 
  uploadToIPFS, 
  registerUser, 
  addMedicalRecord, 
  getConnection,
  requestAirdrop
} from '../utils';

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [publicKeyObj, setPublicKeyObj] = useState(null);
  const [inputText, setInputText] = useState('');
  const [uploadResponse, setUploadResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [decryptedData, setDecryptedData] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);

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
  }, []);

  // Add log entry with timestamp
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const connectWallet = async () => {
    try {
      setError('');
      setLoading(true);
      addLog("Attempting to connect wallet...");

      // Check if Phantom is installed
      const { solana } = window;
      if (!solana || !solana.isPhantom) {
        throw new Error('Phantom wallet not found! Please install it from https://phantom.app/');
      }

      // Connect to wallet
      addLog("Requesting connection to Phantom wallet...");
      const response = await solana.connect();
      const walletPublicKey = response.publicKey.toString();
      const publicKeyObj = response.publicKey;
      
      setWallet(solana);
      setConnected(true);
      setPublicKey(walletPublicKey);
      setPublicKeyObj(publicKeyObj);
      addLog(`Successfully connected to wallet: ${walletPublicKey.slice(0, 6)}...${walletPublicKey.slice(-4)}`, 'success');

      // Check if we need to register the user
      // In a real app, you would check if the user is already registered
      // Here we'll just assume they need to register
      try {
        await registerAsPatient(solana, publicKeyObj);
      } catch (registerError) {
        addLog(`User registration failed: ${registerError.message}. Continuing anyway...`, 'warning');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setError(`Failed to connect wallet: ${error.message}`);
      addLog(`Wallet connection failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerAsPatient = async (solana, publicKey) => {
    try {
      addLog("Registering user as patient...");
      
      // Request some SOL for testing if on devnet
      try {
        addLog("Requesting SOL airdrop for testing (devnet only)...");
        await requestAirdrop(publicKey);
        addLog("SOL airdrop received!", 'success');
      } catch (airdropError) {
        addLog(`Airdrop failed: ${airdropError.message}. If not on devnet, this is expected.`, 'warning');
      }
      
      // Mock the useWallet hook return value
      const walletAdapter = {
        publicKey: publicKey,
        signTransaction: solana.signTransaction.bind(solana),
        signAllTransactions: solana.signAllTransactions.bind(solana),
      };
      
      const result = await registerUser(walletAdapter, "patient");
      addLog(`User registered as patient: ${result.signature}`, 'success');
      setUserRegistered(true);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (wallet) {
      wallet.disconnect();
      addLog("Disconnected from wallet");
    }
    setWallet(null);
    setConnected(false);
    setPublicKey(null);
    setPublicKeyObj(null);
    setDecryptedData(null);
    setUserRegistered(false);
  };

  // Helper function to convert a string to ArrayBuffer
  const stringToArrayBuffer = (str) => {
    return new TextEncoder().encode(str);
  };

  // Helper function to convert from Uint8Array to hex string
  const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Helper function to convert hex string to Uint8Array
  const hexToBuffer = (hex) => {
    const matches = hex.match(/.{1,2}/g);
    return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
  };

  const deriveEncryptionKey = async (message) => {
    if (!connected || !wallet) {
      throw new Error('Please connect your wallet first');
    }

    try {
      addLog(`Deriving encryption key from wallet signature...`);
      
      // Use wallet to sign the message
      const encodedMessage = stringToArrayBuffer(message);
      
      addLog("Requesting wallet signature...");
      // Phantom wallet returns a SignedMessage object with different structure
      const signatureResult = await wallet.signMessage(encodedMessage, 'utf8');
      addLog("Received wallet signature");
      
      // The signature may be directly returned or in a 'signature' property
      // Handle both cases to ensure compatibility with different wallet versions
      let signatureBytes;
      
      if (typeof signatureResult === 'object' && signatureResult.signature) {
        // Modern Phantom wallet returns { signature: Uint8Array }
        signatureBytes = signatureResult.signature;
      } else if (signatureResult instanceof Uint8Array) {
        // Direct signature return
        signatureBytes = signatureResult;
      } else if (typeof signatureResult === 'string') {
        // Some wallets might return a base64 or hex string
        // Try to decode it - assuming hex for now
        signatureBytes = hexToBuffer(signatureResult);
      } else {
        // Fallback - convert to string and then to bytes
        const sigStr = String(signatureResult);
        signatureBytes = stringToArrayBuffer(sigStr);
      }
      
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
    } catch (error) {
      console.error('Error deriving key:', error);
      addLog(`Key derivation failed: ${error.message}`, 'error');
      throw new Error(`Failed to derive encryption key: ${error.message}`);
    }
  };

  const encryptData = async (data) => {
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
    } catch (error) {
      console.error('Encryption error:', error);
      addLog(`Encryption failed: ${error.message}`, 'error');
      throw new Error(`Encryption failed: ${error.message}`);
    }
  };

  const decryptData = async (encryptedData) => {
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
    } catch (error) {
      console.error('Decryption error:', error);
      addLog(`Decryption failed: ${error.message}`, 'error');
      throw new Error(`Decryption failed: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      setUploadResponse(null);
      setDecryptedData(null);
      
      addLog("Starting FHIR data processing...");
      
      // Validate input
      if (!inputText) {
        throw new Error('Please enter FHIR data');
      }
      
      // Validate JSON
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
      
      // Mock the useWallet hook return value
      const walletAdapter = {
        publicKey: publicKeyObj,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: wallet.signAllTransactions.bind(wallet),
      };
      
      // Create metadata for the medical record
      const metadata = JSON.stringify({
        patientId: publicKey,
        recordType: parsedJson.resourceType || "Unknown",
        timestamp: new Date().toISOString()
      });
      
      // First upload to IPFS
      const ipfsHash = await uploadToIPFS(encryptedFile, {
        patientPublicKey: publicKey,
        timestamp: Date.now()
      });
      
      addLog(`Encrypted data uploaded to IPFS with hash: ${ipfsHash}`, 'success');
      
      // 4. Add the medical record to blockchain
      addLog("Step 4: Recording medical record on Solana blockchain...");
      const result = await addMedicalRecord(
        walletAdapter,
        publicKey, // In this case, patient is the same as the uploader
        metadata,
        encryptedFile,
        0 // This would normally be incremented for each patient record
      );
      
      // 5. Set the response
      const uploadResult = {
        ipfs: {
          hash: ipfsHash,
          url: `https://ipfs.io/ipfs/${ipfsHash}`
        },
        blockchain: {
          signature: result.signature,
          success: result.success
        },
        timestamp: new Date().toISOString()
      };
      
      setUploadResponse(uploadResult);
      
      addLog("FHIR data has been encrypted, uploaded to IPFS, and recorded on Solana blockchain!", 'success');
    } catch (error) {
      console.error('Process error:', error);
      setError(error.message);
      addLog(`Process failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndDecrypt = async (ipfsUrl) => {
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
    } catch (error) {
      console.error('Fetch and decrypt error:', error);
      setError(`Failed to fetch and decrypt: ${error.message}`);
      addLog(`Fetch and decrypt failed: ${error.message}`, 'error');
      return null;
    } finally {
      setFetchingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Secure EMR Upload with Solana
        </h1>
        
        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Wallet Connection</h2>
              {publicKey && (
                <p className="text-sm text-gray-600 mt-1">
                  Connected: {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
                  {userRegistered && <span className="ml-2 text-green-600">(Registered as Patient)</span>}
                </p>
              )}
            </div>
            <button
              onClick={connected ? disconnectWallet : connectWallet}
              disabled={loading}
              className={`px-4 py-2 rounded-md ${
                connected 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading && !connected ? 'Connecting...' : connected ? 'Disconnect Wallet' : 'Connect Phantom Wallet'}
            </button>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">FHIR Data Input</h2>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-md"
              placeholder="Enter FHIR formatted JSON here..."
            />
            
            <div className="mt-4">
              <button
                onClick={handleSubmit}
                disabled={!connected || loading}
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
                    onClick={() => fetchAndDecrypt(uploadResponse.ipfs.url)}
                    disabled={fetchingData || !connected}
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
        
        {/* Decrypted Data Section */}
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
        
        {/* Logs Section */}
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