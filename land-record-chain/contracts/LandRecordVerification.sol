// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRecordVerification {
    address public registrar;

    constructor() {
        registrar = msg.sender;
    }

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Only registrar");
        _;
    }

    struct Property {
        uint256 id;
        address currentOwner;
        bytes32 documentHash;
        bool exists;
    }

    struct PendingTransfer {
        address newOwner;
        bytes32 newDocumentHash;
        bool exists;
    }

    struct AuditRecord {
        address previousOwner;
        address newOwner;
        bytes32 documentHash;
        uint256 timestamp;
        bytes32 action;
    }

    mapping(uint256 => Property) public properties;

    mapping(uint256 => PendingTransfer)
        public pendingTransfers;

    mapping(uint256 => AuditRecord[])
        private auditHistory;

    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        bytes32 documentHash
    );

    event TransferRequested(
        uint256 indexed propertyId,
        address indexed currentOwner,
        address indexed newOwner
    );

    event TransferApproved(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner
    );

    event TransferCancelled(uint256 indexed propertyId);

    event RegistrarChanged(
        address indexed oldRegistrar,
        address indexed newRegistrar
    );

    // Register a new property.
    function registerProperty(
        uint256 propertyId,
        address initialOwner,
        bytes32 documentHash
    ) external onlyRegistrar {
        require(propertyId != 0, "Invalid property ID");
        require(!properties[propertyId].exists, "Already registered");
        require(initialOwner != address(0), "Invalid owner");
        require(documentHash != bytes32(0), "Empty document hash");

        properties[propertyId] = Property({
            id: propertyId,
            currentOwner: initialOwner,
            documentHash: documentHash,
            exists: true
        });

        auditHistory[propertyId].push(
            AuditRecord({
                previousOwner: address(0),
                newOwner: initialOwner,
                documentHash: documentHash,
                timestamp: block.timestamp,
                action: bytes32("REGISTERED")
            })
        );

        emit PropertyRegistered(
            propertyId,
            initialOwner,
            documentHash
        );
    }

    // Current owner requests a transfer.
    function requestTransfer(
        uint256 propertyId,
        address newOwner,
        bytes32 newDocumentHash
    ) external {
        Property storage p = properties[propertyId];

        require(p.exists, "Property not found");
        require(msg.sender == p.currentOwner, "Not current owner");
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != p.currentOwner, "Already owner");
        require(newDocumentHash != bytes32(0), "Empty document hash");
        require(
            !pendingTransfers[propertyId].exists,
            "Transfer already pending"
        );

        pendingTransfers[propertyId] = PendingTransfer({
            newOwner: newOwner,
            newDocumentHash: newDocumentHash,
            exists: true
        });

        emit TransferRequested(
            propertyId,
            p.currentOwner,
            newOwner
        );
    }

    // Registrar approves the pending transfer.
    function approveTransfer(
        uint256 propertyId
    ) external onlyRegistrar {
        Property storage p = properties[propertyId];
        PendingTransfer memory t = pendingTransfers[propertyId];

        require(p.exists, "Property not found");
        require(t.exists, "No pending transfer");

        address previousOwner = p.currentOwner;

        p.currentOwner = t.newOwner;
        p.documentHash = t.newDocumentHash;

        auditHistory[propertyId].push(
            AuditRecord({
                previousOwner: previousOwner,
                newOwner: t.newOwner,
                documentHash: t.newDocumentHash,
                timestamp: block.timestamp,
                action: bytes32("TRANSFERRED")
            })
        );

        delete pendingTransfers[propertyId];

        emit TransferApproved(
            propertyId,
            previousOwner,
            p.currentOwner
        );
    }

    // Registrar rejects a pending transfer.
    function rejectTransfer(
        uint256 propertyId
    ) external onlyRegistrar {
        require(
            pendingTransfers[propertyId].exists,
            "No pending transfer"
        );

        delete pendingTransfers[propertyId];

        emit TransferCancelled(propertyId);
    }

    // Compare a supplied hash with the registered hash.
    function verifyDocument(
        uint256 propertyId,
        bytes32 suppliedHash
    ) external view returns (bool) {
        Property storage p = properties[propertyId];

        require(p.exists, "Property not found");

        return p.documentHash == suppliedHash;
    }

    // Get a property's complete audit history.
    function getHistory(
        uint256 propertyId
    ) external view returns (AuditRecord[] memory) {
        require(properties[propertyId].exists, "Property not found");

        return auditHistory[propertyId];
    }

    function getHistoryCount(
        uint256 propertyId
    ) external view returns (uint256) {
        require(properties[propertyId].exists, "Property not found");

        return auditHistory[propertyId].length;
    }

    // Change the registrar if needed.
    function changeRegistrar(
        address newRegistrar
    ) external onlyRegistrar {
        require(newRegistrar != address(0), "Invalid registrar");

        address oldRegistrar = registrar;
        registrar = newRegistrar;

        emit RegistrarChanged(oldRegistrar, newRegistrar);
    }
}