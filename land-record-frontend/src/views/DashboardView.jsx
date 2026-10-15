import React from "react";
import {
  Building2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowRight,
  User,
  Key,
  Info,
  CheckCircle,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress, formatHash } from "../utils/format";

export default function DashboardView({ setActiveTab, setSelectedPropertyId }) {
  const {
    account,
    balance,
    isCorrectNetwork,
    registrar,
    isRegistrar,
    properties,
    pendingTransfers,
    activityEvents,
  } = useWeb3();

  // Find properties owned by the connected user
  const userProperties = properties.filter(
    (p) => account && p.currentOwner.toLowerCase() === account.toLowerCase()
  );

  return (
    <div className="view-container">
      {/* Welcome & Role Banner */}
      <div className="glass-panel welcome-card">
        <div className="welcome-content">
          <div className="welcome-badge-row">
            <span className="badge badge-primary">Hardhat Local Node #31337</span>
            {isRegistrar ? (
              <span className="badge badge-success">Active Role: Authorized Registrar</span>
            ) : account ? (
              <span className="badge badge-neutral">Active Role: Standard Citizen / Owner</span>
            ) : (
              <span className="badge badge-warning">Wallet Disconnected (Read-Only Mode)</span>
            )}
          </div>
          <h1 className="welcome-title">Blockchain Land Registry Dashboard</h1>
          <p className="welcome-desc">
            Decentralized real-estate title recordation with SHA-256 document cryptographic validation and tamper-evident audit ledger.
          </p>
        </div>

        <div className="welcome-stats-row">
          <div className="stat-card">
            <div className="stat-icon-wrapper text-primary">
              <Building2 size={24} />
            </div>
            <div className="stat-data">
              <div className="stat-value">{properties.length}</div>
              <div className="stat-label">Registered Titles</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper text-amber">
              <Clock size={24} />
            </div>
            <div className="stat-data">
              <div className="stat-value">{pendingTransfers.length}</div>
              <div className="stat-label">Pending Transfers</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper text-cyan">
              <FileText size={24} />
            </div>
            <div className="stat-data">
              <div className="stat-value">{activityEvents.length}</div>
              <div className="stat-label">On-Chain Audit Records</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper text-emerald">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-data">
              <div className="stat-value font-mono" style={{ fontSize: "0.95rem" }}>
                {registrar ? formatAddress(registrar) : "Loading..."}
              </div>
              <div className="stat-label">Registrar Address</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Testing Reference Accordion / Notice */}
      <div className="glass-panel quick-guide-card">
        <div className="guide-header">
          <Info className="text-cyan" size={20} />
          <h3 className="guide-title">Local Development & Evaluation Guide</h3>
        </div>
        <p className="guide-body">
          The smart contract is deployed on local chain <code>31337</code> at address{" "}
          <code className="code-pill">0x5FbDB2315678afecb367f032d93F642f64180aa3</code>. Hardhat Account #0 is the authorized Registrar. To test different roles, import these accounts into MetaMask:
        </p>
        <div className="guide-accounts-grid">
          <div className="guide-account-item">
            <span className="badge badge-primary">Account #0 (Registrar)</span>
            <div className="font-mono text-muted text-xs">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</div>
            <div className="guide-note">Can register properties and approve/reject transfers.</div>
          </div>
          <div className="guide-account-item">
            <span className="badge badge-neutral">Account #1 (Citizen A)</span>
            <div className="font-mono text-muted text-xs">0x70997970C51812dc3A010C7d01b50e0d17dc79C8</div>
            <div className="guide-note">Use as initial property owner to test transfer requests.</div>
          </div>
          <div className="guide-account-item">
            <span className="badge badge-neutral">Account #2 (Citizen B)</span>
            <div className="font-mono text-muted text-xs">0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC</div>
            <div className="guide-note">Use as buyer / recipient of property transfer requests.</div>
          </div>
        </div>
      </div>

      {/* Main Grid: My Properties & Pending Actions */}
      <div className="dashboard-grid">
        {/* Left Column: Quick Actions & Pending Transfers */}
        <div className="dashboard-left">
          {/* Quick Actions Panel */}
          <div className="glass-panel panel-padded">
            <h3 className="section-title">Quick Actions</h3>
            <div className="action-buttons-grid">
              <button
                className="action-tile-btn"
                onClick={() => setActiveTab("register")}
              >
                <div className="action-icon text-primary">
                  <Building2 size={20} />
                </div>
                <div className="action-text">
                  <div className="action-title">Register Property</div>
                  <div className="action-sub">Registrar title creation with SHA-256 deed</div>
                </div>
                <ArrowRight size={16} className="action-arrow" />
              </button>

              <button
                className="action-tile-btn"
                onClick={() => setActiveTab("verify")}
              >
                <div className="action-icon text-emerald">
                  <ShieldCheck size={20} />
                </div>
                <div className="action-text">
                  <div className="action-title">Verify Deed Integrity</div>
                  <div className="action-sub">Compute document SHA-256 vs on-chain hash</div>
                </div>
                <ArrowRight size={16} className="action-arrow" />
              </button>

              <button
                className="action-tile-btn"
                onClick={() => setActiveTab("transfer")}
              >
                <div className="action-icon text-cyan">
                  <User size={20} />
                </div>
                <div className="action-text">
                  <div className="action-title">Request Transfer</div>
                  <div className="action-sub">Owner transfer request with new deed</div>
                </div>
                <ArrowRight size={16} className="action-arrow" />
              </button>

              <button
                className="action-tile-btn"
                onClick={() => setActiveTab("registrar")}
              >
                <div className="action-icon text-amber">
                  <Clock size={20} />
                </div>
                <div className="action-text">
                  <div className="action-title">Registrar Portal</div>
                  <div className="action-sub">
                    {pendingTransfers.length} pending transfer review(s)
                  </div>
                </div>
                <ArrowRight size={16} className="action-arrow" />
              </button>
            </div>
          </div>

          {/* User's Properties */}
          {account && (
            <div className="glass-panel panel-padded" style={{ marginTop: "20px" }}>
              <div className="panel-header-row">
                <h3 className="section-title">Properties You Own ({userProperties.length})</h3>
                <span className="badge badge-neutral">{formatAddress(account)}</span>
              </div>
              {userProperties.length === 0 ? (
                <div className="empty-state-box">
                  <p className="text-muted">You do not currently own any registered properties.</p>
                </div>
              ) : (
                <div className="property-cards-list">
                  {userProperties.map((prop) => (
                    <div key={prop.id} className="prop-summary-card">
                      <div className="prop-summary-header">
                        <span className="prop-id-badge">Property #{prop.id}</span>
                        {prop.pendingTransfer.exists ? (
                          <span className="badge badge-warning">Transfer Pending</span>
                        ) : (
                          <span className="badge badge-success">Secure / Active</span>
                        )}
                      </div>
                      <div className="prop-hash-row font-mono text-xs text-muted">
                        Deed Hash: {formatHash(prop.documentHash)}
                      </div>
                      <div className="prop-card-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedPropertyId(prop.id);
                            setActiveTab("search");
                          }}
                        >
                          Details & History
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedPropertyId(prop.id);
                            setActiveTab("transfer");
                          }}
                        >
                          Transfer Title
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Pending Transfers & Live Activity Feed */}
        <div className="dashboard-right">
          {/* Pending Transfers Card */}
          <div className="glass-panel panel-padded">
            <div className="panel-header-row">
              <h3 className="section-title">Pending Transfer Requests ({pendingTransfers.length})</h3>
              {isRegistrar && pendingTransfers.length > 0 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab("registrar")}
                >
                  Review All
                </button>
              )}
            </div>

            {pendingTransfers.length === 0 ? (
              <div className="empty-state-box">
                <CheckCircle size={32} className="text-emerald" style={{ margin: "0 auto 8px" }} />
                <p className="text-muted">No pending transfers awaiting registrar review.</p>
              </div>
            ) : (
              <div className="pending-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Property ID</th>
                      <th>Current Owner</th>
                      <th>Proposed Buyer</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTransfers.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono">#{p.id}</td>
                        <td className="font-mono text-muted">{formatAddress(p.currentOwner)}</td>
                        <td className="font-mono text-cyan">{formatAddress(p.pendingTransfer.newOwner)}</td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedPropertyId(p.id);
                              setActiveTab("registrar");
                            }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Blockchain Event Feed */}
          <div className="glass-panel panel-padded" style={{ marginTop: "20px" }}>
            <div className="panel-header-row">
              <h3 className="section-title">Live Blockchain Activity Ledger</h3>
              <span className="badge badge-neutral">Immutable Events</span>
            </div>

            {activityEvents.length === 0 ? (
              <div className="empty-state-box">
                <p className="text-muted">No transactions recorded yet on this deployment.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {activityEvents.slice(0, 8).map((ev, idx) => (
                  <div key={`${ev.transactionHash}-${idx}`} className="activity-item">
                    <div className="activity-indicator">
                      {ev.type === "PropertyRegistered" && <span className="event-dot dot-primary" />}
                      {ev.type === "TransferRequested" && <span className="event-dot dot-amber" />}
                      {ev.type === "TransferApproved" && <span className="event-dot dot-emerald" />}
                      {ev.type === "TransferCancelled" && <span className="event-dot dot-rose" />}
                      {ev.type === "RegistrarChanged" && <span className="event-dot dot-cyan" />}
                    </div>
                    <div className="activity-details">
                      <div className="activity-header-line">
                        <span className="activity-event-name">{ev.title}</span>
                        <span className="font-mono text-xs text-muted">Block #{ev.blockNumber}</span>
                      </div>
                      <div className="activity-sub-text">
                        {ev.propertyId && <span>Property #{ev.propertyId} • </span>}
                        {ev.owner && <span>Owner: {formatAddress(ev.owner)}</span>}
                        {ev.currentOwner && <span>From: {formatAddress(ev.currentOwner)} → To: {formatAddress(ev.newOwner)}</span>}
                        {ev.previousOwner && <span>Transferred: {formatAddress(ev.previousOwner)} → {formatAddress(ev.newOwner)}</span>}
                        {ev.newRegistrar && <span>New Registrar: {formatAddress(ev.newRegistrar)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
