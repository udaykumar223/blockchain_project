# 🚀 TerraVault: Quick Setup Guide for Friends & Teammates

This guide will help you run the **Blockchain Land Record Verification System** on your computer in under **3 minutes**.

---

## 📋 Prerequisites

Before starting, make sure you have:
1. **Node.js** (v18 or higher recommended): [Download Node.js](https://nodejs.org/)
2. **MetaMask Browser Extension**: [Install MetaMask](https://metamask.io/download/)

---

## ⚡ 3-Step Setup

### Step 1: Install Dependencies (Run Once)

Open PowerShell or Terminal in the project folder and run:

```bash
# 1. Install smart contract dependencies
cd land-record-chain
npm install

# 2. Install frontend dashboard dependencies
cd ../land-record-frontend
npm install
```

---

### Step 2: Start the Local Blockchain Node & Deploy Contract

1. Open **Terminal 1**:
   ```bash
   cd land-record-chain
   npx hardhat node
   ```
   *(Keep this terminal open! It will print 20 test accounts with 10,000 ETH each).*

2. Open **Terminal 2** (or split terminal) and deploy the contract:
   ```bash
   cd land-record-chain
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Output:*
   ```text
   Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Registrar address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

---

### Step 3: Start the Web Dashboard

In **Terminal 2**, start the frontend:

```bash
cd ../land-record-frontend
npm run dev
```

Open your browser and navigate to: **`http://localhost:5173`**

---

## 🦊 Connecting MetaMask

1. **Add / Switch Network in MetaMask:**
   - On the web app, click the **`Switch Network`** button in the navbar.
   - MetaMask will automatically prompt to add **Hardhat Local** (Chain ID: `31337`, RPC: `http://127.0.0.1:8545`). Click **Approve**.

2. **Import the Registrar Account (Funded with 10,000 ETH):**
   - In MetaMask, click **Add wallet** &rarr; **Import account**.
   - Paste the Registrar Private Key:
     ```text
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```
   - Click **Import**.
   - Refresh the web page. The navbar badge will now turn into **`👑 Registrar`** with `10000.00 ETH`!

---

## 🧪 Testing Account Credentials

For full bilateral ownership transfer testing, import these pre-configured test keys into MetaMask:

| Role | Account Address | Private Key |
|---|---|---|
| **👑 Government Registrar** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **👤 Citizen #1 (Initial Owner)** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **👤 Citizen #2 (Buyer)** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

---

## 🎯 Features to Test

1. **Register Property:** Go to *Register Property* &rarr; ID `101` &rarr; Enter Owner `0x7099...79C8` &rarr; Click *Insert Sample Title Deed* &rarr; Mint title on blockchain.
2. **Verify Deed Authenticity:** Go to *Verify Document* &rarr; Select `#101` &rarr; Click *Test Exact Match* (Green `VERIFIED`) &rarr; Click *Test Tampered Hash* (Red `MISMATCH`).
3. **Dual-Control Transfer:** Switch MetaMask to Citizen #1 &rarr; Go to *Request Transfer* &rarr; Submit request to Citizen #2 &rarr; Switch to Registrar &rarr; Go to *Registrar Portal* &rarr; Approve transfer.
4. **Audit Ledger:** Go to *Audit Ledger* &rarr; View the permanent, immutable provenance of the property.
