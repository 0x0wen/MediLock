import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useWallet } from '@solana/wallet-adapter-react';
import { registerUser, requestAirdrop, checkIsDoctor, getUserPDA } from '../../utils';
import * as web3 from '@solana/web3.js';

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
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient');
  const [userDetails, setUserDetails] = useState<{ 
    publicKey: string;
    role: string;
    pdaAddress: string;
    isDoctor: boolean;
  } | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      checkUserRegistration();
    } else {
      setUserDetails(null);
    }
  }, [connected, publicKey, userRegistered]);

  // Function to check if the user is registered and get their role
  const checkUserRegistration = async () => {
    if (!publicKey) return;
    
    try {
      addLog("Checking user registration status...");
      
      // Check if the user is a doctor
      const isDoctor = await checkIsDoctor(publicKey);
      
      // Get the user's PDA address
      const pdaAddress = getUserPDA(publicKey).toBase58();
      
      setUserDetails({
        publicKey: publicKey.toBase58(),
        role: isDoctor ? "Doctor" : "Patient",
        pdaAddress,
        isDoctor
      });
      
      if (isDoctor) {
        setUserRole('doctor');
      } else {
        setUserRole('patient');
      }
      
      if (pdaAddress) {
        setUserRegistered(true);
        addLog(`User account found: ${pdaAddress.slice(0, 8)}...${pdaAddress.slice(-8)}`, 'success');
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
    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      setError(`Failed to connect wallet: ${error.message}`);
      addLog(`Wallet connection failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const register = async (role: string) => {
    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      setLoading(true);
      setUserRole(role as 'patient' | 'doctor');
      addLog(`Registering user as ${role}...`);
      
      // Request some SOL for testing if on devnet
      try {
        addLog("Requesting SOL airdrop for testing (devnet only)...");
        await requestAirdrop(publicKey);
        addLog("SOL airdrop received!", 'success');
      } catch (airdropError: any) {
        addLog(`Airdrop failed: ${airdropError.message}. If not on devnet, this is expected.`, 'warning');
      }
      
      // Use the wallet adapter from useWallet hook
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };
      
      const result = await registerUser(walletAdapter, role);
      addLog(`User registered as ${role}: ${result.signature}`, 'success');
      setUserRegistered(true);
      
      // Update user details after registration
      await checkUserRegistration();
      
      return result;
    } catch (error: any) {
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
    setUserDetails(null);
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
                <div className="text-sm text-gray-600 mt-1">
                  <p><span className="font-semibold">Public Key:</span> {publicKey.toString()}</p>
                  {userDetails && (
                    <>
                      <p className="mt-1"><span className="font-semibold">Role:</span> <span className={userDetails.isDoctor ? "text-blue-600" : "text-green-600"}>{userDetails.role}</span></p>
                      <p className="mt-1"><span className="font-semibold">Account:</span> {userDetails.pdaAddress}</p>
                    </>
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
              {loading && !connected ? 'Connecting...' : connected ? 'Disconnect Wallet' : 'Connect Phantom Wallet'}
            </button>
          </div>
        </div>

        {/* User Details Card */}
        {connected && publicKey && userDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Details</h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody>
                  <tr className="border-b">
                    <td className="font-semibold py-2 pr-4 w-1/4">Public Key</td>
                    <td className="py-2 font-mono break-all">{userDetails.publicKey}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold py-2 pr-4">Role</td>
                    <td className={`py-2 ${userDetails.isDoctor ? "text-blue-600" : "text-green-600"}`}>{userDetails.role}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold py-2 pr-4">Program Account</td>
                    <td className="py-2 font-mono break-all">{userDetails.pdaAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Registration Card */}
        {connected && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Registration</h2>
            <p className="text-gray-600 mb-6">
              Register your wallet to enable secure storage and access to your electronic medical records on the blockchain.
            </p>

            <div className="flex flex-col space-y-4">
              {!userRegistered ? (
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={()=>register('patient')}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {loading && userRole === 'patient' ? 'Registering...' : 'Register as Patient'}
                  </button>
                  <button
                    onClick={()=>register('doctor')}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md disabled:opacity-50"
                  >
                    {loading && userRole === 'doctor' ? 'Registering...' : 'Register as Doctor'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                  <p className="font-semibold">Registration Successful!</p>
                  <p className="text-sm mt-1">Your wallet is now registered as a {userRole} account.</p>
                  <div className="mt-4">
                    <Link
                      to={userRole === 'doctor' ? "/dashboard/doctor" : "/upload"}
                      className="inline-block w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md text-center"
                    >
                      {userRole === 'doctor' ? 'Continue to Doctor Dashboard' : 'Continue to Records Upload'}
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
              <li>Register as a patient or doctor on the blockchain</li>
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
              logs.map((log: any, index) => (
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