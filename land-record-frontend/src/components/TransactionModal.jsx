import React from "react";
import { CheckCircle2, AlertCircle, Loader2, X, ExternalLink, Copy } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatHash, copyToClipboard } from "../utils/format";

export default function TransactionModal() {
  const { txState, setTxState } = useWeb3();
  const [copied, setCopied] = React.useState(false);

  if (!txState || txState.status === "idle") return null;

  const handleClose = () => {
    setTxState({ status: "idle", hash: "", message: "", error: "" });
  };

  const handleCopy = async () => {
    if (txState.hash) {
      await copyToClipboard(txState.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            {txState.status === "prompt" && (
              <Loader2 className="spin-animation text-primary" size={24} />
            )}
            {txState.status === "pending" && (
              <Loader2 className="spin-animation text-cyan" size={24} />
            )}
            {txState.status === "success" && (
              <CheckCircle2 className="text-emerald" size={24} />
            )}
            {txState.status === "error" && (
              <AlertCircle className="text-rose" size={24} />
            )}
            <h3 className="modal-heading">
              {txState.status === "prompt" && "Awaiting MetaMask Signature"}
              {txState.status === "pending" && "Mining Blockchain Transaction"}
              {txState.status === "success" && "Transaction Confirmed!"}
              {txState.status === "error" && "Transaction Reverted / Failed"}
            </h3>
          </div>
          {(txState.status === "success" || txState.status === "error") && (
            <button className="modal-close-btn" onClick={handleClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {txState.status === "prompt" && (
            <p className="modal-description">
              Please confirm the transaction in your MetaMask wallet extension to submit it to the Hardhat local network.
            </p>
          )}

          {txState.status === "pending" && (
            <div>
              <p className="modal-description">
                Transaction submitted! Waiting for block confirmation on chain <code>31337</code>...
              </p>
              {txState.hash && (
                <div className="modal-tx-box">
                  <span className="font-mono text-muted">TX Hash:</span>
                  <span className="font-mono hash-text">{formatHash(txState.hash)}</span>
                </div>
              )}
            </div>
          )}

          {txState.status === "success" && (
            <div>
              <p className="modal-description text-emerald">
                {txState.message || "Your operation has been securely recorded on the blockchain ledger."}
              </p>
              {txState.hash && (
                <div className="modal-tx-box">
                  <div className="modal-tx-row">
                    <span className="font-mono text-muted">TX Hash:</span>
                    <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                      <Copy size={12} />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <span className="font-mono hash-full">{txState.hash}</span>
                </div>
              )}
            </div>
          )}

          {txState.status === "error" && (
            <div>
              <div className="error-alert-box">
                <strong>Error Details:</strong>
                <p>{txState.error || "An unexpected error occurred during execution."}</p>
              </div>
              <p className="modal-troubleshooting-hint">
                Tip: Verify that you are connected with the correct authorized account (e.g., Registrar or Property Owner) and that property IDs and inputs are valid.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {(txState.status === "success" || txState.status === "error") && (
            <button className="btn btn-primary" onClick={handleClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
