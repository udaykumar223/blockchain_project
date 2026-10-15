import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CHAIN_ID,
  RPC_URL,
  NETWORK_CONFIG,
  CONTRACT_ABI,
} from "../config/contract";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [registrar, setRegistrar] = useState(null);
  const [properties, setProperties] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [txState, setTxState] = useState({
    status: "idle", // 'idle' | 'prompt' | 'pending' | 'success' | 'error'
    hash: "",
    message: "",
    error: "",
  });

  // Always-available read-only provider for public reads
  const getFallbackProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(RPC_URL);
  }, []);

  // Read-only contract instance
  const getReadOnlyContract = useCallback(() => {
    const provider = getFallbackProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [getFallbackProvider]);

  // Signer-connected contract instance
  const getWriteContract = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed.");
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, []);

  // Fetch contract data (properties, pending transfers, audit events)
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const contract = getReadOnlyContract();

      // 1. Fetch current on-chain registrar
      try {
        const reg = await contract.registrar();
        setRegistrar(reg);
      } catch (err) {
        console.warn("Could not fetch registrar:", err);
      }

      // 2. Fetch all registered property IDs from events
      const registeredFilter = contract.filters.PropertyRegistered();
      const regEvents = await contract.queryFilter(registeredFilter, 0, "latest");

      // Extract unique property IDs in descending order
      const propertyIdSet = new Set();
      regEvents.forEach((ev) => {
        if (ev.args && ev.args[0]) {
          propertyIdSet.add(ev.args[0].toString());
        }
      });

      const propList = [];
      const pendingList = [];

      for (const idStr of propertyIdSet) {
        const idBigInt = BigInt(idStr);
        try {
          const propData = await contract.properties(idBigInt);
          if (propData.exists) {
            const pendingData = await contract.pendingTransfers(idBigInt);
            const propObj = {
              id: idBigInt.toString(),
              currentOwner: propData.currentOwner,
              documentHash: propData.documentHash,
              exists: propData.exists,
              pendingTransfer: {
                exists: pendingData.exists,
                newOwner: pendingData.newOwner,
                newDocumentHash: pendingData.newDocumentHash,
              },
            };
            propList.push(propObj);
            if (pendingData.exists) {
              pendingList.push(propObj);
            }
          }
        } catch (err) {
          console.warn(`Error reading property ${idStr}:`, err);
        }
      }

      setProperties(propList);
      setPendingTransfers(pendingList);

      // 3. Query all recent events for activity timeline
      const [tReqEvents, tAppEvents, tCancEvents, regChangeEvents] = await Promise.all([
        contract.queryFilter(contract.filters.TransferRequested(), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.TransferApproved(), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.TransferCancelled(), 0, "latest").catch(() => []),
        contract.queryFilter(contract.filters.RegistrarChanged(), 0, "latest").catch(() => []),
      ]);

      const allEvents = [];

      regEvents.forEach((e) => {
        allEvents.push({
          type: "PropertyRegistered",
          title: "Property Registered",
          propertyId: e.args[0].toString(),
          owner: e.args[1],
          documentHash: e.args[2],
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
        });
      });

      tReqEvents.forEach((e) => {
        allEvents.push({
          type: "TransferRequested",
          title: "Ownership Transfer Requested",
          propertyId: e.args[0].toString(),
          currentOwner: e.args[1],
          newOwner: e.args[2],
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
        });
      });

      tAppEvents.forEach((e) => {
        allEvents.push({
          type: "TransferApproved",
          title: "Transfer Approved by Registrar",
          propertyId: e.args[0].toString(),
          previousOwner: e.args[1],
          newOwner: e.args[2],
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
        });
      });

      tCancEvents.forEach((e) => {
        allEvents.push({
          type: "TransferCancelled",
          title: "Transfer Rejected / Cancelled",
          propertyId: e.args[0].toString(),
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
        });
      });

      regChangeEvents.forEach((e) => {
        allEvents.push({
          type: "RegistrarChanged",
          title: "Registrar Role Transferred",
          oldRegistrar: e.args[0],
          newRegistrar: e.args[1],
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
        });
      });

      // Sort newest block first
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setActivityEvents(allEvents);
    } catch (err) {
      console.error("Failed to load blockchain state:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [getReadOnlyContract]);

  // Update account balance
  const updateBalance = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const provider = getFallbackProvider();
      const bal = await provider.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.warn("Could not fetch balance:", err);
    }
  }, [getFallbackProvider]);

  // Connect MetaMask
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask extension not found! Please install MetaMask to interact with the blockchain.");
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const net = await browserProvider.getNetwork();
        setChainId(Number(net.chainId));
        await updateBalance(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  // Switch or Add Hardhat Network
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError) {
      // 4902 indicates chain not added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Failed to add Hardhat network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  }, []);

  // Listen for MetaMask account & network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        updateBalance(accounts[0]);
      } else {
        setAccount(null);
        setBalance("0");
      }
    };

    const handleChainChanged = (hexChainId) => {
      setChainId(parseInt(hexChainId, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial silent check
    const checkInitialConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_accounts", []);
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          const net = await browserProvider.getNetwork();
          setChainId(Number(net.chainId));
          await updateBalance(accounts[0]);
        }
      } catch (err) {
        console.warn("Initial check error:", err);
      }
    };

    checkInitialConnection();

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [updateBalance]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Helper to cleanly parse contract revert errors
  const parseContractError = (err) => {
    if (!err) return "Transaction failed.";
    if (err.code === "ACTION_REJECTED" || err.code === 4001) {
      return "Transaction was cancelled / rejected by user in MetaMask.";
    }
    // Check known Solidity revert reasons
    const msg = err.message || "";
    if (msg.includes("Only registrar")) return "Unauthorized: This action is restricted strictly to the authorized Registrar.";
    if (msg.includes("Already registered")) return "Invalid: This property ID is already registered in the registry.";
    if (msg.includes("Invalid property ID")) return "Invalid property ID: Property ID cannot be 0.";
    if (msg.includes("Invalid owner")) return "Invalid address: The owner address cannot be the zero address.";
    if (msg.includes("Empty document hash")) return "Empty Document Hash: Document hash cannot be empty or zero.";
    if (msg.includes("Property not found")) return "Not Found: The specified Property ID does not exist on the blockchain.";
    if (msg.includes("Not current owner")) return "Unauthorized: Only the current registered owner of this property can request an ownership transfer.";
    if (msg.includes("Already owner")) return "Invalid Recipient: The proposed new owner is already the current owner.";
    if (msg.includes("Transfer already pending")) return "Pending Conflict: An ownership transfer is already pending for this property.";
    if (msg.includes("No pending transfer")) return "Invalid State: There is no pending transfer request for this property.";
    if (msg.includes("Invalid registrar")) return "Invalid Address: The new registrar cannot be the zero address.";

    if (err.reason) return err.reason;
    if (err.shortMessage) return err.shortMessage;
    return msg.substring(0, 180);
  };

  const isCorrectNetwork = chainId === CHAIN_ID;
  const isRegistrar =
    Boolean(account && registrar && account.toLowerCase() === registrar.toLowerCase());

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        balance,
        isCorrectNetwork,
        isConnecting,
        registrar,
        isRegistrar,
        properties,
        pendingTransfers,
        activityEvents,
        isLoadingData,
        txState,
        setTxState,
        parseContractError,
        connectWallet,
        switchNetwork,
        refreshData,
        getReadOnlyContract,
        getWriteContract,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
