# Project Synopsis Report
## Secure Land Record Verification System: Ownership Transfer Audit Using Blockchain

**Degree:** Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Academic Domain:** Blockchain Technology & Information Security  
**Project Type:** Capstone / Final Year Project  
**Status:** Implemented, Tested, and Verified  

---

### 1. Abstract
Land ownership disputes and fraudulent deed manipulation constitute a major challenge in developing and digitalizing property economies. Conventional centralized database registries remain susceptible to internal record altering, document forgery, unauthorized ownership reassignments, and opaque audit trails.

This project introduces the **Secure Land Record Verification System**, an immutable blockchain-backed audit and document fingerprinting layer built on top of land administration workflows. Rather than storing bulky and sensitive property deeds on-chain, our system applies cryptographic **SHA-256 digital fingerprinting** to land deed PDFs. The cryptographic hash, alongside the unique property identifier, owner name, timestamp, and registrar signatures, is committed to an Ethereum-compatible Solidity smart contract deployed via Hardhat. 

The application implements strict role-based access control where only the verified **Registrar** possesses the authority to mint property records and ratify ownership transfers, while maintaining a permanent, chronologically ordered on-chain provenance trail. Any post-registration tampering of a digital deed—down to a single modified byte—results in an immediate hash divergence, producing an unambiguous "HASH MISMATCH" notification upon verification. The end-to-end platform is bundled with a React/Vite dashboard, Node.js/Express backend, and automated test suite.

---

### 2. Problem Statement
Contemporary land governance systems suffer from critical security, transparency, and auditing vulnerabilities:
1. **Document Alteration & Forgery:** Digital certificates, scanned deed PDFs, and registry scans can be edited or cloned using image and PDF editing software without leaving detectable traces in basic file systems.
2. **Unauthorized Transfers & Collusion:** Rogue operators or compromised administrative accounts with write access to central databases can reassign land titles without multi-party verification or permanent accountability.
3. **Absence of Tamper-Evident Historical Lineage:** Centralized database rows can be updated in-place (`UPDATE properties SET owner = ...`), erasing or obfuscating previous historical states and making judicial audit complex and disputed.
4. **Public Verification Impediments:** Buyers, banks, and legal surveyors must navigate tedious, opaque manual verification procedures to validate whether a seller's title document matches the official authorized version.

---

### 3. Objectives
The key objectives of this system are:
- **Cryptographic Document Fingerprinting:** Generate a deterministic 256-bit SHA-256 hash of actual document bytes and record it immutably on the blockchain.
- **Registrar Authority Enforcement:** Enforce cryptographic smart contract modifiers (`onlyRegistrar`) such that no arbitrary wallet can forge or execute registrations or transfers.
- **Provenance & Chain of Custody Tracking:** Maintain a permanent, append-only chronological array of ownership transfers containing previous owner, new owner, document hash, block timestamp, and executor address.
- **Tamper Detection Engine:** Provide instant zero-knowledge document verification: compare uploaded file hashes against on-chain stored hashes without storing or exposing document contents on the public ledger.
- **Auditable Interface:** Deliver a professional web application providing registration, transfer, verification, historical auditing, and real-time ledger metrics.

---

### 4. Proposed System Architecture

The architecture adopts a decoupled 3-tier structure ensuring separation of concerns:

```
  +-------------------------------------------------------------------------+
  |                             PRESENTATION TIER                           |
  |                        React.js + Vite Web Application                   |
  |  - Home & Dashboard Metrics          - Ownership Transfer Form          |
  |  - Document Registration Form        - Document Verification Checker    |
  |  - Ownership Provenance Timeline     - Live Transaction Inspector       |
  +------------------------------------▲------------------------------------+
                                       │ REST API (JSON / Multipart-FormData)
                                       │ Port: 5000 (Vite Proxy: 3000)
  +------------------------------------▼------------------------------------+
  |                              APPLICATION TIER                           |
  |                         Node.js & Express.js Engine                     |
  |  - Memory-safe Multipart Handling (Multer in-memory buffers)            |
  |  - Server-Side SHA-256 Digest Computation (Node.js 'crypto' core)       |
  |  - Schema Validation, MIME Type Filtering (strictly PDF, max 10MB)       |
  |  - Blockchain Provider & Wallet Signer Integration (ethers.js v6)       |
  +------------------------------------▲------------------------------------+
                                       │ JSON-RPC (HTTP Provider)
                                       │ Port: 8545
  +------------------------------------▼------------------------------------+
  |                           DECENTRALIZED DATA TIER                       |
  |                         Solidity 0.8.24 Smart Contract                  |
  |  - LandRecordVerification.sol (EVM Compatible, Hardhat Network)         |
  |  - Access Controller: Immutable Registrar Address                       |
  |  - State Mappings: properties[id], transferHistory[id], propertyIds[]  |
  |  - Events: PropertyRegistered, OwnershipTransferred                     |
  +-------------------------------------------------------------------------+
```

#### Architectural Security Highlights:
- **No PDF storage on blockchain:** Preserves gas efficiency and privacy. Only the 32-byte hash (`bytes32`) is stored on-chain.
- **Server-side validation:** The client never dictates the hash value; file bytes are re-hashed strictly on the backend before contract submission.
- **Memory-only file processing:** Uploaded files are evaluated in volatile RAM buffers and promptly discarded, preventing server disk storage vulnerabilities.

---

### 5. Technologies and Tools Used

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Blockchain Platform** | Hardhat Local Node (EVM) | Local Ethereum-compatible consensus node and development environment |
| **Smart Contract** | Solidity 0.8.24 | Contract logic, access control, storage structures, and event emission |
| **Client Interface** | React 18, Vite | Single-page application, stateful UI components, high responsiveness |
| **Styling** | Vanilla CSS3 | Modern dark-mode theme, glassmorphism, responsive CSS grid/flexbox |
| **API Server** | Express.js, Node.js | REST routing, file uploads, transaction handling |
| **File Handling** | Multer | RAM-buffered multi-part PDF intake with file-type safeguards |
| **Cryptography** | Node.js Core `crypto` | SHA-256 deterministic cryptographic digest calculation |
| **Web3 Connector** | ethers.js v6 | Contract abstraction, JSON-RPC communication, transaction signing |
| **Unit Testing** | Mocha, Chai | Automated smart contract assertion testing (19 passing unit tests) |

---

### 6. Implementation Details

#### 6.1 Smart Contract Logic (`LandRecordVerification.sol`)
1. **Immutable Registrar Assignment:** During deployment, `registrar = msg.sender` is permanently set. Since Solidity's `immutable` keyword is enforced at bytecode generation, no backdoor setter exists.
2. **Property Registration:**
   ```solidity
   function registerProperty(
       string calldata _propertyId,
       string calldata _owner,
       bytes32 _documentHash
   ) external onlyRegistrar;
   ```
   Ensures non-empty identifiers and prevents duplicate registration of existing IDs.
3. **Ownership Transfer with State Integrity:**
   ```solidity
   function transferOwnership(
       string calldata _propertyId,
       string calldata _currentOwner,
       string calldata _newOwner,
       bytes32 _newDocumentHash
   ) external onlyRegistrar;
   ```
   Enforces that `_currentOwner` matches on-chain state to prevent out-of-order or stale transactions, updates property state, increments counters, and appends a `TransferRecord` to the history mapping.
4. **Verification Functionality:**
   ```solidity
   function verifyDocument(
       string calldata _propertyId,
       bytes32 _documentHash
   ) external view returns (bool isMatch, bytes32 storedHash);
   ```
   A read-only gas-free view function that compares the query hash with the registered hash.

#### 6.2 Backend File Hashing (`backend/server.js`)
Files uploaded as `multipart/form-data` are processed directly from RAM:
```javascript
function sha256(buffer) {
  return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
}
```
This produces a 32-byte hex string compatible with Solidity's `bytes32` type.

#### 6.3 Frontend Modules (`frontend/src/`)
- **HomePage (`HomePage.jsx`):** Hero section, feature overview, and dynamic counter cards.
- **Dashboard (`Dashboard.jsx`):** Real-time statistics, recent registrations, transfers, and verifications.
- **RegisterProperty (`RegisterProperty.jsx`):** Drag-and-drop PDF upload, instant hashing, and transaction receipt display.
- **TransferOwnership (`TransferOwnership.jsx`):** Secure registrar transfer portal with owner reconciliation.
- **VerifyDocument (`VerifyDocument.jsx`):** Compares uploaded PDF with on-chain hash, displaying green "VERIFIED", red "HASH MISMATCH", or amber "PROPERTY NOT FOUND".
- **OwnershipHistory (`OwnershipHistory.jsx`):** Visual interactive provenance timeline and tabular audit view.
- **Transactions (`Transactions.jsx`):** Ledger viewer showing block confirmations, transaction hashes, and status.

---

### 7. Experimental Results & Verification

The system was evaluated against automated unit tests, integration benchmarks, and end-to-end lifecycle verification.

#### 7.1 Automated Contract Tests (19 Passing Tests)
```
  LandRecordVerification
    Property Registration
      √ should register a new property successfully (143ms)
      √ should reject duplicate property registration
      √ should reject registration with empty property ID
      √ should reject registration with empty owner name
      √ should reject registration with empty document hash
    Document Verification
      √ should verify correct document hash
      √ should reject modified document hash
      √ should revert for non-existent property
    Ownership Transfer
      √ should transfer ownership successfully
      √ should reject transfer from unauthorized user
      √ should reject transfer for non-existent property
      √ should reject transfer with mismatched current owner
      √ should reject transfer with empty new owner
    Ownership History
      √ should maintain complete transfer history (44ms)
      √ should revert history lookup for non-existent property
    Property Enumeration
      √ should enumerate registered properties
    Registrar Security
      √ should set the deployer as the registrar
      √ registrar address is immutable (no setter function)
      √ should prevent unauthorized registration

  19 passing (3s)
```

#### 7.2 End-to-End Live Scenario Verification
| Step | Action | Expected Output | Actual Output | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Register P101 with owner Ravi | Confirmed in block with SHA-256 hash | Confirmed in block #2 (tx: 0x05f389...) | **PASS** |
| **2** | Verify original deed PDF | Hash matches on-chain record | Status: `VERIFIED` (Hash: 0x2d6815...) | **PASS** |
| **3** | Verify modified/tampered PDF | Hash mismatch flagged immediately | Status: `HASH MISMATCH` (Tampered hash: 0x1277e1...) | **PASS** |
| **4** | Transfer P101 to Arun | Contract updates owner and stores new hash | Confirmed in block #3 (tx: 0x9617dc...) | **PASS** |
| **5** | Verify updated deed for Arun | Match against new registered hash | Status: `VERIFIED` (Hash: 0x4bdaa1...) | **PASS** |
| **6** | Query ownership history for P101 | Chronological chain displayed with timestamps | Complete 2-stage provenance returned | **PASS** |
| **7** | Unauthorized transfer attempt | Transaction reverted by access control | Reverted: "Only the authorized registrar..." | **PASS** |

---

### 8. Limitations & Future Scope

#### Limitations:
1. **Local Node Dependency:** The current setup utilizes a local Hardhat node (`localhost:8545`) for zero-cost rapid evaluation without requiring testnet faucet tokens.
2. **Single Registrar Authority:** Relies on a single administrative registrar wallet rather than decentralized multi-signature consensus.
3. **Document Persistence:** Digital deed PDFs are hashed and verified in memory, but document file storage is left to existing records authorities.

#### Future Scope:
1. **Public Testnet Deployment:** Migration to Ethereum Sepolia or Polygon Amoy testnets.
2. **InterPlanetary File System (IPFS):** Integration with decentralized file storage (IPFS/Filecoin) via Pinata for permanent, decentralized deed archiving with content addressing (CIDs).
3. **Multi-Signature Governance:** Introduction of a multi-sig smart contract (e.g., Gnosis Safe pattern) requiring approvals from multiple revenue officers.
4. **Zero-Knowledge Proofs (ZK-SNARKs):** Enable title verification without revealing private owner information.

---

### 9. Conclusion
The **Secure Land Record Verification System** demonstrates a practical, robust, and cost-efficient application of blockchain technology to land governance. By anchoring cryptographic document hashes (SHA-256) into a decentralized Solidity smart contract and enforcing strict registrar access control, the system successfully eliminates deed tampering, detects unauthorized transfers, and provides an undisputable, transparent ownership audit trail. The solution satisfies all academic and technical requirements for a CSE Capstone demonstration, backed by 100% passing automated test coverage and an intuitive modern user interface.
