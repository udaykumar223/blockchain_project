import React, { useState } from "react";
import { Web3Provider, useWeb3 } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import TransactionModal from "./components/TransactionModal";
import LoginModal from "./components/LoginModal";
import DashboardView from "./views/DashboardView";
import RegisterPropertyView from "./views/RegisterPropertyView";
import PropertyDetailsView from "./views/PropertyDetailsView";
import VerifyDocumentView from "./views/VerifyDocumentView";
import TransferRequestView from "./views/TransferRequestView";
import RegistrarPortalView from "./views/RegistrarPortalView";
import HistoryExplorerView from "./views/HistoryExplorerView";
import { CONTRACT_ADDRESS, CHAIN_ID } from "./config/contract";
import "./App.css";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  return (
    <div className="app-root">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="app-main">
        {activeTab === "dashboard" && (
          <DashboardView
            setActiveTab={setActiveTab}
            setSelectedPropertyId={setSelectedPropertyId}
          />
        )}

        {activeTab === "register" && (
          <RegisterPropertyView
            setActiveTab={setActiveTab}
            setSelectedPropertyId={setSelectedPropertyId}
          />
        )}

        {activeTab === "search" && (
          <PropertyDetailsView
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "verify" && (
          <VerifyDocumentView
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "transfer" && (
          <TransferRequestView
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "registrar" && (
          <RegistrarPortalView
            setActiveTab={setActiveTab}
            setSelectedPropertyId={setSelectedPropertyId}
          />
        )}

        {activeTab === "history" && (
          <HistoryExplorerView
            selectedPropertyId={selectedPropertyId}
            setSelectedPropertyId={setSelectedPropertyId}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Transaction & Login Modals */}
      <TransactionModal />
      <LoginModal />

      {/* Global Academic Prototype Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-logo">TerraVault</span>
            <span className="footer-meta">
              Contract: <code>{CONTRACT_ADDRESS}</code> • Chain ID: <code>{CHAIN_ID}</code> (Hardhat Local)
            </span>
          </div>
          <div className="footer-right">
            <span className="text-dim text-xs">
              Academic Land Record Verification Prototype • Cryptographic SHA-256 Title Validation
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}
