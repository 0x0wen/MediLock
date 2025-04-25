import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserPDA } from '../utils';
import * as web3 from '@solana/web3.js';

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  // Replace direct wallet state with useWallet hook
  const { publicKey, connected, connect, disconnect } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [userDetails, setUserDetails] = useState<{ 
    publicKey: string;
    pdaAddress: string;
    isRegistered: boolean;
  } | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      checkUserRegistration();
    } else {
      setUserDetails(null);
    }
  }, [connected, publicKey]);

  // Function to check if the user is registered
  const checkUserRegistration = async () => {
    if (!publicKey) return;
    
    try {
      addLog("Checking user registration status...");
      
      // Get the user's PDA address
      const userPDA = getUserPDA(publicKey);
      const pdaAddress = userPDA.toBase58();
      
      // Check if the account exists on chain
      const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
      const accountInfo = await connection.getAccountInfo(userPDA);
      const isRegistered = !!accountInfo;
      
      setUserDetails({
        publicKey: publicKey.toBase58(),
        pdaAddress,
        isRegistered
      });
      
      if (isRegistered) {
        addLog(`User account found: ${pdaAddress.slice(0, 8)}...${pdaAddress.slice(-8)}`, 'success');
      } else {
        addLog(`No user account found. Please register.`, 'warning');
      }
    } catch (error) {
      console.error("Error checking user registration:", error);
      addLog(`Error checking registration: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  // Add log entry with timestamp
  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const connectWallet = async () => {
    try {
      setError('');
      setLoading(true);
      addLog("Attempting to connect wallet...");

      await connect();
      addLog(`Successfully connected to wallet: ${publicKey?.toString().slice(0, 6)}...${publicKey?.toString().slice(-4)}`, 'success');
    } catch (error: Error | unknown) {
      console.error('Error connecting to wallet:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to connect wallet: ${errorMessage}`);
      addLog(`Wallet connection failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    disconnect();
    addLog("Disconnected from wallet");
    setUserDetails(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Medilock - Secure Medical Records
        </h1>
        
        {/* Wallet Connection Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              {publicKey && (
                <div className="text-sm text-gray-600 mt-1">
                  {userDetails && (
                    <p className="mt-1"><span className="font-semibold">Account:</span> {userDetails.pdaAddress}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={connected ? disconnectWallet : connectWallet}
              disabled={loading}
              className={`px-4 py-2 rounded-md w-full sm:w-auto ${
                connected 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Connecting...' : connected ? 'Disconnect Wallet' : 'Connect Phantom Wallet'}
            </button>
          </div>
        </div>

        
        {/* Next Steps Card for Connected Wallet */}
        {connected && publicKey && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            
            {!userDetails?.isRegistered ? (
              <>
                <p className="text-gray-600 mb-4">
                  Your wallet is connected, but you haven't registered with Medilock yet.
                </p>
                <Link
                  to="/register"
                  className="inline-block w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md text-center"
                >
                  Register Account
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Your wallet is registered with Medilock. You can now access your dashboard.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-block w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md text-center"
                >
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        )}
        
        {/* About EMR Security */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">About Secure EMR on Solana</h2>
          <div className="prose">
            <p>
              This application demonstrates a secure way to store Electronic Medical Records (EMR) 
              using blockchain technology and client-side encryption:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Connect your wallet to establish your identity</li>
              <li>Register as a patient on the blockchain</li>
              <li>Encrypt medical records with your wallet's keys</li>
              <li>Store encrypted data on IPFS with blockchain references</li>
              <li>Only authorized users can access and decrypt information</li>
            </ul>
          </div>
        </div>
        
        {/* Logs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Process Logs</h2>
          <div className="h-48 overflow-auto p-3 border border-gray-300 rounded-md bg-black text-white font-mono">
            {logs.length === 0 ? (
              <p className="text-gray-500">Logs will appear here as you perform actions</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`text-sm mb-1 ${
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