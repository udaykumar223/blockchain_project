import React, { useState, useEffect } from "react";
import {
  Send,
  Upload,
  User,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { computeFileSHA256, computeTextSHA256, isValidBytes32 } from "../utils/crypto";
import { formatAddress, formatHash } from "../utils/format";

export default function TransferRequestView({
  selectedPropertyId,
  setSelectedPropertyId,
  setActiveTab,
}) {
  const {
    account,
    properties,
    getReadOnlyContract,
    getWriteContract,
    refreshData,
    setTxState,
    parseContractError,
  } = useWeb3();

  const [propertyId, setPropertyId] = useState(selectedPropertyId || "");
  const [currentOwner, setCurrentOwner] = useState("");
  const [isPendingTransfer, setIsPendingTransfer] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [newDocumentHash, setNewDocumentHash] = useState("");
  const [deedText, setDeedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [inputMode, setInputMode] = useState("file"); // 'file' | 'text' | 'manual'
  const [isHashing, setIsHashing] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Update property state when ID changes
  useEffect(() => {
    if (selectedPropertyId) {
      setPropertyId(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    const fetchProp = async () => {
      if (!propertyId || isNaN(propertyId) || Number(propertyId) <= 0) {
        setCurrentOwner("");
        setIsPendingTransfer(false);
        return;
      }

      try {
        const contract = getReadOnlyContract();
        const prop = await contract.properties(BigInt(propertyId));
        if (prop.exists) {
          setCurrentOwner(prop.currentOwner);
          const pending = await contract.pendingTransfers(BigInt(propertyId));
          setIsPendingTransfer(pending.exists);
          setValidationError("");
        } else {
          setCurrentOwner("");
          setIsPendingTransfer(false);
          setValidationError(`Property #${propertyId} is not registered.`);
        }
      } catch (err) {
        console.warn("Error fetching property:", err);
      }
    };

    fetchProp();
  }, [propertyId, getReadOnlyContract]);

  // Handle file hashing
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsHashing(true);
    setValidationError("");

    try {
      const hash = await computeFileSHA256(file);
      setNewDocumentHash(hash);
    } catch (err) {
      setValidationError(err.message);
      setNewDocumentHash("");
    } finally {
      setIsHashing(false);
    }
  };

  // Handle text deed hashing
  const handleTextHash = async (text) => {
    setDeedText(text);
    if (!text.trim()) {
      setNewDocumentHash("");
      return;
    }
    setIsHashing(true);
    try {
      const hash = await computeTextSHA256(text);
      setNewDocumentHash(hash);
      setValidationError("");
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setIsHashing(false);
    }
  };

  const isCurrentOwner = Boolean(
    account &&
    currentOwner &&
    account.toLowerCase() === currentOwner.toLowerCase()
  );

  // Submit transfer request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!propertyId || Number(propertyId) <= 0) {
      setValidationError("Please specify a valid Property ID.");
      return;
    }

    if (!isCurrentOwner) {
      setValidationError(`Unauthorized: You are connected as ${account ? formatAddress(account) : 'Visitor'}. Only the registered owner (${formatAddress(currentOwner)}) can initiate a transfer request.`);
      return;
    }

    if (!ethers.isAddress(newOwner)) {
      setValidationError("Please enter a valid Ethereum address for the new owner.");
      return;
    }

    if (newOwner.toLowerCase() === currentOwner.toLowerCase()) {
      setValidationError("The new owner cannot be the existing current owner.");
      return;
    }

    if (!isValidBytes32(newDocumentHash)) {
      setValidationError("Please upload the updated conveyance deed or compute a valid 32-byte SHA-256 document hash.");
      return;
    }

    if (isPendingTransfer) {
      setValidationError("A transfer request is already pending for this property. The registrar must approve or reject it first.");
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
      const tx = await writeContract.requestTransfer(
        BigInt(propertyId),
        newOwner,
        newDocumentHash
      );

      setTxState({
        status: "pending",
        hash: tx.hash,
        message: "Submitting transfer request to the blockchain ledger...",
        error: "",
      });

      const receipt = await tx.wait();

      setTxState({
        status: "success",
        hash: tx.hash,
        message: `Transfer request for Property #${propertyId} recorded in block ${receipt.blockNumber}! Now awaiting registrar approval.`,
        error: "",
      });

      await refreshData();
      setSelectedPropertyId(propertyId);
    } catch (err) {
      console.error("Transfer request error:", err);
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
          <div className="form-header-icon text-cyan">
            <Send size={26} />
          </div>
          <div>
            <h2 className="form-title">Request Property Title Transfer</h2>
            <p className="form-desc">
              Initiate a bilateral ownership transfer request. Requires current owner authorization and subsequent registrar approval.
            </p>
          </div>
        </div>

        {/* Ownership Status Banner */}
        {propertyId && currentOwner && (
          <div className={`alert-banner ${isCurrentOwner ? "alert-success" : "alert-warning"}`}>
            {isCurrentOwner ? (
              <>
                <CheckCircle size={20} className="text-emerald" />
                <div className="alert-content">
                  <strong>Ownership Validated</strong>
                  <p>You are connected as the verified legal owner of Property #{propertyId}.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-amber" />
                <div className="alert-content">
                  <strong>Caller Is Not Current Owner</strong>
                  <p>
                    Property #{propertyId} is owned by <code>{formatAddress(currentOwner)}</code>. Your connected wallet is <code>{account ? formatAddress(account) : "Not Connected"}</code>. The smart contract requires <code>msg.sender == currentOwner</code> to request a transfer.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {isPendingTransfer && (
          <div className="alert-banner alert-warning">
            <AlertTriangle size={18} />
            <span>Notice: A transfer request is already pending registrar review for Property #{propertyId}.</span>
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
            <label className="form-label" htmlFor="transferPropId">
              <span>Select Property ID</span>
              {currentOwner && <span className="font-mono text-xs text-muted">Owner: {formatAddress(currentOwner)}</span>}
            </label>
            <input
              id="transferPropId"
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 101, 201..."
              value={propertyId}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPropertyId(val);
                setSelectedPropertyId(val);
              }}
              required
            />
            {properties.length > 0 && (
              <div className="quick-select-row" style={{ marginTop: "6px" }}>
                <span className="text-muted text-xs">Your Properties / Registered:</span>
                {properties.map((p) => (
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

          {/* New Owner Address */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="newOwnerAddr">Proposed New Owner Ethereum Address</label>
              <div className="quick-fill-group">
                <button
                  type="button"
                  className="quick-fill-btn"
                  onClick={() => setNewOwner("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")}
                >
                  Citizen #2 (Hardhat)
                </button>
                <button
                  type="button"
                  className="quick-fill-btn"
                  onClick={() => setNewOwner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")}
                >
                  Citizen #1 (Hardhat)
                </button>
              </div>
            </div>
            <input
              id="newOwnerAddr"
              type="text"
              className="form-input font-mono"
              placeholder="0x..."
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value.trim())}
              required
            />
            <span className="form-hint">Address of the grantee / purchaser who will assume ownership upon approval.</span>
          </div>

          {/* New Transfer Deed Document Input */}
          <div className="form-group">
            <label className="form-label">New Title Conveyance Deed & SHA-256 Digest</label>
            <div className="tab-pills-row">
              <button
                type="button"
                className={`tab-pill-btn ${inputMode === "file" ? "active" : ""}`}
                onClick={() => setInputMode("file")}
              >
                Upload Deed File
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${inputMode === "text" ? "active" : ""}`}
                onClick={() => setInputMode("text")}
              >
                Deed Text Content
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${inputMode === "manual" ? "active" : ""}`}
                onClick={() => setInputMode("manual")}
              >
                Manual Hash
              </button>
            </div>

            {inputMode === "file" && (
              <label className="file-dropzone" htmlFor="transferFile">
                <Upload size={32} className="text-cyan" />
                <div>
                  <div style={{ fontWeight: 600 }}>Click to select or drop transfer contract deed</div>
                  <div className="text-muted text-xs">Computes SHA-256 in browser</div>
                </div>
                {uploadedFileName && (
                  <div className="badge badge-success">
                    <FileCheck size={14} />
                    {uploadedFileName}
                  </div>
                )}
                <input
                  id="transferFile"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </label>
            )}

            {inputMode === "text" && (
              <textarea
                className="form-textarea font-mono text-xs"
                rows={4}
                placeholder="CONVEYANCE AGREEMENT: Transferred from party A to party B..."
                value={deedText}
                onChange={(e) => handleTextHash(e.target.value)}
              />
            )}

            {inputMode === "manual" && (
              <input
                type="text"
                className="form-input font-mono"
                placeholder="0x..."
                value={newDocumentHash}
                onChange={(e) => setNewDocumentHash(e.target.value.trim().toLowerCase())}
              />
            )}
          </div>

          {/* Hash Preview */}
          <div className="form-group hash-preview-card">
            <div className="form-label">
              <span>New Document SHA-256 Digest (Solidity bytes32)</span>
              {isHashing && <span className="text-cyan text-xs">Computing hash...</span>}
            </div>
            <div className="hash-display-box font-mono">
              {newDocumentHash || "0x0000000000000000000000000000000000000000000000000000000000000000"}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isCurrentOwner || isPendingTransfer || !newOwner || !newDocumentHash}
            >
              <Send size={18} />
              Submit Transfer Request to Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
