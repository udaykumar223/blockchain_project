/**
 * Blockchain and Smart Contract Configuration
 * 
 * To switch to Sepolia Testnet:
 * 1. Set ACTIVE_NETWORK = 'sepolia'
 * 2. Set CONTRACT_ADDRESS to your deployed Remix IDE contract address
 */

// Toggle between 'hardhat' (local) and 'sepolia' (live Ethereum testnet)
export const ACTIVE_NETWORK = "hardhat"; 

export const CONTRACT_ADDRESS =
  (typeof window !== "undefined" && window.localStorage.getItem("TERRA_CONTRACT_ADDRESS")) ||
  (ACTIVE_NETWORK === "sepolia" 
    ? "0xYourSepoliaContractAddressHere" 
    : "0x5FbDB2315678afecb367f032d93F642f64180aa3");

export const CHAIN_ID = ACTIVE_NETWORK === "sepolia" ? 11155111 : 31337;
export const CHAIN_ID_HEX = ACTIVE_NETWORK === "sepolia" ? "0xaa36a7" : "0x7a69";
export const RPC_URL = ACTIVE_NETWORK === "sepolia" 
  ? "https://ethereum-sepolia-rpc.publicnode.com" 
  : "http://127.0.0.1:8545";

export const NETWORK_CONFIG = ACTIVE_NETWORK === "sepolia"
  ? {
      chainId: "0xaa36a7",
      chainName: "Sepolia Test Network",
      nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"],
    }
  : {
      chainId: "0x7a69",
      chainName: "Hardhat Local",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["http://127.0.0.1:8545"],
    };

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "documentHash",
        "type": "bytes32"
      }
    ],
    "name": "PropertyRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldRegistrar",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newRegistrar",
        "type": "address"
      }
    ],
    "name": "RegistrarChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "TransferApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      }
    ],
    "name": "TransferCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "currentOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "TransferRequested",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      }
    ],
    "name": "approveTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newRegistrar",
        "type": "address"
      }
    ],
    "name": "changeRegistrar",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      }
    ],
    "name": "getHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "documentHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "action",
            "type": "bytes32"
          }
        ],
        "internalType": "struct LandRecordVerification.AuditRecord[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      }
    ],
    "name": "getHistoryCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "pendingTransfers",
    "outputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "newDocumentHash",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "properties",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "currentOwner",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "documentHash",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "documentHash",
        "type": "bytes32"
      }
    ],
    "name": "registerProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "registrar",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      }
    ],
    "name": "rejectTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "newDocumentHash",
        "type": "bytes32"
      }
    ],
    "name": "requestTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "propertyId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "suppliedHash",
        "type": "bytes32"
      }
    ],
    "name": "verifyDocument",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPropertyIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPropertyCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
