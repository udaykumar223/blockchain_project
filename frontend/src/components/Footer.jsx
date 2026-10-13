import { ShieldCheckIcon, LockIcon } from './Icons';

export default function Footer({ navigateTo }) {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-brand">
            <ShieldCheckIcon size={18} className="text-cyan" />
            <span>TerraLedger System</span>
          </div>
          <p className="footer-tagline">
            Cryptographic document fingerprinting & immutable title transfer audit trail powered by EVM smart contracts.
          </p>
        </div>

        <div className="footer-center">
          <div className="security-notice">
            <LockIcon size={14} className="text-emerald" />
            <span>SHA-256 Hashes Stored On-Chain (Zero Document Payload on Ledger)</span>
          </div>
          <p className="academic-badge">Academic Capstone Evaluation Project • Role-Enforced Registrar Protocol</p>
        </div>

        <div className="footer-right">
          <button type="button" className="footer-link" onClick={() => navigateTo('home')}>Overview</button>
          <button type="button" className="footer-link" onClick={() => navigateTo('verify')}>Verify Deed</button>
          <button type="button" className="footer-link" onClick={() => navigateTo('history')}>Audit Provenance</button>
          <button type="button" className="footer-link" onClick={() => navigateTo('transactions')}>Ledger Blocks</button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Secure Land Record Verification System. All rights reserved.</span>
        <span>Local EVM Network (Chain ID: 31337) • Hardhat v2.22</span>
      </div>
    </footer>
  );
}
