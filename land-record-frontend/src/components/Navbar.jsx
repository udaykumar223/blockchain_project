import React, { useState, useRef, useEffect } from "react";
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
  LogOut,
  ChevronDown,
  User,
  Copy,
  Check,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/format";

export default function Navbar({ activeTab, setActiveTab }) {
  const {
    account,
    chainId,
    balance,
    isCorrectNetwork,
    isConnecting,
    isRegistrar,
    pendingTransfers,
    loginWithMetaMask,
    logout,
    setIsLoginModalOpen,
    switchNetwork,
    refreshData,
    isLoadingData,
  } = useWeb3();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <div className="network-pill" title={`Connected to Chain ${chainId}`}>
                <div className="pulse-dot" />
                <span className="network-name">
                  {Number(chainId) === 11155111 ? "Sepolia Testnet" : "Hardhat 31337"}
                </span>
              </div>
            ) : (
              <button
                className="btn btn-danger btn-sm network-switch-btn"
                onClick={switchNetwork}
              >
                <AlertTriangle size={14} />
                Switch Network
              </button>
            )
          ) : null}

          {/* Wallet / Role Display & User Authentication */}
          {account ? (
            <div className="wallet-connected-group" ref={profileRef}>
              <div
                className="wallet-address-pill clickable"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                title="Click to view user account details & logout"
              >
                {isRegistrar ? (
                  <span className="badge badge-primary role-badge">👑 Registrar</span>
                ) : (
                  <span className="badge badge-neutral role-badge">👤 Citizen</span>
                )}
                <span className="balance-text">{parseFloat(balance).toFixed(2)} ETH</span>
                <span className="address-text font-mono">{formatAddress(account)}</span>
                <ChevronDown size={14} className={`dropdown-chevron ${isProfileOpen ? "rotated" : ""}`} />
              </div>

              {/* User Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="user-profile-dropdown glass-panel">
                  <div className="dropdown-user-header">
                    <div className="user-avatar-glow">
                      <User size={18} />
                    </div>
                    <div className="dropdown-user-info">
                      <div className="user-role-title">
                        {isRegistrar ? "👑 Authorized Registrar" : "👤 Citizen / Land Owner"}
                      </div>
                      <div className="user-full-address font-mono text-xs">
                        {formatAddress(account)}
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-details-list">
                    <div className="dropdown-detail-item">
                      <span className="text-muted text-xs">Full Address</span>
                      <button className="copy-inline-btn" onClick={handleCopy} title="Copy full address">
                        <span className="font-mono text-xs" style={{ wordBreak: "break-all" }}>
                          {account.substring(0, 10)}...{account.substring(account.length - 8)}
                        </span>
                        {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="dropdown-detail-item">
                      <span className="text-muted text-xs">Balance</span>
                      <span className="font-mono text-xs text-white">{parseFloat(balance).toFixed(4)} ETH</span>
                    </div>

                    <div className="dropdown-detail-item">
                      <span className="text-muted text-xs">Network</span>
                      <span className="text-xs text-cyan">
                        {Number(chainId) === 11155111 ? "Sepolia Testnet" : "Hardhat Local (31337)"}
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-actions">
                    <button
                      className="dropdown-action-btn"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                    >
                      <Key size={14} />
                      <span>Switch Account / Demo Roles</span>
                    </button>
                    <button
                      className="dropdown-action-btn logout-action-btn"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm login-nav-btn"
              onClick={() => setIsLoginModalOpen(true)}
              disabled={isConnecting}
            >
              <Wallet size={15} />
              <span>{isConnecting ? "Connecting..." : "Login with MetaMask"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
