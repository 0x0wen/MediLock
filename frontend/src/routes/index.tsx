import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { getUserPDA, requestAirdrop } from "../utils";
import * as web3 from "@solana/web3.js";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  // Replace direct wallet state with useWallet hook
  const { publicKey, connected, connect, disconnect } = useWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<
    Array<{ timestamp: string; message: string; type: string }>
  >([]);
  const [userDetails, setUserDetails] = useState<{
    publicKey: string;
    pdaAddress: string;
    isRegistered: boolean;
  } | null>(null);
  const [isAirdropping, setIsAirdropping] = useState(false);

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
      const connection = new web3.Connection(
        web3.clusterApiUrl("devnet"),
        "confirmed"
      );
      const accountInfo = await connection.getAccountInfo(userPDA);
      const isRegistered = !!accountInfo;

      setUserDetails({
        publicKey: publicKey.toBase58(),
        pdaAddress,
        isRegistered,
      });

      if (isRegistered) {
        addLog(
          `User account found: ${pdaAddress.slice(0, 8)}...${pdaAddress.slice(-8)}`,
          "success"
        );
      } else {
        addLog(`No user account found. Please register.`, "warning");
      }
    } catch (error) {
      console.error("Error checking user registration:", error);
      addLog(
        `Error checking registration: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
    }
  };

  // Add log entry with timestamp
  const addLog = (message: string, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [...prevLogs, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Request SOL airdrop function
  const handleAirdrop = async () => {
    if (!publicKey) {
      addLog("Wallet not connected", "error");
      return;
    }

    try {
      setIsAirdropping(true);
      addLog("Requesting SOL airdrop (Devnet only)...");

      const signature = await requestAirdrop(publicKey, 2); // Request 2 SOL

      addLog(
        `SOL airdrop successful! Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        "success"
      );
    } catch (error) {
      console.error("Airdrop error:", error);
      addLog(
        `Airdrop failed: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
    } finally {
      setIsAirdropping(false);
    }
  };

  const connectWallet = async () => {
    try {
      setError("");
      setLoading(true);
      addLog("Attempting to connect wallet...");

      await connect();
      addLog(
        `Successfully connected to wallet: ${publicKey?.toString().slice(0, 6)}...${publicKey?.toString().slice(-4)}`,
        "success"
      );
    } catch (error: Error | unknown) {
      console.error("Error connecting to wallet:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setError(`Failed to connect wallet: ${errorMessage}`);
      addLog(`Wallet connection failed: ${errorMessage}`, "error");
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
    <div className="flex flex-col min-h-screen">
      {/* Header with wallet status */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-3xl font-bold">MediLock</h1>
            <span className="ml-2 px-3 py-1 bg-blue-600 rounded-full text-sm">
              Beta
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {connected && publicKey ? (
              <div className="flex items-center">
                <span className="hidden md:inline text-sm mr-2">
                  Connected:{" "}
                </span>
                <span className="bg-white bg-opacity-20 text-sm rounded-full px-3 py-1">
                  {publicKey.toBase58().slice(0, 6)}...
                  {publicKey.toBase58().slice(-4)}
                </span>
                <button
                  onClick={() => disconnectWallet()}
                  className="ml-2 bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded transition-colors"
                >
                  Disconnect
                </button>
                <button
                  onClick={handleAirdrop}
                  disabled={isAirdropping}
                  className="ml-2 bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded transition-colors disabled:opacity-50"
                >
                  {isAirdropping ? "Getting SOL..." : "Get Test SOL"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectWallet()}
                className="bg-white text-blue-800 hover:bg-blue-100 py-2 px-4 rounded font-medium transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-16">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your health data on the blockchain
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Secure, private, and always accessible medical records powered
                by Solana.
              </p>

              {connected && publicKey ? (
                <div className="space-y-4">
                  {userDetails?.isRegistered ? (
                    <Link
                      to="/dashboard/add"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Register Now
                    </Link>
                  )}

                  {/* Display wallet and application status */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-medium text-lg mb-2">
                      Your Wallet Status
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-mono">
                          {publicKey.toBase58().slice(0, 8)}...
                          {publicKey.toBase58().slice(-8)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Registered:</span>
                        <span
                          className={
                            userDetails?.isRegistered
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {userDetails?.isRegistered ? "Yes" : "No"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => connectWallet()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Connect Your Wallet
                </button>
              )}
            </div>

            <div className="md:w-1/2 flex justify-center">
              <img
                src="/hero-image.svg"
                alt="Medical records on blockchain"
                className="max-w-full h-auto"
                width="500"
                height="400"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
              <p className="text-gray-600">
                Your medical records are securely stored on the Solana
                blockchain, tamper-proof and encrypted.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Control Access</h3>
              <p className="text-gray-600">
                You decide which healthcare providers can access your records
                and for how long.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">FHIR Compatible</h3>
              <p className="text-gray-600">
                Works with the healthcare industry standard Fast Healthcare
                Interoperability Resources (FHIR) format.
              </p>
            </div>
          </div>

          {/* Logs Section (only show when connected) */}
          {connected && logs.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-16">
              <h3 className="text-xl font-semibold mb-4">Activity Log</h3>
              <div className="bg-gray-100 p-3 rounded-md max-h-48 overflow-y-auto font-mono text-sm">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      log.type === "error"
                        ? "text-red-600"
                        : log.type === "success"
                          ? "text-green-600"
                          : log.type === "warning"
                            ? "text-yellow-600"
                            : "text-gray-700"
                    }`}
                  >
                    [{log.timestamp}] {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">MediLock</h2>
              <p className="text-gray-400 text-sm">
                Secure medical records on the blockchain
              </p>
            </div>

            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Docs
              </a>
              <a
                href="https://github.com/username/medilock"
                className="text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
