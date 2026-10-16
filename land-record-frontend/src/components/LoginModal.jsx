import React from "react";
import {
  Shield,
  User,
  Key,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export default function LoginModal() {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginWithMetaMask,
    isConnecting,
    loginError,
    setLoginError,
    account,
    isRegistrar,
  } = useWeb3();

  const [copiedAccount, setCopiedAccount] = React.useState(null);

  if (!isLoginModalOpen) return null;

  const hasMetaMask = typeof window !== "undefined" && Boolean(window.ethereum);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleClose = () => {
    setLoginError("");
    setIsLoginModalOpen(false);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-container login-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        {/* Header */}
        <div className="login-modal-header">
          <div className="login-logo-glow">
            <svg
              className="metamask-fox-svg"
              width="44"
              height="44"
              viewBox="0 0 318.6 318.6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m274.1 35.5-99.5 73.9L194 64.9l80.1-29.4z"
                fill="#E2761B"
                stroke="#E2761B"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m44.5 35.5 98.9 74.4-18.7-44.5L44.5 35.5z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m238.3 206.8-28.5 42.6 58.2 16 16.7-57.5-46.4-1.1zM80.3 206.8l46.3-1.2 16.8 57.6 58.2-16-28.4-42.6z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m87 140.6 23.4-32.9-42.3-12.3L44.5 35.5 36.8 178l50.2-37.4zM231.6 140.6l50.2 37.4-7.7-142.5-23.6 60-42.3 12.3 23.4 32.8z"
                fill="#E4761B"
                stroke="#E4761B"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m120.4 178.5-27.7-8.3-25.1 37.6 44.5 1.2 8.3-30.5zm77.8 0 8.3 30.5 44.5-1.2-25.1-37.6-27.7 8.3z"
                fill="#D7C1B3"
                stroke="#D7C1B3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m120.4 178.5-8.3 30.5 9.7 26.3 3.6-22.3 18.2-17.7-23.2-16.8zm77.8 0-23.2 16.8 18.2 17.7 3.6 22.3 9.7-26.3-8.3-30.5z"
                fill="#233447"
                stroke="#233447"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m100.9 235.3 12.6 38.6 30.3-20.9-10.4-28-32.5 10.3zm116.8 0-32.5-10.3-10.4 28 30.3 20.9 12.6-38.6z"
                fill="#CD6116"
                stroke="#CD6116"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m143.8 253 15.5 24.3 15.5-24.3-15.5-12.7L143.8 253z"
                fill="#E4751F"
                stroke="#E4751F"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m198.2 178.5-27.7-8.3-11.2-31.5-11.2 31.5-27.7 8.3 23.2 16.8 15.7 15.4 15.7-15.4 23.2-16.8z"
                fill="#F6851B"
                stroke="#F6851B"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m268 95.4 42.3 12.3-17.5-68.6-80.1 29.4 31.9 26.9zM8.3 107.7l42.3-12.3 23.4-32.9L-6.1 33.1 8.3 107.7z"
                fill="#763D16"
                stroke="#763D16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="login-modal-body">
          <div className="text-center" style={{ marginBottom: "1.5rem" }}>
            <h2 className="login-title">Login with MetaMask</h2>
            <p className="text-muted text-sm" style={{ marginTop: "0.25rem" }}>
              Secure Web3 authentication for Land Registrars & Citizen Property Owners.
            </p>
          </div>

          {/* Error Banner */}
          {loginError && (
            <div className="alert-banner alert-danger" style={{ marginBottom: "1.25rem" }}>
              <AlertTriangle size={18} />
              <div style={{ flex: 1, fontSize: "0.85rem" }}>{loginError}</div>
            </div>
          )}

          {/* Action Button */}
          {hasMetaMask ? (
            <button
              className="btn btn-primary login-btn-main"
              onClick={loginWithMetaMask}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <div className="spinner-sm" />
                  <span>Connecting to MetaMask... Approve in Extension</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Connect & Sign In with MetaMask</span>
                </>
              )}
            </button>
          ) : (
            <div className="no-metamask-warning">
              <AlertTriangle className="text-amber" size={24} />
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-main)" }}>MetaMask Extension Not Detected</div>
                <div className="text-muted text-xs" style={{ marginTop: "0.25rem" }}>
                  Please install the MetaMask browser extension to authenticate and interact with the blockchain.
                </div>
              </div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span>Install</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Roles Description Cards */}
          <div className="login-roles-grid">
            <div className="login-role-card">
              <div className="role-header">
                <span className="badge badge-primary">👑 Authorized Registrar</span>
              </div>
              <p className="role-desc">
                Government administrative role. Can register new properties and approve or reject dual-control title transfer requests.
              </p>
            </div>

            <div className="login-role-card">
              <div className="role-header">
                <span className="badge badge-neutral">👤 Citizen / Land Owner</span>
              </div>
              <p className="role-desc">
                Standard citizen account. View your registered land holdings, initiate transfer requests to buyers, and verify deeds.
              </p>
            </div>
          </div>

          {/* Academic Evaluation Fast-Switch Accounts */}
          <div className="academic-eval-accounts">
            <div className="eval-header">
              <Key size={14} className="text-cyan" />
              <span>Academic Evaluation Demo Accounts</span>
            </div>
            <div className="eval-list">
              <div className="eval-item">
                <div className="eval-label">
                  <strong>Account #0 (Registrar):</strong>
                  <span className="font-mono text-muted text-xs">0xf39F...2266</span>
                </div>
                <button
                  className="copy-chip-btn"
                  onClick={() =>
                    handleCopy(
                      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
                      "acc0"
                    )
                  }
                  title="Copy Private Key to import into MetaMask"
                >
                  {copiedAccount === "acc0" ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                  <span>{copiedAccount === "acc0" ? "Key Copied!" : "Copy Key"}</span>
                </button>
              </div>

              <div className="eval-item">
                <div className="eval-label">
                  <strong>Account #1 (Owner A):</strong>
                  <span className="font-mono text-muted text-xs">0x7099...79C8</span>
                </div>
                <button
                  className="copy-chip-btn"
                  onClick={() =>
                    handleCopy(
                      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
                      "acc1"
                    )
                  }
                  title="Copy Private Key to import into MetaMask"
                >
                  {copiedAccount === "acc1" ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                  <span>{copiedAccount === "acc1" ? "Key Copied!" : "Copy Key"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer note: Continue as Guest */}
          <div className="login-modal-footer">
            <button className="btn-link text-dim text-xs" onClick={handleClose}>
              Continue in Read-Only Mode (Browse public ledger & verify documents)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
