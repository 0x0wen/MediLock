import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useWallet } from '@solana/wallet-adapter-react';
import { registerUser, requestAirdrop, getUserPDA } from '../../utils';
import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { CalendarIcon, ChevronRight, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const Route = createFileRoute('/register/')({
  component: RegistrationPage,
})

function RegistrationPage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  
  // Registration state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type: string }>>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form state
  const [nik, setNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");
  const [consentChecked, setConsentChecked] = useState([true, true, true]);
  const [showSuccessUI, setShowSuccessUI] = useState(false);
  
  // Map bloodType select values to actual values needed for registration
  const bloodTypeMap: Record<string, string> = {
    "a-plus": "A+", 
    "a-minus": "A-", 
    "b-plus": "B+", 
    "b-minus": "B-", 
    "ab-plus": "AB+", 
    "ab-minus": "AB-", 
    "o-plus": "O+", 
    "o-minus": "O-"
  };

  // Map gender select values to the format needed by the contract
  const genderMap: Record<string, any> = {
    "male": { male: {} },
    "female": { female: {} },
    "other": { other: {} },
    "prefer-not-to-say": { preferNotToSay: {} }
  };

  // Map role values to the format needed by the contract
  const roleMap: Record<string, any> = {
    "patient": { patient: {} },
    "doctor": { doctor: {} }
  };

  useEffect(() => {
    
    // Redirect to home if not connected
    if (!connected || !publicKey) {
      navigate({ to: '/' });
    }
    
    // Check if already registered
    if (connected && publicKey) {
      checkUserRegistration();
    }
  }, [connected, publicKey, navigate]);

  // Function to check if the user is registered
  const checkUserRegistration = async () => {
    if (!publicKey) return;
    
    try {
      addLog("Checking user registration status...");
      
      // Get the user's PDA address
      const userPDA = getUserPDA(publicKey);
      
      // Check if the account exists on-chain
      const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
      const accountInfo = await connection.getAccountInfo(userPDA);
      
      if (accountInfo) {
        addLog(`User already registered: ${userPDA.toBase58().slice(0, 8)}...${userPDA.toBase58().slice(-8)}`, 'success');
        setShowSuccessUI(true);
        addLog("Redirecting to dashboard...");
        navigate({ to: '/dashboard' });
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

  const register = async () => {
    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Validate form
      if (!nik || nik.length < 15) {
        throw new Error('NIK must be at least 15 characters');
      }

      if (!fullName || fullName.trim().length < 3) {
        throw new Error('Full name is required');
      }

      if (!consentChecked.every(Boolean)) {
        throw new Error('You must agree to all consent terms');
      }
      
      setLoading(true);
      setIsRegistering(true);
      addLog(`Registering user as patient...`);
      
      // Request some SOL for testing if on devnet
      try {
        addLog("Requesting SOL airdrop for testing (devnet only)...");
        await requestAirdrop(publicKey);
        addLog("SOL airdrop received!", 'success');
      } catch (airdropError: any) {
        addLog(`Airdrop failed: ${airdropError.message}. If not on devnet, this is expected.`, 'warning');
      }
      
      // Prepare custom registration data from form
      const customRegisterUser = async (wallet: ReturnType<typeof useWallet>) => {
        try {
          if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
          }
          
          // Get user PDA
          const userPDA = getUserPDA(wallet.publicKey);
          
          // Check if user account already exists
          const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
          const accountInfo = await connection.getAccountInfo(userPDA);
          
          // If account already exists, return success without registering again
          if (accountInfo) {
            console.log("User already registered, account found at:", userPDA.toBase58());
            return { success: true, signature: "existing_account", alreadyRegistered: true };
          }
          
          console.log('Registering new user with provided data...');
          const provider = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
          
          // Parse date to timestamp (Unix seconds)
          const dateParts = birthdate.split('/');
          let birthdateTimestamp: number;
          if (dateParts.length === 3) {
            // Assuming format is MM/DD/YY
            const year = parseInt(dateParts[2]) < 100 ? 2000 + parseInt(dateParts[2]) : parseInt(dateParts[2]);
            const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
            const day = parseInt(dateParts[1]);
            birthdateTimestamp = Math.floor(new Date(year, month, day).getTime() / 1000);
          } else {
            // Fallback to current date minus 25 years
            birthdateTimestamp = Math.floor(Date.now() / 1000) - 25 * 365 * 24 * 60 * 60;
          }
          
          // Use the imported registerUser function with our form data
          const result = await registerUser(wallet, {
            nik,
            full_name: fullName,
            blood_type: bloodTypeMap[bloodType] || "O+",
            birthdate: new anchor.BN(birthdateTimestamp),
            gender: genderMap[gender] || { male: {} },
            email,
            phone_number: phoneNumber,
            role: roleMap[role] || { patient: {} }
          });
          
          return result;
        } catch (error) {
          console.error("Error in custom registration:", error);
          throw error;
        }
      };
      
      
      const result = await customRegisterUser(wallet);
      if (result.alreadyRegistered) {
        addLog(`User is already registered. Continuing to dashboard...`, 'success');
        navigate({ to: '/dashboard' });
      } else if (result.success) {
        addLog(`User registered successfully: ${result.signature}`, 'success');
        setShowSuccessUI(true);
      } else {
        throw new Error('Registration failed');
      }
      return result;
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(`Registration failed: ${error.message}`);
      addLog(`Registration failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setIsRegistering(false);
    }
  };

  const handleConsentChange = (index: number, checked: boolean) => {
    setConsentChecked(prev => {
      const newConsent = [...prev];
      newConsent[index] = checked;
      return newConsent;
    });
  };

  // Show registration success UI
  if (showSuccessUI) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">
            Medilock - Registration Successful
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <p className="font-semibold">Registration Successful!</p>
              <p className="text-sm mt-1">Your wallet is now registered as a {role === "patient" ? "patient" : "doctor"}.</p>
                <Link
                  to={'/dashboard'}
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
                >
                  Go to Dashboard
                </Link>
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

  // Main registration form UI (integrated from ui.tsx)
  return (
    <div className="flex min-h-screen bg-[#fbfbfb] pt-20">
      {/* Left side - Blue gradient with text */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#4aa5e7] to-[#1565a0] p-8 items-center justify-center relative">
        <div className="text-white text-4xl font-medium max-w-md">
          <p>Your medical records are tamper-proof, encrypted, and always within reach — powered by blockchain.</p>
        </div>
        <div className="absolute bottom-0 w-full">
          <img src="/placeholder.svg?height=400&width=600" alt="Medical dashboard preview" className="w-full" />
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full md:w-1/2 p-8 md:p-16 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-[#000000] mb-3">Let's get to know you.</h1>
          <p className="text-[#707070] mb-8">These details help us personalize and organize your health records.</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="nik" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                NIK
              </label>
              <Input 
                id="nik" 
                placeholder="32XXXXXXXXXXXXXX" 
                className="w-full border-[#d0d5dd] rounded-md"
                value={nik}
                onChange={(e) => setNik(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  FULL NAME
                </label>
                <Input
                  id="fullName"
                  placeholder="Xxxx Xxxxxx Xxxxxx"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border-[#d0d5dd] rounded-md"
                />
              </div>
              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  BLOOD TYPE
                </label>
                <Select 
                  value={bloodType}
                  onValueChange={setBloodType}
                >
                  <SelectTrigger className="w-full border-[#d0d5dd] rounded-md">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a-plus">A+</SelectItem>
                    <SelectItem value="a-minus">A-</SelectItem>
                    <SelectItem value="b-plus">B+</SelectItem>
                    <SelectItem value="b-minus">B-</SelectItem>
                    <SelectItem value="ab-plus">AB+</SelectItem>
                    <SelectItem value="ab-minus">AB-</SelectItem>
                    <SelectItem value="o-plus">O+</SelectItem>
                    <SelectItem value="o-minus">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  BIRTHDATE
                </label>
                <div className="relative">
                  <Input
                    id="birthdate"
                    placeholder="01/01/01"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full border-[#d0d5dd] rounded-md pr-10"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#707070] h-5 w-5" />
                </div>
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  GENDER
                </label>
                <Select 
                  value={gender}
                  onValueChange={setGender}
                >
                  <SelectTrigger className="w-full border-[#d0d5dd] rounded-md">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  EMAIL
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owentobias@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-[#d0d5dd] rounded-md"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  PHONE NUMBER
                </label>
                <Input
                  id="phone"
                  placeholder="08135221982"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border-[#d0d5dd] rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                ROLE
              </label>
              <Select 
                value={role}
                onValueChange={setRole}
              >
                <SelectTrigger className="w-full border-[#d0d5dd] rounded-md">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select your role in the healthcare system. This affects what actions you can perform in the app.
              </p>
            </div>
            <div className="flex justify-end mt-8">
              <Button 
                className="bg-[#1a81cd] hover:bg-[#1565a0] text-white px-8 py-2 rounded-md flex items-center"
                onClick={register}
                disabled={loading || isRegistering || !connected || !publicKey}
              >
                {loading ? 'Registering...' : 'Register'} 
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
