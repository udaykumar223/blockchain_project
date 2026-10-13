// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LandRecordVerification
 * @notice Provides an additional verification and audit layer for land records.
 *         This does NOT replace official government land registries.
 * @dev    Stores property metadata, document hashes, and ownership transfer history
 *         on-chain. Only the authorized registrar can register properties and
 *         approve ownership transfers.
 */
contract LandRecordVerification {
    // ──────────────────────────────────────────────
    //  Data structures
    // ──────────────────────────────────────────────

    struct Property {
        string propertyId;       // Unique human-readable ID, e.g. "P101"
        string currentOwner;     // Name of the current owner
        bytes32 documentHash;    // SHA-256 hash of the latest document
        uint256 registeredAt;    // Block timestamp of registration
        bool exists;             // Guard against double-registration
    }

    struct TransferRecord {
        string previousOwner;
        string newOwner;
        bytes32 newDocumentHash;
        uint256 timestamp;
        address initiatedBy;     // Wallet that submitted the transfer
    }

    // ──────────────────────────────────────────────
    //  State variables
    // ──────────────────────────────────────────────

    address public immutable registrar;            // Set once at deployment
    mapping(string => Property) private properties; // propertyId => Property
    mapping(string => TransferRecord[]) private transferHistory; // propertyId => history
    string[] public propertyIds;                   // For enumeration

    uint256 public totalProperties;
    uint256 public totalTransfers;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event PropertyRegistered(
        string indexed propertyId,
        string owner,
        bytes32 documentHash,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed propertyId,
        string previousOwner,
        string newOwner,
        bytes32 newDocumentHash,
        uint256 timestamp
    );

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Only the authorized registrar can perform this action");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /**
     * @notice Deploys the contract and sets the deployer as the permanent registrar.
     */
    constructor() {
        registrar = msg.sender;
    }

    // ──────────────────────────────────────────────
    //  Registration
    // ──────────────────────────────────────────────

    /**
     * @notice Register a new property. Only the registrar can call this.
     * @param _propertyId  Unique string identifier for the property
     * @param _owner       Name of the initial owner
     * @param _documentHash SHA-256 hash of the registration document
     */
    function registerProperty(
        string calldata _propertyId,
        string calldata _owner,
        bytes32 _documentHash
    ) external onlyRegistrar {
        require(bytes(_propertyId).length > 0, "Property ID cannot be empty");
        require(bytes(_owner).length > 0, "Owner name cannot be empty");
        require(_documentHash != bytes32(0), "Document hash cannot be empty");
        require(!properties[_propertyId].exists, "Property already registered");

        properties[_propertyId] = Property({
            propertyId: _propertyId,
            currentOwner: _owner,
            documentHash: _documentHash,
            registeredAt: block.timestamp,
            exists: true
        });

        propertyIds.push(_propertyId);
        totalProperties++;

        emit PropertyRegistered(_propertyId, _owner, _documentHash, block.timestamp);
    }

    // ──────────────────────────────────────────────
    //  Ownership transfer
    // ──────────────────────────────────────────────

    /**
     * @notice Transfer ownership of a registered property. Only the registrar
     *         can approve transfers.
     * @param _propertyId      The property to transfer
     * @param _currentOwner    Must match the on-chain current owner (prevents stale data)
     * @param _newOwner        Name of the new owner
     * @param _newDocumentHash SHA-256 hash of the new (updated) document
     */
    function transferOwnership(
        string calldata _propertyId,
        string calldata _currentOwner,
        string calldata _newOwner,
        bytes32 _newDocumentHash
    ) external onlyRegistrar {
        require(properties[_propertyId].exists, "Property not found");
        require(bytes(_newOwner).length > 0, "New owner name cannot be empty");
        require(_newDocumentHash != bytes32(0), "Document hash cannot be empty");

        Property storage prop = properties[_propertyId];
        require(
            keccak256(bytes(prop.currentOwner)) == keccak256(bytes(_currentOwner)),
            "Current owner mismatch"
        );

        // Record history
        transferHistory[_propertyId].push(TransferRecord({
            previousOwner: prop.currentOwner,
            newOwner: _newOwner,
            newDocumentHash: _newDocumentHash,
            timestamp: block.timestamp,
            initiatedBy: msg.sender
        }));

        // Update property
        prop.currentOwner = _newOwner;
        prop.documentHash = _newDocumentHash;

        totalTransfers++;

        emit OwnershipTransferred(
            _propertyId,
            _currentOwner,
            _newOwner,
            _newDocumentHash,
            block.timestamp
        );
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    /**
     * @notice Verify a document hash against the stored hash for a property.
     * @return isMatch   True if hashes match
     * @return storedHash The hash currently on record
     */
    function verifyDocument(
        string calldata _propertyId,
        bytes32 _documentHash
    ) external view returns (bool isMatch, bytes32 storedHash) {
        require(properties[_propertyId].exists, "Property not found");
        storedHash = properties[_propertyId].documentHash;
        isMatch = (storedHash == _documentHash);
    }

    /**
     * @notice Retrieve full property details.
     */
    function getProperty(string calldata _propertyId)
        external
        view
        returns (
            string memory propertyId,
            string memory currentOwner,
            bytes32 documentHash,
            uint256 registeredAt,
            bool exists
        )
    {
        Property storage p = properties[_propertyId];
        return (p.propertyId, p.currentOwner, p.documentHash, p.registeredAt, p.exists);
    }

    /**
     * @notice Retrieve ownership transfer history for a property.
     */
    function getTransferHistory(string calldata _propertyId)
        external
        view
        returns (TransferRecord[] memory)
    {
        require(properties[_propertyId].exists, "Property not found");
        return transferHistory[_propertyId];
    }

    /**
     * @notice Return the total number of registered property IDs.
     */
    function getPropertyCount() external view returns (uint256) {
        return propertyIds.length;
    }

    /**
     * @notice Return a property ID by its index (for enumeration).
     */
    function getPropertyIdByIndex(uint256 _index)
        external
        view
        returns (string memory)
    {
        require(_index < propertyIds.length, "Index out of bounds");
        return propertyIds[_index];
    }
}
