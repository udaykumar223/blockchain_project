import React, { useState } from "react";
import {
  FilePlus,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { computeFileSHA256, computeTextSHA256, isValidBytes32 } from "../utils/crypto";
import { formatAddress, formatHash } from "../utils/format";

export default function RegisterPropertyView({ setActiveTab, setSelectedPropertyId }) {
  const {
    account,
    registrar,
    isRegistrar,
    getReadOnlyContract,
    getWriteContract,
    refreshData,
    setTxState,
    parseContractError,
  } = useWeb3();

  const [propertyId, setPropertyId] = useState("");
  const [initialOwner, setInitialOwner] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [deedText, setDeedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [inputMode, setInputMode] = useState("file"); // 'file' | 'text' | 'manual'
  const [isHashing, setIsHashing] = useState(false);
  const [idAvailability, setIdAvailability] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [validationError, setValidationError] = useState("");

  // Check if Property ID already exists on-chain
  const checkIdAvailability = async (id) => {
    if (!id || isNaN(id) || Number(id) <= 0) {
      setIdAvailability(null);
      return;
    }
    setIdAvailability("checking");
    try {
      const contract = getReadOnlyContract();
      const prop = await contract.properties(BigInt(id));
      if (prop.exists) {
        setIdAvailability("taken");
      } else {
        setIdAvailability("available");
      }
    } catch {
      setIdAvailability(null);
    }
  };

  const handleIdChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setPropertyId(val);
    checkIdAvailability(val);
  };

  // Handle file drop / upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsHashing(true);
    setValidationError("");

    try {
      const hash = await computeFileSHA256(file);
      setDocumentHash(hash);
    } catch (err) {
      setValidationError(err.message);
      setDocumentHash("");
    } finally {
      setIsHashing(false);
    }
  };

  // Handle text deed hashing
  const handleTextHash = async (text) => {
    setDeedText(text);
    if (!text.trim()) {
      setDocumentHash("");
      return;
    }
    setIsHashing(true);
    try {
      const hash = await computeTextSHA256(text);
      setDocumentHash(hash);
      setValidationError("");
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsHashing(false);
    }
  };

  // Fill sample deed text
  const loadSampleDeed = () => {
    const sample = `TITLE DEED & CONVEYANCE CERTIFICATE
Property ID: ${propertyId || "101"}
Plot Location: Sector 7, Greenview Township, Plot #42
Survey Number: SN-${Date.now().toString().slice(-6)}
Authority: Metropolitan Land Cadastre Board
Encumbrances: None recorded
Verification Standard: SHA-256 Cryptographic Digest`;
    setInputMode("text");
    handleTextHash(sample);
  };

  // Submit registration transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!propertyId || Number(propertyId) <= 0) {
      setValidationError("Please enter a valid positive Property ID.");
      return;
    }

    if (!ethers.isAddress(initialOwner)) {
      setValidationError("Invalid Ethereum address for the initial owner.");
      return;
    }

    if (!isValidBytes32(documentHash)) {
      setValidationError("Invalid SHA-256 document hash. Please upload a file or compute a valid 32-byte hash.");
      return;
    }

    if (idAvailability === "taken") {
      setValidationError("This Property ID is already registered on the blockchain.");
      return;
    }

    try {
      setTxState({
        status: "prompt",
        hash: "",
        message: "",
        error: "",
      });

      const writeContract = await getWriteContract();
      const tx = await writeContract.registerProperty(
        BigInt(propertyId),
        initialOwner,
        documentHash
      );

      setTxState({
        status: "pending",
        hash: tx.hash,
        message: "Recording property registration in blockchain block...",
        error: "",
      });

      const receipt = await tx.wait();

      setTxState({
        status: "success",
        hash: tx.hash,
        message: `Property #${propertyId} registered successfully in block ${receipt.blockNumber}!`,
        error: "",
      });

      await refreshData();
      setSelectedPropertyId(propertyId);
    } catch (err) {
      console.error("Registration error:", err);
      const friendlyMsg = parseContractError(err);
      setTxState({
        status: "error",
        hash: "",
        message: "",
        error: friendlyMsg,
      });
    }
  };

  return (
    <div className="view-container">
      <div className="glass-panel form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header-icon text-primary">
            <FilePlus size={26} />
          </div>
          <div>
            <h2 className="form-title">Register Land Record</h2>
            <p className="form-desc">
              Record a new simulated property on the blockchain ledger with an immutable SHA-256 document hash.
            </p>
          </div>
        </div>

        {/* Access Warning if not Registrar */}
        {!isRegistrar && (
          <div className="alert-banner alert-warning">
            <AlertTriangle size={20} className="alert-icon" />
            <div className="alert-content">
              <strong>Registrar Access Required</strong>
              <p>
                The connected wallet ({account ? formatAddress(account) : "None"}) is not the authorized Registrar (
                <code>{registrar ? formatAddress(registrar) : "..."}</code>). Only the authorized Registrar can register new properties. Submissions from unauthorized accounts will revert.
              </p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="alert-banner alert-danger">
            <AlertTriangle size={18} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="standard-form">
          {/* Property ID */}
          <div className="form-group">
            <label className="form-label" htmlFor="propId">
              <span>Property ID (Unique Numeric Identifier)</span>
              {idAvailability === "checking" && <span className="text-muted text-xs">Checking availability...</span>}
              {idAvailability === "available" && <span className="text-emerald text-xs font-mono">✓ ID Available</span>}
              {idAvailability === "taken" && <span className="text-rose text-xs font-mono">✕ Already Registered</span>}
            </label>
            <input
              id="propId"
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 101, 204, 550"
              value={propertyId}
              onChange={handleIdChange}
              required
            />
            <span className="form-hint">Must be a unique positive integer greater than zero.</span>
          </div>

          {/* Initial Owner */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="ownerAddr">Initial Owner Ethereum Address</label>
              <div className="quick-fill-group">
                {account && (
                  <button
                    type="button"
                    className="quick-fill-btn"
                    onClick={() => setInitialOwner(account)}
                  >
                    My Address
                  </button>
                )}
                <button
                  type="button"
                  className="quick-fill-btn"
                  onClick={() => setInitialOwner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
                >
                  Citizen #1 (Hardhat)
                </button>
              </div>
            </div>
            <input
              id="ownerAddr"
              type="text"
              className="form-input font-mono"
              placeholder="0x..."
              value={initialOwner}
              onChange={(e) => setInitialOwner(e.target.value.trim())}
              required
            />
            <span className="form-hint">The Ethereum public address of the legal grantee/owner.</span>
          </div>

          {/* Document Input Mode Selector */}
          <div className="form-group">
            <label className="form-label">Title Deed Document & SHA-256 Hashing</label>
            <div className="tab-pills-row">
              <button
                type="button"
                className={`tab-pill-btn ${inputMode === "file" ? "active" : ""}`}
                onClick={() => setInputMode("file")}
              >
                Upload Document File
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${inputMode === "text" ? "active" : ""}`}
                onClick={() => setInputMode("text")}
              >
                Title Deed Text Input
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${inputMode === "manual" ? "active" : ""}`}
                onClick={() => setInputMode("manual")}
              >
                Manual Hex Hash
              </button>
            </div>

            {/* File Mode */}
            {inputMode === "file" && (
              <div className="dropzone-wrapper">
                <label className="file-dropzone" htmlFor="fileInput">
                  <Upload size={32} className="text-primary" />
                  <div>
                    <div style={{ fontWeight: 600 }}>Click to select or drag deed document</div>
                    <div className="text-muted text-xs">PDF, scanned image, or text file (Web Crypto SHA-256)</div>
                  </div>
                  {uploadedFileName && (
                    <div className="badge badge-success">
                      <FileCheck size={14} />
                      {uploadedFileName}
                    </div>
                  )}
                  <input
                    id="fileInput"
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}

            {/* Text Deed Mode */}
            {inputMode === "text" && (
              <div className="text-deed-wrapper">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={loadSampleDeed}
                  >
                    <Sparkles size={12} />
                    Insert Sample Title Deed
                  </button>
                </div>
                <textarea
                  className="form-textarea font-mono text-xs"
                  rows={5}
                  placeholder="Paste or type title deed legal terms, surveyor notes, parcel coordinates..."
                  value={deedText}
                  onChange={(e) => handleTextHash(e.target.value)}
                />
              </div>
            )}

            {/* Manual Mode */}
            {inputMode === "manual" && (
              <input
                type="text"
                className="form-input font-mono"
                placeholder="0x..."
                value={documentHash}
                onChange={(e) => setDocumentHash(e.target.value.trim().toLowerCase())}
              />
            )}
          </div>

          {/* Computed Hash Display */}
          <div className="form-group hash-preview-card">
            <div className="form-label">
              <span>Cryptographic Document Fingerprint (Solidity bytes32)</span>
              {isHashing && <span className="text-cyan text-xs">Calculating SHA-256...</span>}
            </div>
            <div className="hash-display-box font-mono">
              {documentHash || "0x0000000000000000000000000000000000000000000000000000000000000000"}
            </div>
            <span className="form-hint">
              Computed in your browser using the native Web Crypto API. The document file contents are never stored on-chain, only the verifiable 256-bit SHA-256 fingerprint.
            </span>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isRegistrar || isHashing || !propertyId || !initialOwner || !documentHash}
            >
              <ShieldCheck size={18} />
              Register Property on Blockchain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
