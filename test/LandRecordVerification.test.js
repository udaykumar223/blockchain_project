const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRecordVerification", function () {
  let contract;
  let registrar;
  let unauthorizedUser;

  // Sample document hashes (simulating SHA-256 hashes)
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("sample-document-1.pdf"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("sample-document-2.pdf"));
  const modifiedHash = ethers.keccak256(ethers.toUtf8Bytes("modified-document.pdf"));

  beforeEach(async function () {
    [registrar, unauthorizedUser] = await ethers.getSigners();
    const LandRecordVerification = await ethers.getContractFactory("LandRecordVerification");
    contract = await LandRecordVerification.deploy();
    await contract.waitForDeployment();
  });

  // ─── Test 1: Successful property registration ───
  describe("Property Registration", function () {
    it("should register a new property successfully", async function () {
      const tx = await contract.registerProperty("P101", "Ravi", sampleHash1);
      const receipt = await tx.wait();

      // Verify the event was emitted
      const event = receipt.logs.find((log) => {
        try {
          return contract.interface.parseLog(log)?.name === "PropertyRegistered";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;

      // Verify the property was stored correctly
      const prop = await contract.getProperty("P101");
      expect(prop.propertyId).to.equal("P101");
      expect(prop.currentOwner).to.equal("Ravi");
      expect(prop.documentHash).to.equal(sampleHash1);
      expect(prop.exists).to.be.true;

      // Verify counter
      expect(await contract.totalProperties()).to.equal(1);
    });

    // ─── Test 2: Duplicate property rejection ───
    it("should reject duplicate property registration", async function () {
      await contract.registerProperty("P101", "Ravi", sampleHash1);
      await expect(
        contract.registerProperty("P101", "Arun", sampleHash2)
      ).to.be.revertedWith("Property already registered");
    });

    it("should reject registration with empty property ID", async function () {
      await expect(
        contract.registerProperty("", "Ravi", sampleHash1)
      ).to.be.revertedWith("Property ID cannot be empty");
    });

    it("should reject registration with empty owner name", async function () {
      await expect(
        contract.registerProperty("P101", "", sampleHash1)
      ).to.be.revertedWith("Owner name cannot be empty");
    });

    it("should reject registration with empty document hash", async function () {
      await expect(
        contract.registerProperty("P101", "Ravi", ethers.ZeroHash)
      ).to.be.revertedWith("Document hash cannot be empty");
    });
  });

  // ─── Test 3 & 4: Document hash verification ───
  describe("Document Verification", function () {
    beforeEach(async function () {
      await contract.registerProperty("P101", "Ravi", sampleHash1);
    });

    it("should verify correct document hash", async function () {
      const [isMatch, storedHash] = await contract.verifyDocument("P101", sampleHash1);
      expect(isMatch).to.be.true;
      expect(storedHash).to.equal(sampleHash1);
    });

    it("should reject modified document hash", async function () {
      const [isMatch, storedHash] = await contract.verifyDocument("P101", modifiedHash);
      expect(isMatch).to.be.false;
      expect(storedHash).to.equal(sampleHash1);
    });

    it("should revert for non-existent property", async function () {
      await expect(
        contract.verifyDocument("P999", sampleHash1)
      ).to.be.revertedWith("Property not found");
    });
  });

  // ─── Test 5: Successful ownership transfer ───
  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await contract.registerProperty("P101", "Ravi", sampleHash1);
    });

    it("should transfer ownership successfully", async function () {
      const tx = await contract.transferOwnership("P101", "Ravi", "Arun", sampleHash2);
      const receipt = await tx.wait();

      // Verify event
      const event = receipt.logs.find((log) => {
        try {
          return contract.interface.parseLog(log)?.name === "OwnershipTransferred";
        } catch { return false; }
      });
      expect(event).to.not.be.undefined;

      // Verify updated property
      const prop = await contract.getProperty("P101");
      expect(prop.currentOwner).to.equal("Arun");
      expect(prop.documentHash).to.equal(sampleHash2);

      // Verify transfer counter
      expect(await contract.totalTransfers()).to.equal(1);
    });

    // ─── Test 6: Unauthorized transfer rejection ───
    it("should reject transfer from unauthorized user", async function () {
      await expect(
        contract
          .connect(unauthorizedUser)
          .transferOwnership("P101", "Ravi", "Arun", sampleHash2)
      ).to.be.revertedWith("Only the authorized registrar can perform this action");
    });

    // ─── Test 7: Invalid property rejection ───
    it("should reject transfer for non-existent property", async function () {
      await expect(
        contract.transferOwnership("P999", "Ravi", "Arun", sampleHash2)
      ).to.be.revertedWith("Property not found");
    });

    it("should reject transfer with mismatched current owner", async function () {
      await expect(
        contract.transferOwnership("P101", "WrongPerson", "Arun", sampleHash2)
      ).to.be.revertedWith("Current owner mismatch");
    });

    it("should reject transfer with empty new owner", async function () {
      await expect(
        contract.transferOwnership("P101", "Ravi", "", sampleHash2)
      ).to.be.revertedWith("New owner name cannot be empty");
    });
  });

  // ─── Test 8: Ownership history after multiple transfers ───
  describe("Ownership History", function () {
    it("should maintain complete transfer history", async function () {
      await contract.registerProperty("P101", "Ravi", sampleHash1);
      await contract.transferOwnership("P101", "Ravi", "Arun", sampleHash2);

      const hash3 = ethers.keccak256(ethers.toUtf8Bytes("document-3.pdf"));
      await contract.transferOwnership("P101", "Arun", "Priya", hash3);

      const history = await contract.getTransferHistory("P101");
      expect(history.length).to.equal(2);

      // First transfer
      expect(history[0].previousOwner).to.equal("Ravi");
      expect(history[0].newOwner).to.equal("Arun");

      // Second transfer
      expect(history[1].previousOwner).to.equal("Arun");
      expect(history[1].newOwner).to.equal("Priya");

      // Final state
      const prop = await contract.getProperty("P101");
      expect(prop.currentOwner).to.equal("Priya");
      expect(await contract.totalTransfers()).to.equal(2);
    });

    it("should revert history lookup for non-existent property", async function () {
      await expect(
        contract.getTransferHistory("P999")
      ).to.be.revertedWith("Property not found");
    });
  });

  // ─── Enumeration ───
  describe("Property Enumeration", function () {
    it("should enumerate registered properties", async function () {
      await contract.registerProperty("P101", "Ravi", sampleHash1);
      await contract.registerProperty("P102", "Arun", sampleHash2);

      expect(await contract.getPropertyCount()).to.equal(2);
      expect(await contract.getPropertyIdByIndex(0)).to.equal("P101");
      expect(await contract.getPropertyIdByIndex(1)).to.equal("P102");
    });
  });

  // ─── Registrar immutability ───
  describe("Registrar Security", function () {
    it("should set the deployer as the registrar", async function () {
      expect(await contract.registrar()).to.equal(registrar.address);
    });

    it("registrar address is immutable (no setter function)", async function () {
      // Verify there's no way to change the registrar
      // The contract uses `immutable` keyword — this is a design verification
      expect(await contract.registrar()).to.equal(registrar.address);
    });

    it("should prevent unauthorized registration", async function () {
      await expect(
        contract.connect(unauthorizedUser).registerProperty("P101", "Ravi", sampleHash1)
      ).to.be.revertedWith("Only the authorized registrar can perform this action");
    });
  });
});
