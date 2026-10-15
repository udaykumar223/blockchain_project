import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Info,
  Sparkles,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { computeFileSHA256, computeTextSHA256, isValidBytes32 } from "../utils/crypto";
import { formatAddress, formatHash, copyToClipboard } from "../utils/format";

export default function VerifyDocumentView({
  selectedPropertyId,
  setSelectedPropertyId,
  setActiveTab,
}) {
  const { properties, getReadOnlyContract } = useWeb3();

  const [propertyId, setPropertyId] = useState(selectedPropertyId || "");
  const [onChainHash, setOnChainHash] = useState("");
  const [currentOwner, setCurrentOwner] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [textInput, setTextInput] = useState("");
  const [verifyMode, setVerifyMode] = useState("file"); // 'file' | 'text' | 'manual'
  const [isHashing, setIsHashing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // null | 'VERIFIED' | 'MISMATCH'
  const [error, setError] = useState("");
  const [onChainVerifiedBool, setOnChainVerifiedBool] = useState(null);

  // Fetch on-chain hash when property ID changes
  useEffect(() => {
    if (selectedPropertyId) {
      setPropertyId(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    const fetchOnChainRecord = async () => {
      if (!propertyId || isNaN(propertyId) || Number(propertyId) <= 0) {
        setOnChainHash("");
        setCurrentOwner("");
        setVerificationResult(null);
        return;
      }

      try {
        const contract = getReadOnlyContract();
        const prop = await contract.properties(BigInt(propertyId));
        if (prop.exists) {
          setOnChainHash(prop.documentHash);
          setCurrentOwner(prop.currentOwner);
          setError("");
        } else {
          setOnChainHash("");
          setCurrentOwner("");
          setError(`Property #${propertyId} is not registered on the blockchain.`);
          setVerificationResult(null);
        }
      } catch (err) {
        console.warn("Could not query property:", err);
      }
    };

    fetchOnChainRecord();
  }, [propertyId, getReadOnlyContract]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsHashing(true);
    setError("");
    setVerificationResult(null);

    try {
      const hash = await computeFileSHA256(file);
      setComputedHash(hash);
      performComparison(hash, onChainHash);
    } catch (err) {
      setError(err.message);
      setComputedHash("");
    } finally {
      setIsHashing(false);
    }
  };

  // Handle text deed hashing
  const handleTextHash = async (text) => {
    setTextInput(text);
    if (!text.trim()) {
      setComputedHash("");
      setVerificationResult(null);
      return;
    }

    setIsHashing(true);
    setError("");

    try {
      const hash = await computeTextSHA256(text);
      setComputedHash(hash);
      performComparison(hash, onChainHash);
    } catch (err) {
      setError(err.message);
      setComputedHash("");
    } finally {
      setIsHashing(false);
    }
  };

  // Perform comparison and call contract verifyDocument
  const performComparison = async (calculated, onChain) => {
    if (!calculated || !onChain) {
      setVerificationResult(null);
      return;
    }

    const matchesLocally = calculated.toLowerCase() === onChain.toLowerCase();

    // Call contract verifyDocument for on-chain cryptographic check
    try {
      const contract = getReadOnlyContract();
      const onChainResult = await contract.verifyDocument(BigInt(propertyId), calculated);
      setOnChainVerifiedBool(onChainResult);
    } catch (err) {
      console.warn("Contract verifyDocument check returned error:", err);
    }

    if (matchesLocally) {
      setVerificationResult("VERIFIED");
    } else {
      setVerificationResult("MISMATCH");
    }
  };

  // Trigger re-check if onChainHash loaded after computedHash
  useEffect(() => {
    if (computedHash && onChainHash) {
      performComparison(computedHash, onChainHash);
    }
  }, [onChainHash]);

  // Evaluator Simulation Helpers
  const simulateMatchingHash = () => {
    if (!onChainHash) {
      setError("Please select a registered Property ID first.");
      return;
    }
    setVerifyMode("manual");
    setComputedHash(onChainHash);
    performComparison(onChainHash, onChainHash);
  };

  const simulateTamperedHash = () => {
    if (!onChainHash) {
      setError("Please select a registered Property ID first.");
      return;
    }
    setVerifyMode("manual");
    // Modify last 4 chars
    const altered = onChainHash.slice(0, -4) + "dead";
    setComputedHash(altered);
    performComparison(altered, onChainHash);
  };

  return (
    <div className="view-container">
      {/* Academic Disclaimer Box */}
      <div className="glass-panel disclaimer-card">
        <div className="disclaimer-header">
          <Info className="text-cyan" size={20} />
          <strong>Academic Prototype Notice — Cryptographic Verification Scope</strong>
        </div>
        <p className="disclaimer-text">
          This system performs browser-level SHA-256 calculation and on-chain hash comparison. A <code>VERIFIED</code> status mathematically confirms that the submitted document is bit-for-bit identical to the document fingerprint stored at time of registration. It does not replace physical title investigation, governmental cadastre registries, or statutory legal conveyancing.
        </p>
      </div>

      <div className="glass-panel form-card" style={{ marginTop: "20px" }}>
        <div className="form-header">
          <div className="form-header-icon text-emerald">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="form-title">Document Integrity Verification</h2>
            <p className="form-desc">
              Validate a physical or digital land deed against the immutable blockchain registry.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Property Selector */}
        <div className="form-group">
          <label className="form-label" htmlFor="propSelect">
            <span>Target Property ID</span>
            {currentOwner && (
              <span className="text-muted text-xs font-mono">
                Current Owner: {formatAddress(currentOwner)}
              </span>
            )}
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              id="propSelect"
              type="text"
              className="form-input font-mono"
              placeholder="Enter Property ID to verify against..."
              value={propertyId}
              onChange={(e) => {
                const id = e.target.value.replace(/\D/g, "");
                setPropertyId(id);
                setSelectedPropertyId(id);
              }}
            />
          </div>

          {/* Quick Select Buttons */}
          {properties.length > 0 && (
            <div className="quick-select-row" style={{ marginTop: "8px" }}>
              <span className="text-muted text-xs">Quick Select:</span>
              {properties.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`quick-id-pill ${propertyId === p.id ? "active" : ""}`}
                  onClick={() => {
                    setPropertyId(p.id);
                    setSelectedPropertyId(p.id);
                  }}
                >
                  #{p.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* On-Chain Hash Display */}
        {onChainHash && (
          <div className="onchain-hash-reference-card">
            <div className="onchain-ref-header">
              <span className="text-muted text-xs">Registered On-Chain Hash:</span>
              <span className="badge badge-primary">Smart Contract Record</span>
            </div>
            <div className="font-mono onchain-hash-text">{onChainHash}</div>
          </div>
        )}

        {/* Document Upload / Input */}
        <div className="form-group" style={{ marginTop: "20px" }}>
          <label className="form-label">Supply Document for SHA-256 Hashing</label>
          <div className="tab-pills-row">
            <button
              type="button"
              className={`tab-pill-btn ${verifyMode === "file" ? "active" : ""}`}
              onClick={() => setVerifyMode("file")}
            >
              Upload Deed File
            </button>
            <button
              type="button"
              className={`tab-pill-btn ${verifyMode === "text" ? "active" : ""}`}
              onClick={() => setVerifyMode("text")}
            >
              Deed Text Content
            </button>
            <button
              type="button"
              className={`tab-pill-btn ${verifyMode === "manual" ? "active" : ""}`}
              onClick={() => setVerifyMode("manual")}
            >
              Manual Hash Comparison
            </button>
          </div>

          {verifyMode === "file" && (
            <label className="file-dropzone" htmlFor="verifyFileInput">
              <Upload size={32} className="text-emerald" />
              <div>
                <div style={{ fontWeight: 600 }}>Click to select or drop land document</div>
                <div className="text-muted text-xs">Calculates SHA-256 in browser via Web Crypto API</div>
              </div>
              {uploadedFileName && (
                <div className="badge badge-success">
                  <FileCheck size={14} />
                  {uploadedFileName}
                </div>
              )}
              <input
                id="verifyFileInput"
                type="file"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </label>
          )}

          {verifyMode === "text" && (
            <textarea
              className="form-textarea font-mono text-xs"
              rows={4}
              placeholder="Paste deed text or legal contract content to compute SHA-256..."
              value={textInput}
              onChange={(e) => handleTextHash(e.target.value)}
            />
          )}

          {verifyMode === "manual" && (
            <input
              type="text"
              className="form-input font-mono"
              placeholder="0x..."
              value={computedHash}
              onChange={(e) => {
                const h = e.target.value.trim().toLowerCase();
                setComputedHash(h);
                performComparison(h, onChainHash);
              }}
            />
          )}
        </div>

        {/* Evaluator Shortcut Buttons */}
        <div className="demo-shortcuts-card">
          <div className="demo-shortcuts-title">Academic Evaluation Quick Tests:</div>
          <div className="demo-shortcuts-btns">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={simulateMatchingHash}
              disabled={!onChainHash}
            >
              <CheckCircle2 size={13} className="text-emerald" />
              Test Exact Match (Verified)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={simulateTamperedHash}
              disabled={!onChainHash}
            >
              <XCircle size={13} className="text-rose" />
              Test Tampered/Altered Hash (Mismatch)
            </button>
          </div>
        </div>

        {/* Verification Result Banner */}
        {verificationResult && (
          <div
            className={`verification-result-card ${
              verificationResult === "VERIFIED" ? "verified-glow" : "mismatch-glow"
            }`}
          >
            <div className="result-header">
              {verificationResult === "VERIFIED" ? (
                <>
                  <div className="result-icon-circle bg-emerald-glow">
                    <CheckCircle2 size={36} className="text-emerald" />
                  </div>
                  <div>
                    <div className="result-status-title text-emerald">VERIFIED</div>
                    <div className="result-status-sub">
                      Document integrity confirmed. SHA-256 digest matches on-chain title record exactly.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="result-icon-circle bg-rose-glow">
                    <XCircle size={36} className="text-rose" />
                  </div>
                  <div>
                    <div className="result-status-title text-rose">MISMATCH</div>
                    <div className="result-status-sub">
                      Hash discrepancy detected. The supplied document does not match the registered on-chain title digest.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Side-by-Side Comparison */}
            <div className="hash-comparison-grid">
              <div className="comparison-col">
                <div className="comparison-col-label">Registered On-Chain Hash:</div>
                <div className="comparison-hash-val font-mono">{onChainHash}</div>
              </div>
              <div className="comparison-col">
                <div className="comparison-col-label">Supplied Document Computed Hash:</div>
                <div
                  className={`comparison-hash-val font-mono ${
                    verificationResult === "VERIFIED" ? "text-emerald" : "text-rose"
                  }`}
                >
                  {computedHash}
                </div>
              </div>
            </div>

            <div className="result-contract-meta font-mono text-xs">
              Contract verifyDocument() Query:{" "}
              {onChainVerifiedBool ? (
                <span className="text-emerald">true (Validated on chain 31337)</span>
              ) : (
                <span className="text-rose">false (Rejected by contract logic)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
