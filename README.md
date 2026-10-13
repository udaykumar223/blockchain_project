# 🏠 Secure Land Record Verification System
## Ownership Transfer Audit Using Blockchain

A blockchain-powered system that provides an additional verification and audit layer for land records. This system uses smart contracts to register properties, verify document integrity using SHA-256 hashing, and maintain an immutable ownership transfer history.

> **Disclaimer:** This is an academic project and does NOT replace official government land registries. It uses simulated/sample property records only.

---

## 📋 Problem Statement

Traditional land record management systems are vulnerable to:
- **Document tampering** — paper or digital records can be altered without detection
- **Unauthorized transfers** — ownership changes may occur without proper authorization
- **Lack of audit trail** — no transparent history of who owned the property and when
- **Verification difficulties** — no reliable way to verify if a document is genuine

## 🎯 Objectives

1. Provide a tamper-proof verification layer for land documents using SHA-256 hashing
2. Store document fingerprints on a blockchain smart contract for immutability
3. Restrict property registration and ownership transfers to an authorized registrar
4. Maintain a complete, chronological ownership transfer history
5. Detect any modification to registered documents instantly

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)           │
│   Home | Dashboard | Register | Transfer | Verify   │
│              | History | Transactions               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP API (port 3000 → proxy)
┌──────────────────────▼──────────────────────────────┐
│              Backend (Express.js, port 5000)         │
│   • SHA-256 hash calculation from actual file bytes  │
│   • Input validation & error handling                │
│   • ethers.js contract interaction                   │
└──────────────────────┬──────────────────────────────┘
                       │ JSON-RPC (port 8545)
┌──────────────────────▼──────────────────────────────┐
│         Local Blockchain (Hardhat Node)              │
│   • LandRecordVerification.sol smart contract        │
│   • Registrar access control (immutable)             │
│   • Property registry, doc hashes, transfer history  │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

| Component         | Technology            |
|-------------------|-----------------------|
| Frontend          | React.js + Vite       |
| Styling           | Vanilla CSS (dark mode)|
| Backend           | Node.js + Express.js  |
| Smart Contract    | Solidity 0.8.24       |
| Blockchain Dev    | Hardhat               |
| Blockchain Client | ethers.js v6          |
| Document Hash     | SHA-256               |
| Testing           | Hardhat + Chai + Mocha|

## 📁 Project Structure

```
blockchain_project/
├── contracts/
│   └── LandRecordVerification.sol    # Solidity smart contract
├── scripts/
│   └── deploy.js                     # Contract deployment script
├── test/
│   └── LandRecordVerification.test.js # Automated tests
├── backend/
│   ├── package.json
│   └── server.js                     # Express API server
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, ToastContainer
│   │   ├── pages/                    # All 7 pages
│   │   ├── services/                 # API service layer
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── App.jsx                   # Main application
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Complete design system
│   ├── index.html
│   └── vite.config.js
├── deployment/                        # Auto-generated on deploy
│   ├── deployment.json               # Contract address & network
│   └── LandRecordVerification.json   # Contract ABI
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18 or later
- **npm** v8 or later
- A modern web browser

### Step 1: Install Dependencies

```bash
# Install root dependencies (Hardhat + ethers)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2: Compile the Smart Contract

```bash
npx hardhat compile
```

### Step 3: Run Automated Tests

```bash
npx hardhat test
```

You should see all tests passing (registration, verification, transfers, authorization, history).

### Step 4: Start the Local Blockchain

Open **Terminal 1** and run:
```bash
npx hardhat node
```
This starts a local Ethereum node at `http://127.0.0.1:8545` with pre-funded test accounts.

**Keep this terminal open.**

### Step 5: Deploy the Smart Contract

Open **Terminal 2** and run:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
This deploys the contract and saves the address to `deployment/deployment.json`.

### Step 6: Start the Backend Server

In the same or another terminal:
```bash
node backend/server.js
```
The backend runs on `http://localhost:5000`.

### Step 7: Start the Frontend

Open **Terminal 3** and run:
```bash
cd frontend && npm run dev
```
The frontend runs on `http://localhost:3000`.

---

## 🧪 Sample Test Data

| Property ID | Owner  | Document              |
|-------------|--------|-----------------------|
| P101        | Ravi   | Any PDF file          |
| P102        | Arun   | Any different PDF     |
| P103        | Priya  | Any other PDF         |

### Demo Procedure (7 Steps)

1. **Register P101** — Go to Register, enter `P101`, owner `Ravi`, upload a PDF → see blockchain confirmation
2. **Verify original PDF** — Go to Verify, enter `P101`, upload the same PDF → see `VERIFIED`
3. **Show hash mismatch** — Go to Verify, enter `P101`, upload a *different* PDF → see `HASH MISMATCH`
4. **Transfer ownership** — Go to Transfer, enter `P101`, current owner `Ravi`, new owner `Arun`, upload a new PDF → see confirmation
5. **Verify updated document** — Go to Verify, enter `P101`, upload the transfer PDF → see `VERIFIED`
6. **View history** — Go to History, enter `P101` → see both the original registration and the transfer
7. **Unauthorized transfer** — The smart contract rejects transfers from non-registrar wallets (tested in automated tests)

---

## ⚙️ Smart Contract Details

The `LandRecordVerification` contract implements:

| Feature                    | Description                                        |
|----------------------------|----------------------------------------------------|
| Registrar authorization    | Only deployer can register/transfer (immutable)    |
| Property registration      | Stores property ID, owner name, document hash      |
| Unique property IDs        | Rejects duplicate registrations                    |
| Document hash storage      | SHA-256 hash stored on-chain (not the actual PDF)  |
| Ownership transfers        | Updates owner and preserves transfer history        |
| Transfer history           | Complete chronological chain of previous owners     |
| Document verification      | Compares provided hash against stored hash          |
| Events                     | Emits PropertyRegistered and OwnershipTransferred   |

## 🔒 Security Features

- **Immutable registrar** — uses `immutable` keyword; no setter function exists
- **Access control** — `onlyRegistrar` modifier on state-changing functions
- **Input validation** — rejects empty IDs, names, and zero hashes
- **Owner mismatch check** — transfers require correct current owner name
- **Server-side hashing** — SHA-256 computed from actual file bytes on the backend
- **No private keys in frontend** — all signing happens on the backend

## ⚠️ Limitations & Future Enhancements

### Current Limitations
- Uses a local Hardhat blockchain (not a public testnet or mainnet)
- Single registrar model (no multi-signature governance)
- Backend stores transaction log in memory (resets on server restart)
- No user authentication or role-based access for the web interface
- Document is hashed but not stored permanently

### Future Enhancements
- Deploy to Ethereum Sepolia testnet or Polygon Mumbai
- Add MetaMask wallet integration for multi-party verification
- Implement IPFS for decentralized document storage
- Add multi-registrar governance with voting
- Build a mobile-responsive PWA
- Add QR code generation for property certificates
- Implement court dispute resolution workflow

---

## 📝 License

This project is developed for academic purposes as part of a B.Tech CSE curriculum.
