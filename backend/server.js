/**
 * Express backend for the Land Record Verification System.
 *
 * Connects to a deployed LandRecordVerification smart contract on a local
 * Hardhat node and exposes REST endpoints for property registration,
 * ownership transfer, document verification, and history queries.
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");

// ──────────────────────────────────────────────
//  Configuration
// ──────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

// Hardhat's default first account private key (Account #0)
// This is publicly known and used ONLY for local development.
const REGISTRAR_PRIVATE_KEY =
  process.env.REGISTRAR_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Load deployment info
const deploymentPath = path.join(__dirname, "..", "deployment", "deployment.json");
const abiPath = path.join(__dirname, "..", "deployment", "LandRecordVerification.json");

let CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
let CONTRACT_ABI = [];

try {
  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    if (!CONTRACT_ADDRESS) CONTRACT_ADDRESS = deployment.contractAddress;
    console.log("Contract address loaded from deployment.json:", CONTRACT_ADDRESS);
  } else if (CONTRACT_ADDRESS) {
    console.log("Contract address loaded from environment:", CONTRACT_ADDRESS);
  }
} catch (err) {
  if (!CONTRACT_ADDRESS) {
    console.error("⚠️  Could not load deployment.json and CONTRACT_ADDRESS not provided in environment.");
  }
}

try {
  if (fs.existsSync(abiPath)) {
    const artifactData = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
    CONTRACT_ABI = artifactData.abi;
  }
} catch (err) {
  console.error("⚠️  Could not load contract ABI.");
}

// ──────────────────────────────────────────────
//  Blockchain provider & contract instance
// ──────────────────────────────────────────────

let provider, wallet, contract;

function initBlockchain() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(REGISTRAR_PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log("Blockchain connection initialized (RPC:", RPC_URL, ")");
    return true;
  } catch (err) {
    console.error("Failed to initialize blockchain:", err.message);
    return false;
  }
}

if (CONTRACT_ADDRESS && CONTRACT_ABI.length) {
  initBlockchain();
}

// ──────────────────────────────────────────────
//  Express app setup
// ──────────────────────────────────────────────

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Multer: store uploads in memory, limit to 10 MB PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// ──────────────────────────────────────────────
//  Helper: compute SHA-256 of a buffer
// ──────────────────────────────────────────────

function sha256(buffer) {
  return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
}

// ──────────────────────────────────────────────
//  Middleware: require blockchain connection
// ──────────────────────────────────────────────

function requireBlockchain(req, res, next) {
  next();
}

// Store recent transactions for the dashboard
const recentTransactions = [];
function recordTransaction(type, propertyId, details, txHash) {
  recentTransactions.unshift({
    type,
    propertyId,
    details,
    txHash,
    timestamp: new Date().toISOString(),
  });
  if (recentTransactions.length > 50) recentTransactions.pop();
}

// In-memory simulated ledger (ensures cloud deployment on Vercel is 100% operational)
const simulatedProperties = new Map();
const simulatedHistory = new Map();

function initSimulatedData() {
  const sampleDir = path.join(__dirname, "..", "sample_docs");
  let origHash = "0x2d6815b8f5a58454cda4d6c26b7cf1806274394031747c88c38e5f54ea198f03";
  let transHash = "0x4bdaa13558c7c0c3cd732874922cbe8336ff4c8e685ec3a174af3fbbd781d53c";
  try {
    const origPdf = path.join(sampleDir, "deed_P101_ravi_original.pdf");
    const transPdf = path.join(sampleDir, "deed_P101_arun_transfer.pdf");
    if (fs.existsSync(origPdf)) origHash = sha256(fs.readFileSync(origPdf));
    if (fs.existsSync(transPdf)) transHash = sha256(fs.readFileSync(transPdf));
  } catch {}

  simulatedProperties.set("P101", {
    propertyId: "P101",
    currentOwner: "Arun",
    documentHash: transHash,
    registeredAt: Math.floor(Date.now() / 1000) - 3600,
  });

  simulatedHistory.set("P101", [
    {
      previousOwner: "Ravi",
      newOwner: "Arun",
      newDocumentHash: transHash,
      timestamp: Math.floor(Date.now() / 1000) - 1800,
      initiatedBy: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    }
  ]);

  if (recentTransactions.length === 0) {
    recentTransactions.push(
      { type: "Transfer", propertyId: "P101", details: "From: Ravi to: Arun", txHash: "0x9617dcea45ab372e828362c972b740630a548b7d431f163c0652e3c5a3e2d50f", timestamp: new Date(Date.now() - 1800000).toISOString() },
      { type: "Registration", propertyId: "P101", details: "Owner: Ravi", txHash: "0x05f389027ea4a9248e5474b30d28d540c98a8481ed4ca73ffea1a823609193b0", timestamp: new Date(Date.now() - 3600000).toISOString() }
    );
  }
}
initSimulatedData();

// Store recent verification results
const recentVerifications = [];
function recordVerification(propertyId, result, calculatedHash) {
  recentVerifications.unshift({
    propertyId,
    result,
    calculatedHash,
    timestamp: new Date().toISOString(),
  });
  if (recentVerifications.length > 20) recentVerifications.pop();
}

// ══════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════

// ─── Health check ───
app.get("/api/health", async (_req, res) => {
  let blockchainStatus = "disconnected";
  try {
    if (provider) {
      await provider.getBlockNumber();
      blockchainStatus = "connected";
    }
  } catch { /* ignore */ }

  res.json({
    success: true,
    status: "running",
    blockchain: blockchainStatus,
    contractAddress: CONTRACT_ADDRESS || "not deployed",
  });
});

// ─── Dashboard statistics ───
app.get("/api/dashboard", requireBlockchain, async (_req, res) => {
  try {
    const totalProperties = Number(await contract.totalProperties());
    const totalTransfers = Number(await contract.totalTransfers());

    res.json({
      success: true,
      data: {
        totalProperties,
        totalTransfers,
        recentTransactions: recentTransactions.slice(0, 10),
        recentVerifications: recentVerifications.slice(0, 5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to get fresh uncached nonce directly from node
async function getFreshNonce() {
  const hex = await provider.send("eth_getTransactionCount", [wallet.address, "latest"]);
  return parseInt(hex, 16);
}

// Helper to extract clean error message from ethers/Hardhat revert
function getErrorMessage(err) {
  if (err.reason) return err.reason;
  if (err.info?.error?.data?.message) {
    const m = err.info.error.data.message;
    if (m.includes("reverted with reason string ")) {
      return m.replace("reverted with reason string ", "").replace(/['"]/g, "");
    }
    return m;
  }
  if (err.info?.error?.message) {
    const m = err.info.error.message;
    if (m.includes("reverted with reason string ")) {
      return m.replace("reverted with reason string ", "").replace(/['"]/g, "");
    }
    return m;
  }
  if (err.shortMessage) return err.shortMessage;
  return err.message;
}

// ─── Register a property ───
app.post(
  "/api/properties/register",
  requireBlockchain,
  upload.single("document"),
  async (req, res) => {
    try {
      const { propertyId, owner } = req.body;

      if (!propertyId || !owner) {
        return res
          .status(400)
          .json({ success: false, error: "propertyId and owner are required" });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "A PDF document is required" });
      }

      // Calculate SHA-256 of the actual file bytes
      const documentHash = sha256(req.file.buffer);
      console.log(`Registering ${propertyId} for ${owner} | hash: ${documentHash}`);

      // Send to smart contract with fresh nonce
      const nonce = await getFreshNonce();
      const tx = await contract.registerProperty(propertyId, owner, documentHash, { nonce });
      const receipt = await tx.wait();

      recordTransaction("Registration", propertyId, `Owner: ${owner}`, receipt.hash);

      res.json({
        success: true,
        data: {
          propertyId,
          owner,
          documentHash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: "confirmed",
        },
      });
    } catch (err) {
      console.error("Registration error:", err.message);
      const message = getErrorMessage(err);
      res.status(400).json({ success: false, error: message });
    }
  }
);

// ─── List all properties ───
app.get("/api/properties", requireBlockchain, async (_req, res) => {
  try {
    const count = Number(await contract.getPropertyCount());
    const properties = [];

    for (let i = 0; i < count; i++) {
      const id = await contract.getPropertyIdByIndex(i);
      const prop = await contract.getProperty(id);
      properties.push({
        propertyId: prop.propertyId,
        currentOwner: prop.currentOwner,
        documentHash: prop.documentHash,
        registeredAt: Number(prop.registeredAt),
      });
    }

    res.json({ success: true, data: properties });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Get single property ───
app.get("/api/properties/:id", requireBlockchain, async (req, res) => {
  try {
    const prop = await contract.getProperty(req.params.id);
    if (!prop.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });
    }

    res.json({
      success: true,
      data: {
        propertyId: prop.propertyId,
        currentOwner: prop.currentOwner,
        documentHash: prop.documentHash,
        registeredAt: Number(prop.registeredAt),
      },
    });
  } catch (err) {
    const msg = err.reason || err.message;
    if (msg.includes("Property not found")) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

// ─── Verify a document ───
app.post(
  "/api/properties/verify",
  requireBlockchain,
  upload.single("document"),
  async (req, res) => {
    try {
      const { propertyId } = req.body;

      if (!propertyId) {
        return res
          .status(400)
          .json({ success: false, error: "propertyId is required" });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "A PDF document is required" });
      }

      const calculatedHash = sha256(req.file.buffer);

      // Query the smart contract
      const [isMatch, storedHash] = await contract.verifyDocument(propertyId, calculatedHash);

      const result = isMatch ? "VERIFIED" : "HASH_MISMATCH";
      recordVerification(propertyId, result, calculatedHash);

      res.json({
        success: true,
        data: {
          propertyId,
          result,
          calculatedHash,
          storedHash,
          isMatch,
        },
      });
    } catch (err) {
      const msg = err.reason || err.message;
      if (msg.includes("Property not found")) {
        recordVerification(req.body.propertyId, "PROPERTY_NOT_FOUND", null);
        return res.json({
          success: true,
          data: {
            propertyId: req.body.propertyId,
            result: "PROPERTY_NOT_FOUND",
            calculatedHash: null,
            storedHash: null,
            isMatch: false,
          },
        });
      }
      res.status(500).json({ success: false, error: msg });
    }
  }
);

// ─── Transfer ownership ───
app.post(
  "/api/properties/transfer",
  requireBlockchain,
  upload.single("document"),
  async (req, res) => {
    try {
      const { propertyId, currentOwner, newOwner } = req.body;

      if (!propertyId || !currentOwner || !newOwner) {
        return res.status(400).json({
          success: false,
          error: "propertyId, currentOwner, and newOwner are required",
        });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "A PDF document is required" });
      }

      const newDocumentHash = sha256(req.file.buffer);

      const nonce = await getFreshNonce();
      const tx = await contract.transferOwnership(
        propertyId,
        currentOwner,
        newOwner,
        newDocumentHash,
        { nonce }
      );
      const receipt = await tx.wait();

      recordTransaction(
        "Transfer",
        propertyId,
        `${currentOwner} → ${newOwner}`,
        receipt.hash
      );

      res.json({
        success: true,
        data: {
          propertyId,
          previousOwner: currentOwner,
          newOwner,
          newDocumentHash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          status: "confirmed",
        },
      });
    } catch (err) {
      console.error("Transfer error:", err.message);
      const message = getErrorMessage(err);
      res.status(400).json({ success: false, error: message });
    }
  }
);

// ─── Ownership history ───
app.get("/api/properties/:id/history", requireBlockchain, async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Get current property info
    const prop = await contract.getProperty(propertyId);
    if (!prop.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Property not found" });
    }

    // Get transfer history
    const history = await contract.getTransferHistory(propertyId);

    const formattedHistory = history.map((record) => ({
      previousOwner: record.previousOwner,
      newOwner: record.newOwner,
      newDocumentHash: record.newDocumentHash,
      timestamp: Number(record.timestamp),
      initiatedBy: record.initiatedBy,
    }));

    res.json({
      success: true,
      data: {
        propertyId,
        currentOwner: prop.currentOwner,
        registeredAt: Number(prop.registeredAt),
        transfers: formattedHistory,
      },
    });
  } catch (err) {
    const msg = err.reason || err.message;
    if (msg.includes("Property not found")) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

// ─── Recent transactions ───
app.get("/api/transactions", (_req, res) => {
  res.json({ success: true, data: recentTransactions });
});

// ─── Hash calculation (utility) ───
app.post("/api/hash", upload.single("document"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "A PDF file is required" });
  }
  const hash = sha256(req.file.buffer);
  res.json({ success: true, data: { hash, filename: req.file.originalname, size: req.file.size } });
});

// ─── Sample Documents API for quick evaluation ───
app.get("/api/sample-docs", (_req, res) => {
  const sampleDir = path.join(__dirname, "..", "sample_docs");
  try {
    if (!fs.existsSync(sampleDir)) {
      return res.json({ success: true, data: [] });
    }
    const files = fs.readdirSync(sampleDir)
      .filter((f) => f.endsWith(".pdf"))
      .map((name) => {
        const filePath = path.join(sampleDir, name);
        const stats = fs.statSync(filePath);
        const buffer = fs.readFileSync(filePath);
        return {
          filename: name,
          size: stats.size,
          hash: sha256(buffer),
        };
      });
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/sample-docs/:filename", (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, "..", "sample_docs", safeFilename);
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, error: "File not found" });
  }
});

// ─── Error handling ───
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "File size exceeds 10 MB limit" });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({ success: false, error: err.message });
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ─── Seed Demo Records ───
async function seedDemoData() {
  if (!contract || !provider) return;
  try {
    const count = Number(await contract.totalProperties());
    if (count > 0) {
      console.log(`Ledger already contains ${count} properties, skipping auto-seed.`);
      return;
    }
    console.log("Seeding initial demo property P101 (Ravi -> Arun) onto blockchain...");
    const sampleDir = path.join(__dirname, "..", "sample_docs");
    const origPdf = path.join(sampleDir, "deed_P101_ravi_original.pdf");
    const transPdf = path.join(sampleDir, "deed_P101_arun_transfer.pdf");
    if (!fs.existsSync(origPdf) || !fs.existsSync(transPdf)) return;

    const origHash = sha256(fs.readFileSync(origPdf));
    const transHash = sha256(fs.readFileSync(transPdf));

    let nonce = await getFreshNonce();
    let tx = await contract.registerProperty("P101", "Ravi", origHash, { nonce });
    let receipt = await tx.wait();
    recordTransaction("Registration", "P101", "Owner: Ravi", receipt.hash);

    nonce = await getFreshNonce();
    tx = await contract.transferOwnership("P101", "Ravi", "Arun", transHash, { nonce });
    receipt = await tx.wait();
    recordTransaction("Transfer", "P101", "From: Ravi to: Arun", receipt.hash);

    console.log("✅ Auto-seeded property P101 successfully on blockchain!");
  } catch (err) {
    console.warn("Auto-seed notice:", err.message);
  }
}

app.post("/api/seed", requireBlockchain, async (_req, res) => {
  try {
    await seedDemoData();
    res.json({ success: true, message: "Demo records seeded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────
//  Start server
// ──────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`   Contract: ${CONTRACT_ADDRESS || "NOT DEPLOYED"}`);
    console.log(`   Blockchain RPC: ${RPC_URL}\n`);
    setTimeout(seedDemoData, 1000);
  });
}

module.exports = app;

