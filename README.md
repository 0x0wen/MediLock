# MediLock

MediLock is a blockchain-based electronic medical record (EMR) system built on Solana that empowers patients to securely store, manage, and share their medical data with healthcare providers.

## 🔒 Key Features

- **Patient-Controlled Access**: Patients maintain complete ownership and control over their medical records
- **Blockchain Security**: Medical data is stored securely on the Solana blockchain with end-to-end encryption
- **Doctor Verification**: Certified healthcare providers can request access to patient records
- **Decentralized Storage**: Records are stored on IPFS with blockchain references for integrity
- **FHIR Compatibility**: Supports industry-standard healthcare data formats
- **Simple Interface**: User-friendly dashboard for both patients and healthcare providers

## 🏥 How It Works

### For Patients

1. **Register**: Connect your Solana wallet to establish your patient identity
2. **Upload Records**: Add your medical records directly or import existing FHIR data
3. **Manage Access**: Approve or deny provider access requests to your records
4. **Track History**: View comprehensive logs of all access to your medical information

### For Healthcare Providers

1. **Register & Verify**: Connect your Solana wallet and complete verification as a healthcare provider
2. **Search Patients**: Find patients using their Solana wallet address
3. **Request Access**: Submit requests to access patient records
4. **View Records**: Access and analyze approved patient medical data

## 🛠️ Technology Stack

- **Frontend**: React with Vite, TypeScript
- **Blockchain**: Solana (Anchor framework)
- **Storage**: IPFS via Pinata
- **Data Format**: FHIR (Fast Healthcare Interoperability Resources)
- **Authentication**: Solana wallet (Phantom, Solflare, etc.)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- Solana CLI
- Anchor framework
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/medilock.git
cd medilock
```

2. Install dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install Anchor dependencies
cd ../programs
anchor build
```

3. Configure environment

Create a `.env` file in the `frontend` directory:

```
VITE_SOLANA_NETWORK=devnet
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
VITE_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

4. Run the development server

```bash
cd frontend
npm run dev
```

## 💡 Security Model

MediLock uses a multi-layered security approach:

1. **Blockchain Verification**: All transactions and access requests are recorded on Solana
2. **Encryption**: Records are encrypted with keys derived from patient wallet signatures
3. **Decentralized Storage**: Encrypted data is stored on IPFS, with only references on-chain
4. **Access Control**: Patients explicitly approve each provider's access request
5. **Audit Logs**: All record accesses are permanently logged on the blockchain

## 🔄 Data Flow

1. Patient creates a record, which is:
   - Encrypted client-side using a wallet-derived key
   - Uploaded to IPFS as encrypted data
   - Referenced on-chain with metadata and IPFS CID

2. When a provider requests access:
   - An access request is created on-chain
   - Patient receives notification of pending request
   - Upon approval, patient shares a decryption key for specific records
   - Provider can temporarily access the decrypted data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
