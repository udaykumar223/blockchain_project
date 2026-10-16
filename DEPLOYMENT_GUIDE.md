# 🚀 Complete Cloud & Testnet Deployment Guide
## Secure Land Record Verification System (TerraLedger)

This guide walks you step-by-step through deploying the complete system to the cloud:
1. **Decentralized Tier:** Solidity Smart Contract deployed to **Ethereum Sepolia Testnet** (viewable on [Sepolia Etherscan](https://sepolia.etherscan.io)).
2. **Application Tier:** Express API backend hosted on **Render** (free 24/7 cloud container).
3. **Presentation Tier:** React/Vite web application deployed on **Vercel** (global edge CDN).

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│             Vercel (Global Edge Hosting)               │
│         https://your-landchain.vercel.app              │
│       React.js + Vite Single Page Application          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS API Requests
┌───────────────────────────▼────────────────────────────┐
│              Render (Cloud Web Service)                │
│         https://your-api.onrender.com                  │
│       Node.js + Express API (SHA-256 Hasher)           │
└───────────────────────────┬────────────────────────────┘
                            │ JSON-RPC (Port 443)
┌───────────────────────────▼────────────────────────────┐
│           Ethereum Sepolia Testnet (EVM)               │
│       Contract Address: 0x...                          │
│       Etherscan: https://sepolia.etherscan.io/...      │
└────────────────────────────────────────────────────────┘
```

---

## Phase 1: Deploy Smart Contract to Sepolia Testnet

### 1.1 Prerequisites
1. **MetaMask Wallet:** Install the MetaMask browser extension.
2. **Sepolia Testnet ETH (Free):** Get free testnet ETH to pay gas fees:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) (instant)
   - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)
3. **Export Testnet Private Key:**
   - In MetaMask, switch to network **Sepolia**.
   - Click the 3 dots &rarr; **Account Details** &rarr; **Show Private Key**.
   - Copy this key (it starts with `0x` or 64 hex characters).
   - ⚠️ *Never use a private key that holds real mainnet cryptocurrency!*

### 1.2 Configure `.env`
In the root directory of this project, create a file named `.env` (or copy from `.env.example`):

```ini
# Ethereum Sepolia RPC URL (you can use public node or Alchemy)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Your MetaMask private key with testnet ETH
SEPOLIA_PRIVATE_KEY=your_exported_private_key_here
```

### 1.3 Run Deployment Command
Run the following command in PowerShell:

```powershell
npx hardhat run scripts/deploy.js --network sepolia
```

You will see output similar to:
```
Deploying LandRecordVerification contract...
Deployer (Registrar): 0x71C...
Account balance: 0.5 ETH

LandRecordVerification deployed to: 0x8a9B4c...
Registrar set to: 0x71C...

Deployment info saved to deployment/deployment.json
✅ Deployment complete!
```

> 📝 **Save your deployed contract address!** You will need it for the backend in Phase 3. You can also view it immediately on [Sepolia Etherscan](https://sepolia.etherscan.io).

---

## Phase 2: Push Repository to GitHub

For Render and Vercel to auto-deploy your project, push it to your GitHub account:

### 2.1 Initialize Clean Git Repo
Run the following commands in PowerShell:

```powershell
# Remove old/corrupted git folder if present
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

# Initialize fresh repository
git init
git add .
git commit -m "feat: complete production land record verification system"
git branch -M main
```

### 2.2 Link and Push to GitHub
1. Go to [github.com/new](https://github.com/new) and create a repository (e.g. `blockchain-land-registry`).
2. Run:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/blockchain-land-registry.git
git push -u origin main
```

---

## Phase 3: Deploy Backend API to Render (Free)

1. Sign up or log into [Render.com](https://render.com).
2. Click **New +** &rarr; **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repo.
4. Configure the service settings:
   - **Name:** `land-records-backend`
   - **Region:** Any (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Environment:** `Node`
   - **Build Command:** `npm --prefix backend install`
   - **Start Command:** `node backend/server.js`
   - **Instance Type:** `Free`
5. Click **Advanced** &rarr; **Add Environment Variables**:
   | Variable Key | Value |
   | :--- | :--- |
   | `PORT` | `5000` |
   | `RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |
   | `CONTRACT_ADDRESS` | `0xYourSepoliaContractAddress` (from Phase 1) |
   | `REGISTRAR_PRIVATE_KEY` | `0xYourPrivateKey` (from Phase 1) |
6. Click **Create Web Service**.
7. Render will build and deploy the backend. Once active, note your live backend URL:
   `https://land-records-backend.onrender.com`
   *(You can verify it by opening `https://land-records-backend.onrender.com/api/health`)*.

---

## Phase 4: Deploy Frontend to Vercel (Free)

1. Sign up or log into [Vercel.com](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository (`blockchain-land-registry`).
4. In the configuration screen:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Open the **Environment Variables** section and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://land-records-backend.onrender.com/api` *(Your Render URL from Phase 3 + `/api`)*
6. Click **Deploy**.
7. Within 60 seconds, Vercel will provide your production live URL:
   `https://your-land-records.vercel.app`

---

## Phase 5: Verification & Testing

1. Open your live Vercel URL in any browser or on your phone!
2. In the navbar, verify that the network status shows **EVM Node Connected** and displays your Sepolia contract address.
3. Use the **Verify Deed** tool to upload sample deeds:
   - `deed_P101_ravi_original.pdf` &rarr; Returns **VERIFIED**.
   - `deed_P101_tampered.pdf` &rarr; Returns **TAMPER DETECTED**.
4. Check [Sepolia Etherscan](https://sepolia.etherscan.io) to see live transaction hashes, gas used, and event logs on Ethereum!
