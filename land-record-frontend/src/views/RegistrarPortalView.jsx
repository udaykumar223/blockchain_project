import React, { useState } from "react";
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Key,
  Copy,
  ArrowRight,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress, formatHash, copyToClipboard } from "../utils/format";

export default function RegistrarPortalView({ setActiveTab, setSelectedPropertyId }) {
  const {
    account,
    registrar,
    isRegistrar,
    pendingTransfers,
    getWriteContract,
    refreshData,
    setTxState,
    parseContractError,
  } = useWeb3();

  const [newRegistrarInput, setNewRegistrarInput] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Approve Transfer
  const handleApprove = async (propertyId) => {
    setActionInProgressId(propertyId);
    try {
      setTxState({
        status: "prompt",
        hash: "",
        message: "",
        error: "",
      });

      const writeContract = await getWriteContract();
      const tx = await writeContract.approveTransfer(BigInt(propertyId));

      setTxState({
        status: "pending",
        hash: tx.hash,
        message: `Registrar approving transfer for Property #${propertyId}...`,
        error: "",
      });

      const receipt = await tx.wait();

      setTxState({
        status: "success",
        hash: tx.hash,
        message: `Transfer for Property #${propertyId} approved successfully in block ${receipt.blockNumber}! Ownership and document hash updated on-chain.`,
        error: "",
      });

      await refreshData();
    } catch (err) {
      console.error("Approval error:", err);
      const friendlyMsg = parseContractError(err);
      setTxState({
        status: "error",
        hash: "",
        message: "",
        error: friendlyMsg,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reject Transfer
  const handleReject = async (propertyId) => {
    setActionInProgressId(propertyId);
    try {
      setTxState({
        status: "prompt",
        hash: "",
        message: "",
        error: "",
      });

      const writeContract = await getWriteContract();
      const tx = await writeContract.rejectTransfer(BigInt(propertyId));

      setTxState({
        status: "pending",
        hash: tx.hash,
        message: `Registrar cancelling transfer for Property #${propertyId}...`,
        error: "",
      });

      const receipt = await tx.wait();

      setTxState({
        status: "success",
        hash: tx.hash,
        message: `Transfer request for Property #${propertyId} rejected / cancelled in block ${receipt.blockNumber}.`,
        error: "",
      });

      await refreshData();
    } catch (err) {
      console.error("Rejection error:", err);
      const friendlyMsg = parseContractError(err);
      setTxState({
        status: "error",
        hash: "",
        message: "",
        error: friendlyMsg,
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Change Registrar Role (Only active registrar can invoke this)
  const handleChangeRegistrar = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(newRegistrarInput)) {
      alert("Please enter a valid 42-character Ethereum address.");
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
      const tx = await writeContract.changeRegistrar(newRegistrarInput);

      setTxState({
        status: "pending",
        hash: tx.hash,
        message: "Transferring Registrar role to new address...",
        error: "",
      });

      const receipt = await tx.wait();

      setTxState({
        status: "success",
        hash: tx.hash,
        message: `Registrar role transferred to ${formatAddress(newRegistrarInput)} in block ${receipt.blockNumber}!`,
        error: "",
      });

      setNewRegistrarInput("");
      await refreshData();
    } catch (err) {
      console.error("Change registrar error:", err);
      const friendlyMsg = parseContractError(err);
      setTxState({
        status: "error",
        hash: "",
        message: "",
        error: friendlyMsg,
      });
    }
  };

  const copyRegistrar = async () => {
    if (registrar) {
      await copyToClipboard(registrar);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="view-container">
      {/* Top Banner: Registrar Role Status */}
      <div className={`glass-panel welcome-card ${isRegistrar ? "border-emerald" : ""}`}>
        <div className="welcome-content">
          <div className="welcome-badge-row">
            {isRegistrar ? (
              <span className="badge badge-success">
                <ShieldCheck size={14} />
                You Are The Authorized Registrar
              </span>
            ) : (
              <span className="badge badge-warning">
                <ShieldAlert size={14} />
                Registrar Access Restricted
              </span>
            )}
          </div>
          <h2 className="welcome-title">Registrar Management Portal</h2>
          <p className="welcome-desc">
            The Registrar is the sole administrative authority empowered to approve property registrations and conveyances.
          </p>
        </div>

        <div className="detail-item-box" style={{ marginTop: "14px", background: "rgba(0,0,0,0.3)" }}>
          <div className="detail-label">
            <span>Current On-Chain Registrar</span>
            {account && isRegistrar && <span className="badge badge-success">Active Account</span>}
          </div>
          <div className="detail-value-row">
            <span className="font-mono detail-text">{registrar || "Loading..."}</span>
            <button className="btn btn-secondary btn-sm" onClick={copyRegistrar}>
              <Copy size={12} />
              {copiedAddress ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Guidance Box if Not Registrar */}
      {!isRegistrar && (
        <div className="glass-panel quick-guide-card" style={{ marginTop: "20px" }}>
          <div className="guide-header">
            <Terminal className="text-amber" size={20} />
            <h3 className="guide-title">How To Operate As Registrar Locally</h3>
          </div>
          <p className="guide-body">
            Because this contract is deployed on your local Hardhat blockchain, you have two safe options to act as the Registrar:
          </p>

          <div className="guide-steps-list">
            <div className="guide-step-item">
              <strong>Option A: Switch MetaMask Account to Hardhat Account #0</strong>
              <p className="text-muted text-xs">
                Import Account #0 private key: <code>0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code> into MetaMask. It is the initial deployer and current registrar (<code>0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</code>).
              </p>
            </div>

            <div className="guide-step-item">
              <strong>Option B: Run the Safe Registrar Transfer Script</strong>
              <p className="text-muted text-xs">
                Run this command in your terminal from <code>land-record-chain/</code> to designate your current MetaMask address ({account ? formatAddress(account) : "0xYourAddress"}):
              </p>
              <div className="terminal-code-block font-mono text-xs">
                npx hardhat run scripts/change_registrar.js --network localhost {account || "0xYourMetaMaskAddress"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Transfers Review Section */}
      <div className="glass-panel panel-padded" style={{ marginTop: "20px" }}>
        <div className="panel-header-row">
          <div>
            <h3 className="section-title">Pending Transfers Requiring Registrar Decision</h3>
            <p className="text-muted text-xs">
              Review new owners and updated title deed SHA-256 digests before granting final cryptographic approval.
            </p>
          </div>
          <span className="badge badge-warning">{pendingTransfers.length} Pending</span>
        </div>

        {pendingTransfers.length === 0 ? (
          <div className="empty-state-box">
            <CheckCircle size={36} className="text-emerald" style={{ margin: "0 auto 10px" }} />
            <h4 style={{ color: "#ffffff", marginBottom: "4px" }}>No Pending Transfer Requests</h4>
            <p className="text-muted text-sm">
              All ownership transfer requests have been processed or none have been submitted yet.
            </p>
          </div>
        ) : (
          <div className="pending-cards-grid">
            {pendingTransfers.map((p) => {
              const isWorking = actionInProgressId === p.id;
              return (
                <div key={p.id} className="pending-decision-card">
                  <div className="pending-card-top">
                    <span className="prop-id-badge">Property #{p.id}</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedPropertyId(p.id);
                        setActiveTab("search");
                      }}
                    >
                      View Full Audit History
                    </button>
                  </div>

                  <div className="pending-card-parties">
                    <div className="party-box">
                      <div className="party-title">Current Registered Owner:</div>
                      <div className="font-mono text-xs party-address">{formatAddress(p.currentOwner)}</div>
                    </div>
                    <div className="party-arrow">
                      <ArrowRight size={18} className="text-muted" />
                    </div>
                    <div className="party-box highlight">
                      <div className="party-title">Proposed New Owner:</div>
                      <div className="font-mono text-xs party-address text-cyan">
                        {formatAddress(p.pendingTransfer.newOwner)}
                      </div>
                    </div>
                  </div>

                  <div className="pending-deed-box">
                    <div className="text-muted text-xs">New Title Deed SHA-256 Digest:</div>
                    <div className="font-mono text-xs text-muted" style={{ wordBreak: "break-all" }}>
                      {p.pendingTransfer.newDocumentHash}
                    </div>
                  </div>

                  <div className="pending-decision-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(p.id)}
                      disabled={!isRegistrar || isWorking}
                    >
                      <CheckCircle size={16} />
                      {isWorking ? "Processing..." : "Approve & Transfer Title"}
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(p.id)}
                      disabled={!isRegistrar || isWorking}
                    >
                      <XCircle size={16} />
                      {isWorking ? "Processing..." : "Reject / Cancel Transfer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Change Registrar Role Form (Only shown if connected user is Registrar) */}
      {isRegistrar && (
        <div className="glass-panel panel-padded" style={{ marginTop: "20px" }}>
          <div className="panel-header-row">
            <div>
              <h3 className="section-title">Transfer Registrar Authority</h3>
              <p className="text-muted text-xs">
                Delegate the administrative Registrar role to another Ethereum address using the contract's <code>changeRegistrar()</code> function.
              </p>
            </div>
            <span className="badge badge-primary">Admin Action</span>
          </div>

          <form onSubmit={handleChangeRegistrar} className="standard-form" style={{ marginTop: "14px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="newRegInput">
                New Registrar Ethereum Address
              </label>
              <input
                id="newRegInput"
                type="text"
                className="form-input font-mono"
                placeholder="0x..."
                value={newRegistrarInput}
                onChange={(e) => setNewRegistrarInput(e.target.value.trim())}
                required
              />
              <span className="form-hint">
                Caution: Once transferred, your current wallet will no longer possess Registrar permissions.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newRegistrarInput || !ethers.isAddress(newRegistrarInput)}
            >
              Transfer Registrar Role
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
