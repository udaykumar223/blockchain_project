import { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';
import {
  ShieldCheckIcon,
  BuildingIcon,
  ArrowRightLeftIcon,
  CheckCircleIcon,
  FileTextIcon,
  LockIcon,
  SparklesIcon,
  LayersIcon,
} from '../components/Icons';
import SampleDocsBar from '../components/SampleDocsBar';

export default function HomePage({ addToast, navigateTo }) {
  const [stats, setStats] = useState({ totalProperties: 0, totalTransfers: 0, recentTransactions: [] });

  useEffect(() => {
    getDashboard()
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Interactive Quick Evaluation Drawer */}
      <SampleDocsBar onSelectSample={() => navigateTo('verify')} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <SparklesIcon size={14} className="text-cyan animate-pulse" />
          <span>EVM Smart Contract Powered • Immutable Audit Trail</span>
        </div>

        <h1 className="hero-title">
          Secure Land Record Verification &amp; <span className="hero-highlight">Ownership Audit Ledger</span>
        </h1>

        <p className="hero-desc">
          A decentralized cryptographic audit layer for real estate deeds. Generates tamper-proof SHA-256 document 
          fingerprints committed to Ethereum smart contracts, enabling instant fraud detection and unbroken chain of custody.
        </p>

        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigateTo('register')}>
            <FileTextIcon size={18} />
            <span>Register Property</span>
          </button>
          <button className="btn btn-success btn-lg" onClick={() => navigateTo('verify')}>
            <ShieldCheckIcon size={18} />
            <span>Verify Deed Authenticity</span>
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigateTo('history')}>
            <LayersIcon size={18} />
            <span>Audit Provenance</span>
          </button>
        </div>
      </section>

      {/* Real-Time Blockchain Metrics */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigateTo('dashboard')}>
          <div className="stat-icon-wrap indigo">
            <BuildingIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProperties ?? 0}</span>
            <span className="stat-label">Properties Registered</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigateTo('dashboard')}>
          <div className="stat-icon-wrap emerald">
            <ArrowRightLeftIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalTransfers ?? 0}</span>
            <span className="stat-label">Ownership Transfers</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigateTo('verify')}>
          <div className="stat-icon-wrap cyan">
            <ShieldCheckIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">SHA-256</span>
            <span className="stat-label">Cryptographic Fingerprint</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigateTo('transactions')}>
          <div className="stat-icon-wrap amber">
            <CheckCircleIcon size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.recentTransactions?.length || 0}</span>
            <span className="stat-label">Ledger Events Recorded</span>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <LockIcon size={20} className="text-cyan" />
              <h3 className="card-title">Zero-Payload On-Chain Storage</h3>
            </div>
            <span className="badge badge-info">Privacy Preserving</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Land documents remain completely off-chain. Only the 256-bit cryptographic SHA-256 hash digest is recorded 
            in Solidity bytecode, preventing document leaks while providing mathematical immutability.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <ShieldCheckIcon size={20} className="text-emerald" />
              <h3 className="card-title">Instant Tamper Detection</h3>
            </div>
            <span className="badge badge-success">Single-Byte Precision</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Due to cryptographic avalanche characteristics, modifying even a single character, date, or seal in a PDF alters the resulting hash completely, 
            producing an immediate <code style={{ color: 'var(--rose-400)' }}>HASH MISMATCH</code> alert upon verification.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <BuildingIcon size={20} className="text-indigo" />
              <h3 className="card-title">Enforced Registrar Access Control</h3>
            </div>
            <span className="badge badge-info">onlyRegistrar Modifier</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Only the authorized government registrar wallet holds permission to write new properties or ratify title transfers. 
            Unauthorized transactions are mathematically rejected at the EVM opcode level.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <LayersIcon size={20} className="text-amber" />
              <h3 className="card-title">Unbroken Title Lineage</h3>
            </div>
            <span className="badge badge-amber">Append-Only Array</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Every title transfer appends a permanent record containing the previous owner, new owner, transfer deed hash, block timestamp, and executor address, preventing erasure of historical titles.
          </p>
        </div>
      </div>
    </div>
  );
}
