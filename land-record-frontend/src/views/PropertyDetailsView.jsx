import React, { useState, useEffect } from "react";
import {
  Search,
  Building2,
  User,
  Hash,
  ShieldCheck,
  Send,
  History,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress, formatHash, formatTimestamp, decodeAction, copyToClipboard } from "../utils/format";

export default function PropertyDetailsView({
  selectedPropertyId,
  setSelectedPropertyId,
  setActiveTab,
}) {
  const {
    account,
    properties,
    getReadOnlyContract,
  } = useWeb3();

  const [searchId, setSearchId] = useState(selectedPropertyId || "");
  const [propertyData, setPropertyData] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  // Load property details and history
  const loadProperty = async (idToLoad) => {
    if (!idToLoad || isNaN(idToLoad) || Number(idToLoad) <= 0) {
      setPropertyData(null);
      setHistoryRecords([]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const contract = getReadOnlyContract();
      const idBigInt = BigInt(idToLoad);

      const prop = await contract.properties(idBigInt);
      if (!prop.exists) {
        setError(`Property #${idToLoad} does not exist on the blockchain ledger.`);
        setPropertyData(null);
        setHistoryRecords([]);
        return;
      }

      const pending = await contract.pendingTransfers(idBigInt);
      const history = await contract.getHistory(idBigInt);

      setPropertyData({
        id: idToLoad,
        currentOwner: prop.currentOwner,
        documentHash: prop.documentHash,
        exists: prop.exists,
        pendingTransfer: {
          exists: pending.exists,
          newOwner: pending.newOwner,
          newDocumentHash: pending.newDocumentHash,
        },
      });

      // Parse history
      const formattedHistory = history.map((record) => ({
        previousOwner: record.previousOwner,
        newOwner: record.newOwner,
        documentHash: record.documentHash,
        timestamp: record.timestamp,
        action: decodeAction(record.action),
      }));

      setHistoryRecords(formattedHistory);
    } catch (err) {
      console.error("Error loading property:", err);
      setError("Failed to fetch property details: " + (err.reason || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      setSearchId(selectedPropertyId);
      loadProperty(selectedPropertyId);
    } else if (properties.length > 0) {
      const defaultId = properties[0].id;
      setSearchId(defaultId);
      loadProperty(defaultId);
    }
  }, [selectedPropertyId, properties.length]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedPropertyId(searchId);
    loadProperty(searchId);
  };

  const handleCopy = async (field, text) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isOwner = Boolean(
    account &&
    propertyData &&
    propertyData.currentOwner.toLowerCase() === account.toLowerCase()
  );

  return (
    <div className="view-container">
      {/* Search Header */}
      <div className="glass-panel search-bar-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input font-mono"
              placeholder="Search by Property ID (e.g. 101, 201)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!searchId || isLoading}>
            {isLoading ? "Querying..." : "Search Ledger"}
          </button>
        </form>

        {/* Quick select pills */}
        {properties.length > 0 && (
          <div className="quick-select-row">
            <span className="text-muted text-xs">Registered Properties:</span>
            {properties.slice(0, 8).map((p) => (
              <button
                key={p.id}
                className={`quick-id-pill ${searchId === p.id ? "active" : ""}`}
                onClick={() => {
                  setSearchId(p.id);
                  setSelectedPropertyId(p.id);
                  loadProperty(p.id);
                }}
              >
                #{p.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {propertyData && (
        <div className="property-sheet-grid">
          {/* Main Details Card */}
          <div className="glass-panel property-card">
            <div className="property-card-header">
              <div className="property-title-group">
                <span className="badge badge-primary">On-Chain Land Record</span>
                <h2 className="property-heading">Property #{propertyData.id}</h2>
              </div>
              <div>
                {propertyData.pendingTransfer.exists ? (
                  <span className="badge badge-warning">
                    <Clock size={12} />
                    Transfer Pending Approval
                  </span>
                ) : (
                  <span className="badge badge-success">
                    <CheckCircle size={12} />
                    Active & Verified
                  </span>
                )}
              </div>
            </div>

            {/* Current Owner Box */}
            <div className="detail-item-box">
              <div className="detail-label">
                <User size={16} className="text-muted" />
                <span>Current Legal Owner</span>
                {isOwner && <span className="badge badge-success" style={{ marginLeft: "6px" }}>You (Current Owner)</span>}
              </div>
              <div className="detail-value-row">
                <span className="font-mono detail-text">{propertyData.currentOwner}</span>
                <button
                  className="btn btn-secondary btn-sm copy-btn"
                  onClick={() => handleCopy("owner", propertyData.currentOwner)}
                >
                  <Copy size={12} />
                  {copiedField === "owner" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Registered Document Hash Box */}
            <div className="detail-item-box">
              <div className="detail-label">
                <Hash size={16} className="text-muted" />
                <span>Registered Title Deed SHA-256 Digest</span>
              </div>
              <div className="detail-value-row">
                <span className="font-mono detail-text hash-color">{propertyData.documentHash}</span>
                <button
                  className="btn btn-secondary btn-sm copy-btn"
                  onClick={() => handleCopy("hash", propertyData.documentHash)}
                >
                  <Copy size={12} />
                  {copiedField === "hash" ? "Copied" : "Copy"}
                </button>
              </div>
              <span className="form-hint">
                Cryptographic fingerprint committed to the smart contract at time of registration / transfer.
              </span>
            </div>

            {/* Pending Transfer Notice if any */}
            {propertyData.pendingTransfer.exists && (
              <div className="pending-transfer-card">
                <div className="pending-header">
                  <Clock className="text-amber" size={18} />
                  <strong>Ownership Transfer Pending Registrar Decision</strong>
                </div>
                <div className="pending-detail-row font-mono text-xs">
                  <span>Proposed New Owner:</span>
                  <span className="text-cyan">{propertyData.pendingTransfer.newOwner}</span>
                </div>
                <div className="pending-detail-row font-mono text-xs">
                  <span>New Deed Hash:</span>
                  <span className="text-muted">{formatHash(propertyData.pendingTransfer.newDocumentHash)}</span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="property-actions-bar">
              <button
                className="btn btn-success"
                onClick={() => {
                  setSelectedPropertyId(propertyData.id);
                  setActiveTab("verify");
                }}
              >
                <ShieldCheck size={16} />
                Verify Document Hash
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedPropertyId(propertyData.id);
                  setActiveTab("transfer");
                }}
              >
                <Send size={16} />
                Request Ownership Transfer
              </button>
            </div>
          </div>

          {/* Audit History Timeline Card */}
          <div className="glass-panel property-card">
            <div className="property-card-header">
              <div className="property-title-group">
                <span className="badge badge-neutral">Immutable Audit Trail</span>
                <h3 className="section-title">Property #{propertyData.id} History ({historyRecords.length})</h3>
              </div>
            </div>

            {historyRecords.length === 0 ? (
              <p className="text-muted text-sm">No history records found for this property.</p>
            ) : (
              <div className="timeline-container">
                {historyRecords.map((rec, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-line" />
                    <div className="timeline-dot">
                      {rec.action === "REGISTERED" ? (
                        <div className="pulse-dot dot-primary" />
                      ) : (
                        <div className="pulse-dot dot-emerald" />
                      )}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className={`badge ${rec.action === "REGISTERED" ? "badge-primary" : "badge-success"}`}>
                          {rec.action}
                        </span>
                        <span className="timeline-time font-mono text-xs text-muted">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      <div className="timeline-parties font-mono text-xs">
                        {rec.previousOwner !== ethers.ZeroAddress ? (
                          <div>
                            <span className="text-muted">Previous Owner: </span>
                            <span>{formatAddress(rec.previousOwner)}</span>
                          </div>
                        ) : (
                          <div className="text-muted">Initial Land Cadastre Entry</div>
                        )}
                        <div>
                          <span className="text-muted">New Owner: </span>
                          <span className="text-cyan">{formatAddress(rec.newOwner)}</span>
                        </div>
                      </div>

                      <div className="timeline-hash font-mono text-xs">
                        <span className="text-muted">Doc Hash: </span>
                        <span>{formatHash(rec.documentHash)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
