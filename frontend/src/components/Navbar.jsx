import { useState } from 'react';
import {
  ShieldCheckIcon,
  BuildingIcon,
  FileTextIcon,
  ArrowRightLeftIcon,
  CheckCircleIcon,
  HistoryIcon,
  ActivityIcon,
  CopyIcon,
} from './Icons';

export default function Navbar({ currentPage, navigateTo, blockchainStatus, contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3" }) {
  const [copied, setCopied] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Overview', icon: BuildingIcon },
    { id: 'dashboard', label: 'Metrics', icon: ActivityIcon },
    { id: 'register', label: 'Register Title', icon: FileTextIcon },
    { id: 'verify', label: 'Verify Deed', icon: ShieldCheckIcon },
    { id: 'transfer', label: 'Transfer Deed', icon: ArrowRightLeftIcon },
    { id: 'history', label: 'Audit Provenance', icon: HistoryIcon },
    { id: 'transactions', label: 'Ledger Blocks', icon: CheckCircleIcon },
  ];

  const handleCopy = () => {
    if (contractAddress && contractAddress !== "not deployed") {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigateTo('home')}>
          <div className="brand-logo-wrap">
            <ShieldCheckIcon size={24} className="brand-icon-svg" />
          </div>
          <div className="brand-text">
            <span className="brand-name">TerraLedger</span>
            <span className="brand-sub">Land Title Audit Network</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="navbar-links" aria-label="Main Navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
              >
                <Icon size={16} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: Network & Status */}
        <div className="navbar-right">
          {contractAddress && contractAddress !== "not deployed" && (
            <button
              type="button"
              className="contract-badge"
              onClick={handleCopy}
              title="Click to copy Smart Contract Address"
            >
              <span className="contract-label">Contract:</span>
              <code>{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</code>
              <CopyIcon size={13} className="copy-icon" />
              {copied && <span className="copy-tooltip">Copied!</span>}
            </button>
          )}

          <div className="status-indicator">
            <span className={`status-dot ${blockchainStatus === 'connected' ? 'connected' : 'disconnected'}`} />
            <span className="status-text">
              {blockchainStatus === 'connected' ? 'EVM Node Connected' : 'Chain Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
