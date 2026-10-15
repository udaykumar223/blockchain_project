import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  CheckCircle,
  Copy,
  Calendar,
  Building2,
  User,
  Hash,
  ExternalLink,
} from "lucide-react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress, formatHash, formatTimestamp, decodeAction, copyToClipboard } from "../utils/format";

export default function HistoryExplorerView({
  selectedPropertyId,
  setSelectedPropertyId,
  setActiveTab,
}) {
  const { properties, getReadOnlyContract } = useWeb3();

  const [filterId, setFilterId] = useState(selectedPropertyId || "ALL");
  const [allHistoryRecords, setAllHistoryRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  // Load audit records from on-chain contract for all registered properties
  useEffect(() => {
    const loadAllHistory = async () => {
      if (properties.length === 0) {
        setAllHistoryRecords([]);
        return;
      }

      setIsLoading(true);
      try {
        const contract = getReadOnlyContract();
        const records = [];

        for (const prop of properties) {
          try {
            const hist = await contract.getHistory(BigInt(prop.id));
            hist.forEach((record, idx) => {
              records.push({
                propertyId: prop.id,
                entryIndex: idx,
                previousOwner: record.previousOwner,
                newOwner: record.newOwner,
                documentHash: record.documentHash,
                timestamp: record.timestamp,
                action: decodeAction(record.action),
              });
            });
          } catch (err) {
            console.warn(`Could not read history for #${prop.id}:`, err);
          }
        }

        // Sort by timestamp descending (newest first)
        records.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setAllHistoryRecords(records);
      } catch (err) {
        console.error("Failed to load audit ledger:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllHistory();
  }, [properties, getReadOnlyContract]);

  const handleCopy = async (hash) => {
    await copyToClipboard(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredRecords = allHistoryRecords.filter((rec) => {
    if (filterId === "ALL" || !filterId) return true;
    return rec.propertyId === filterId;
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="glass-panel welcome-card">
        <div className="welcome-content">
          <div className="welcome-badge-row">
            <span className="badge badge-primary">Immutable Ledger</span>
            <span className="badge badge-success">Solidity getHistory() API</span>
          </div>
          <h2 className="welcome-title">Blockchain Audit Ledger & Chain of Custody</h2>
          <p className="welcome-desc">
            Complete, tamper-evident chronological audit trail of all land title registrations and approved ownership transfers preserved in contract storage.
          </p>
        </div>

        {/* Filter bar */}
        <div className="history-filter-bar">
          <div className="filter-label">
            <Filter size={16} className="text-muted" />
            <span>Filter by Property:</span>
          </div>
          <select
            className="form-select font-mono text-xs"
            style={{ maxWidth: "220px" }}
            value={filterId}
            onChange={(e) => {
              setFilterId(e.target.value);
              if (e.target.value !== "ALL") {
                setSelectedPropertyId(e.target.value);
              }
            }}
          >
            <option value="ALL">All Properties ({allHistoryRecords.length} records)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                Property #{p.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Records Table / List */}
      <div className="glass-panel panel-padded" style={{ marginTop: "20px" }}>
        <div className="panel-header-row">
          <div>
            <h3 className="section-title">
              {filterId === "ALL"
                ? `All Recorded Cadastre Transactions (${filteredRecords.length})`
                : `Audit Records for Property #${filterId} (${filteredRecords.length})`}
            </h3>
            <span className="text-muted text-xs">
              Every state transition creates an unalterable on-chain AuditRecord struct with block timestamp.
            </span>
          </div>
          {isLoading && <span className="text-cyan text-xs">Querying blockchain storage...</span>}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="empty-state-box">
            <History size={36} className="text-muted" style={{ margin: "0 auto 8px" }} />
            <p className="text-muted">
              {isLoading ? "Reading audit history from smart contract..." : "No audit records found."}
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Property</th>
                  <th>Block Timestamp</th>
                  <th>Previous Owner</th>
                  <th>New Owner</th>
                  <th>Document SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, idx) => (
                  <tr key={`${rec.propertyId}-${rec.entryIndex}-${idx}`}>
                    <td>
                      <span
                        className={`badge ${
                          rec.action === "REGISTERED" ? "badge-primary" : "badge-success"
                        }`}
                      >
                        {rec.action}
                      </span>
                    </td>
                    <td>
                      <button
                        className="quick-id-pill"
                        onClick={() => {
                          setSelectedPropertyId(rec.propertyId);
                          setActiveTab("search");
                        }}
                      >
                        #{rec.propertyId}
                      </button>
                    </td>
                    <td className="font-mono text-xs text-muted">
                      {formatTimestamp(rec.timestamp)}
                    </td>
                    <td className="font-mono text-xs">
                      {rec.previousOwner === ethers.ZeroAddress ? (
                        <span className="text-dim">Genesis (0x0)</span>
                      ) : (
                        <span title={rec.previousOwner}>{formatAddress(rec.previousOwner)}</span>
                      )}
                    </td>
                    <td className="font-mono text-xs text-cyan">
                      <span title={rec.newOwner}>{formatAddress(rec.newOwner)}</span>
                    </td>
                    <td>
                      <div className="hash-pill">
                        <span>{formatHash(rec.documentHash)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.documentHash)}
                          title="Copy full 32-byte hash"
                        >
                          <Copy size={11} />
                        </button>
                        {copiedHash === rec.documentHash && (
                          <span className="text-emerald text-xs">✓</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
