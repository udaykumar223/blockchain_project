import React from "react";
import {
  Shield,
  Layers,
  FilePlus,
  Search,
  CheckCircle2,
  Send,
  UserCheck,
  History,
  RotateCw,
  Wallet,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/format";

export default function Navbar({ activeTab, setActiveTab }) {
  const {
    account,
    balance,
    isCorrectNetwork,
    isConnecting,
    isRegistrar,
    pendingTransfers,
    connectWallet,
    switchNetwork,
    refreshData,
    isLoadingData,
  } = useWeb3();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "register", label: "Register Property", icon: FilePlus },
    { id: "search", label: "Search & Details", icon: Search },
    { id: "verify", label: "Verify Document", icon: CheckCircle2 },
    { id: "transfer", label: "Request Transfer", icon: Send },
    {
      id: "registrar",
      label: "Registrar Portal",
      icon: UserCheck,
      badge: pendingTransfers.length > 0 ? pendingTransfers.length : null,
    },
    { id: "history", label: "Audit Ledger", icon: History },
  ];

  return (
    <header className="navbar-container">
      {/* Top Banner: Academic Prototype Notice */}
      <div className="academic-strip">
        <div className="academic-strip-content">
          <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}>Academic Prototype</span>
          <span>
            Simulated blockchain land registry for educational demonstration & document cryptographic integrity.
          </span>
        </div>
      </div>

      <div className="navbar-main">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => setActiveTab("dashboard")}>
          <div className="brand-logo-glow">
            <Shield className="brand-icon" size={26} />
          </div>
          <div className="brand-text">
            <div className="brand-title">TerraVault</div>
            <div className="brand-subtitle">Land Record Verification</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-badge-count">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Area: Network, Refresh, Wallet */}
        <div className="navbar-actions">
          {/* Refresh Blockchain State Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={refreshData}
            title="Refresh on-chain state"
            disabled={isLoadingData}
          >
            <RotateCw size={14} className={isLoadingData ? "spin-animation" : ""} />
          </button>

          {/* Network Indicator */}
          {account ? (
            isCorrectNetwork ? (
              <div className="network-pill" title="Connected to Hardhat Local (Chain 31337)">
                <div className="pulse-dot" />
                <span className="network-name">Hardhat 31337</span>
              </div>
            ) : (
              <button
                className="btn btn-danger btn-sm network-switch-btn"
                onClick={switchNetwork}
              >
                <AlertTriangle size={14} />
                Switch to 31337
              </button>
            )
          ) : null}

          {/* Wallet / Role Display */}
          {account ? (
            <div className="wallet-connected-group">
              {isRegistrar ? (
                <span className="badge badge-primary role-badge" title="You are the authorized Registrar">
                  👑 Registrar
                </span>
              ) : (
                <span className="badge badge-neutral role-badge">
                  👤 Citizen
                </span>
              )}
              <div className="wallet-address-pill">
                <span className="balance-text">{parseFloat(balance).toFixed(2)} ETH</span>
                <span className="address-text font-mono">{formatAddress(account)}</span>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <Wallet size={15} />
              <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
