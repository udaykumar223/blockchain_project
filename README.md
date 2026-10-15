# TerraVault: Blockchain-Based Land Record Verification System

An academic prototype of a secure, decentralized real-estate cadastre and land record verification system built with **Solidity**, **Hardhat**, **Ethers.js v6**, and **React (Vite)**.

> **Academic Prototype Notice:**  
> This system uses simulated property records for educational demonstration, research, and cryptographic title verification. It is not intended to replace statutory government land registries or official title deed registries.

---

## 1. System Overview & Core Technical Contributions

The system demonstrates three primary technical pillars:

1. **Role-Based Ownership Validation & Dual-Control Transfers:**
   - Property registration is strictly restricted to the authorized administrative **Registrar** (`onlyRegistrar`).
   - Ownership transfers cannot be unilaterally executed:
     - An ownership transfer request can **only** be initiated by the verified, currently registered owner (`msg.sender == currentOwner`).
     - A requested transfer enters a `pendingTransfers` queue and **only** takes effect when the authorized Registrar approves the transaction (`approveTransfer`).
     - The Registrar can also reject fraudulent or improper requests (`rejectTransfer`), returning the property to normal status.

2. **Off-Chain Document Cryptographic Integrity (SHA-256):**
   - The system utilizes the browser's native **Web Crypto API** (`crypto.subtle.digest("SHA-256", arrayBuffer)`) to generate 256-bit cryptographic fingerprints from uploaded title deeds, conveyance contracts, or surveyed parcel documents.
   - The calculated hash is converted to Solidity `bytes32` format (`0x` + 64 hexadecimal characters).
   - Document contents are **never** stored on the public blockchain, guaranteeing privacy, saving gas, and preventing storage bloat.
   - Real-time comparison against on-chain hashes provides immediate visual feedback:
     - **`VERIFIED` (Green)**: Exact match confirming bit-for-bit document integrity.
     - **`MISMATCH` (Red)**: Discrepancy indicating document tampering, alteration, or wrong title deed.

3. **Immutable Blockchain Audit History & Chain of Custody:**
   - Every property maintains an immutable array of `AuditRecord` structs stored directly in smart contract state.
   - Records track the previous owner, new owner, document SHA-256 hash, action (`REGISTERED`, `TRANSFERRED`), and exact block timestamp.
   - An open audit ledger view enables anyone to inspect the complete provenance and historical chain of title.

---

## 2. On-Chain Deployment & Configuration

| Parameter | Configuration Value |
|---|---|
| **Contract Name** | `LandRecordVerification` |
| **Solidity Version** | `^0.8.20` (Compiled with `0.8.28`) |
| **Network Name** | Hardhat Local |
| **Network Chain ID** | `31337` (`0x7a69`) |
| **Local RPC Endpoint** | `http://127.0.0.1:8545` |
| **Deployed Contract Address** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **Initial Registrar (Deployer)** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Hardhat Account #0) |

---

## 3. Directory Structure

```
blockchain_project/
├── land-record-chain/                 # Hardhat smart contract development environment
│   ├── contracts/
│   │   └── LandRecordVerification.sol # Core Solidity smart contract
│   ├── scripts/
│   │   ├── deploy.js                  # Deployment script
│   │   ├── check_status.js            # Node & deployment verification utility
│   │   ├── inspect_state.js           # Query on-chain events and records
│   │   └── change_registrar.js        # Safe local script to transfer registrar role
│   ├── test/
│   │   └── LandRecordVerification.test.js # Automated unit tests (19 passing tests)
│   ├── hardhat.config.js              # Hardhat configuration
│   └── package.json
│
└── land-record-frontend/              # Modern React + Vite web dashboard
    ├── src/
    │   ├── config/
    │   │   └── contract.js            # Centralized ABI, address, and network config
    │   ├── context/
    │   │   └── Web3Context.jsx        # Ethers.js v6 MetaMask state manager
    │   ├── utils/
    │   │   ├── crypto.js              # Web Crypto API SHA-256 hashing utilities
    │   │   └── format.js              # Address, date, and hash formatters
    │   ├── components/
    │   │   ├── Navbar.jsx             # Navigation, network switch, role badge
    │   │   └── TransactionModal.jsx   # Real-time transaction feedback dialog
    │   ├── views/
    │   │   ├── DashboardView.jsx      # Metrics, quick shortcuts, recent events
    │   │   ├── RegisterPropertyView.jsx # Registrar property creation form
    │   │   ├── PropertyDetailsView.jsx  # Search, property card, embedded history
    │   │   ├── VerifyDocumentView.jsx   # SHA-256 upload and VERIFIED/MISMATCH check
    │   │   ├── TransferRequestView.jsx  # Owner transfer request submission
    │   │   ├── RegistrarPortalView.jsx  # Registrar approval / rejection portal
    │   │   └── HistoryExplorerView.jsx  # Full audit ledger filterable by ID
    │   ├── App.jsx                    # Application root
    │   ├── App.css                    # Component styles and responsive design
    │   └── index.css                  # Modern design tokens and typography
    ├── package.json
    └── vite.config.js
```

---

## 4. How to Run the System

### Step 1: Start the Local Blockchain Node
Open a terminal in `land-record-chain/`:
```bash
cd land-record-chain
npx hardhat node
```
*The local node will run at `http://127.0.0.1:8545` with Chain ID `31337`.*

### Step 2: Run Automated Contract Tests (Optional Verification)
In another terminal in `land-record-chain/`:
```bash
cd land-record-chain
npm test
```
*Runs 19 unit tests validating registrations, transfers, access controls, verification, and audit history.*

### Step 3: Start the React Frontend
Open a terminal in `land-record-frontend/`:
```bash
cd land-record-frontend
npm run dev
```
*Visit the local URL shown in your terminal (typically `http://localhost:5173/` or `http://localhost:5174/`).*

---

## 5. MetaMask Configuration & Test Accounts

### Adding Hardhat Local to MetaMask:
- **Network Name:** `Hardhat Local`
- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency Symbol:** `ETH`

### Test Accounts for Evaluation:
You can import the following default Hardhat private keys into MetaMask:

1. **Account #0 (Authorized Registrar):**
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Role: Initial Registrar (can register properties and approve/reject transfers).

2. **Account #1 (Citizen / Property Owner A):**
   - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Role: Test citizen and initial property owner.

3. **Account #2 (Citizen / Buyer B):**
   - Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
   - Role: Test buyer for property transfer requests.

### Safe Script to Change Registrar to Your MetaMask Address:
If you prefer to use your own personal MetaMask address as the Registrar without importing Account #0, run this command from `land-record-chain/`:
```bash
npx hardhat run scripts/change_registrar.js --network localhost <YOUR_METAMASK_ADDRESS>
```
*This script uses the current authorized registrar (Account #0) to invoke `changeRegistrar(newRegistrar)` safely on the active contract.*

---

## 6. Academic Evaluation Demo Script

Follow these steps for a live project demonstration or grading presentation:

### Phase 1: Property Registration by Registrar
1. Connect MetaMask using **Account #0** (`0xf39F...2266`). Notice the green **👑 Registrar** badge in the navbar.
2. Navigate to **Register Property**.
3. Enter Property ID: `101`. Notice the live indicator displaying `✓ ID Available`.
4. Enter Initial Owner: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Citizen #1).
5. Click **Title Deed Text Input** and click **Insert Sample Title Deed** (or upload any PDF/text document).
6. Notice the instantaneous computation of the 32-byte SHA-256 fingerprint via the Web Crypto API.
7. Click **Register Property on Blockchain** and confirm in MetaMask.
8. The transaction modal indicates confirmation and automatically records the title on-chain.

### Phase 2: Document Verification (Verified vs. Mismatch)
1. Navigate to **Verify Document**.
2. Select Property `#101`. The registered on-chain hash is fetched from contract storage.
3. In the **Academic Evaluation Quick Tests** section:
   - Click **Test Exact Match (Verified)**: The card glows **Emerald Green** displaying `VERIFIED`. The smart contract `verifyDocument()` returns `true`.
   - Click **Test Tampered/Altered Hash (Mismatch)**: The card glows **Rose Red** displaying `MISMATCH`. The discrepancy between registered and submitted hash is displayed side-by-side.

### Phase 3: Ownership Transfer Request (Current Owner Only)
1. Switch MetaMask account to **Account #1** (`0x7099...79C8`).
2. Navigate to **Request Transfer**.
3. Select Property `#101`. The banner confirms: `Ownership Validated: You are connected as the verified legal owner`.
4. Set New Owner to **Account #2** (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`).
5. Upload or enter a conveyance agreement to generate the new document hash.
6. Click **Submit Transfer Request to Registrar** and confirm in MetaMask.
7. Property `#101` now displays `Transfer Pending Approval`.

### Phase 4: Registrar Approval & Updated Chain of Custody
1. Switch MetaMask back to **Account #0** (Registrar).
2. Navigate to **Registrar Portal**. Notice the pending transfer count badge in the navbar.
3. Review the pending transfer for Property `#101` (From Citizen #1 → To Citizen #2).
4. Click **Approve & Transfer Title** and confirm in MetaMask.
5. Navigate to **Search & Details** for Property `#101`:
   - Current Legal Owner is now updated to Citizen #2 (`0x3C44...93BC`).
   - The registered document hash has updated to the new conveyance deed hash.
   - The **Audit Trail** timeline shows two immutable chronological events: `REGISTERED` followed by `TRANSFERRED`.
6. Navigate to **Audit Ledger** to view the system-wide chain of custody table.

---

## 7. Security Features & Academic Limitations

### Implemented Controls:
- **No private keys in frontend:** All signatures are securely prompted through MetaMask.
- **Fail-safe revert handling:** User-friendly translated error messages for all Solidity reverts.
- **Pre-flight state checks:** Frontend checks property existence and ownership before initiating transactions to protect users from unnecessary gas spend.
- **Data persistence:** Audit records are preserved permanently in EVM storage.

### Academic Limitations:
- The prototype operates on a local single-node test blockchain (`chainId: 31337`).
- Physical ground surveys and legal identity verification are assumed out-of-scope.
- In production, property records would be linked to decentralized identifier (DID) credentials and statutory registry APIs.
