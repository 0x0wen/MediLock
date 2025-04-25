import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useWallet } from '@solana/wallet-adapter-react';
import { registerUser, requestAirdrop } from '../../utils';

export const Route = createFileRoute('/login/')({
  component: RegistrationPage,
})

function RegistrationPage() {
  // Replace direct wallet state with useWallet hook
  const { publicKey, signTransaction, signAllTransactions, connected, connect, disconnect, wallet } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [userRegistered, setUserRegistered] = useState(false);

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
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      setError(`Failed to connect wallet: ${error.message}`);
      addLog(`Wallet connection failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerAsPatient = async () => {
    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      setLoading(true);
      addLog("Registering user as patient...");
      
      // Request some SOL for testing if on devnet
      try {
        addLog("Requesting SOL airdrop for testing (devnet only)...");
        await requestAirdrop(publicKey);
        addLog("SOL airdrop received!", 'success');
      } catch (airdropError) {
        addLog(`Airdrop failed: ${airdropError.message}. If not on devnet, this is expected.`, 'warning');
      }
      addLog(`HOHOHOHO`, 'error');
      
      // Use the wallet adapter from useWallet hook
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };
      addLog(`HOHOHOHO`, 'error');
      
      const result = await registerUser(walletAdapter, "patient");
      addLog(`User registered as patient: ${result.signature}`, 'success');
      setUserRegistered(true);
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      setError(`Registration failed: ${error.message}`);
      addLog(`Registration failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    disconnect();
    addLog("Disconnected from wallet");
    setUserRegistered(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Solana EMR Registration
        </h1>
        
        {/* Wallet Connection Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              {publicKey && (
                <p className="text-sm text-gray-600 mt-1">
                  Connected: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
                </p>
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
              {loading && !connected ? 'Connecting...' : connected ? 'Disconnect Wallet' : 'Connect Phantom Wallet'}
            </button>
          </div>
        </div>

        {/* Registration Card */}
        {connected && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Patient Registration</h2>
            <p className="text-gray-600 mb-6">
              Register your wallet to enable secure storage and access to your electronic medical records on the blockchain.
            </p>

            <div className="flex flex-col space-y-4">
              {!userRegistered ? (
                <button
                  onClick={registerAsPatient}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register as Patientz'}
                </button>
              ) : (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                  <p className="font-semibold">Registration Successful!</p>
                  <p className="text-sm mt-1">Your wallet is now registered as a patient account.</p>
                  <div className="mt-4">
                    <Link
                      to="/upload"
                      className="inline-block w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md text-center"
                    >
                      Continue to Records Upload
                    </Link>
                  </div>
                </div>
              )}
            </div>
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
              <li>Encrypt your medical records with your wallet's keys</li>
              <li>Store encrypted data on IPFS with blockchain references</li>
              <li>Only you can access and decrypt your medical information</li>
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