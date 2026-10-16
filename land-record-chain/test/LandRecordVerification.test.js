const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRecordVerification Contract", function () {
  async function deployFixture() {
    const [registrar, owner1, owner2, nonRegistrar] = await ethers.getSigners();

    const LandRecordVerification = await ethers.getContractFactory("LandRecordVerification");
    const contract = await LandRecordVerification.deploy();
    await contract.waitForDeployment();

    const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("Deed-Document-12345-PlotA"));
    const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("Deed-Document-12345-PlotA-UpdatedTransfer"));
    const mismatchHash = ethers.keccak256(ethers.toUtf8Bytes("Fake-Document-Tampered"));

    return { contract, registrar, owner1, owner2, nonRegistrar, sampleHash1, sampleHash2, mismatchHash };
  }

  describe("Deployment & Initialization", function () {
    it("Should set the deployer as the initial registrar", async function () {
      const { contract, registrar } = await loadFixture(deployFixture);
      expect(await contract.registrar()).to.equal(registrar.address);
    });
  });

  describe("Property Registration", function () {
    it("Allows the registrar to register a new property and emits PropertyRegistered event", async function () {
      const { contract, registrar, owner1, sampleHash1 } = await loadFixture(deployFixture);
      const propertyId = 101;

      await expect(contract.connect(registrar).registerProperty(propertyId, owner1.address, sampleHash1))
        .to.emit(contract, "PropertyRegistered")
        .withArgs(propertyId, owner1.address, sampleHash1);

      const prop = await contract.properties(propertyId);
      expect(prop.id).to.equal(propertyId);
      expect(prop.currentOwner).to.equal(owner1.address);
      expect(prop.documentHash).to.equal(sampleHash1);
      expect(prop.exists).to.be.true;
    });

    it("Rejects registration if not called by the registrar", async function () {
      const { contract, nonRegistrar, owner1, sampleHash1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(nonRegistrar).registerProperty(102, owner1.address, sampleHash1)
      ).to.be.revertedWith("Only registrar");
    });

    it("Rejects duplicate property registration", async function () {
      const { contract, registrar, owner1, sampleHash1 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(103, owner1.address, sampleHash1);

      await expect(
        contract.connect(registrar).registerProperty(103, owner1.address, sampleHash1)
      ).to.be.revertedWith("Already registered");
    });

    it("Rejects invalid property ID (0)", async function () {
      const { contract, registrar, owner1, sampleHash1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(registrar).registerProperty(0, owner1.address, sampleHash1)
      ).to.be.revertedWith("Invalid property ID");
    });

    it("Rejects invalid owner address (0x0)", async function () {
      const { contract, registrar, sampleHash1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(registrar).registerProperty(104, ethers.ZeroAddress, sampleHash1)
      ).to.be.revertedWith("Invalid owner");
    });

    it("Rejects empty document hash", async function () {
      const { contract, registrar, owner1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(registrar).registerProperty(105, owner1.address, ethers.ZeroHash)
      ).to.be.revertedWith("Empty document hash");
    });
  });

  describe("Document Hash Verification", function () {
    it("Returns true for a matching document hash", async function () {
      const { contract, registrar, owner1, sampleHash1 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(201, owner1.address, sampleHash1);

      const isVerified = await contract.verifyDocument(201, sampleHash1);
      expect(isVerified).to.be.true;
    });

    it("Returns false for a mismatching document hash", async function () {
      const { contract, registrar, owner1, sampleHash1, mismatchHash } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(202, owner1.address, sampleHash1);

      const isVerified = await contract.verifyDocument(202, mismatchHash);
      expect(isVerified).to.be.false;
    });

    it("Reverts if verifying a non-existent property", async function () {
      const { contract, sampleHash1 } = await loadFixture(deployFixture);
      await expect(contract.verifyDocument(99999, sampleHash1)).to.be.revertedWith("Property not found");
    });
  });

  describe("Ownership Transfer Requests", function () {
    it("Allows the current owner to request a transfer", async function () {
      const { contract, registrar, owner1, owner2, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(301, owner1.address, sampleHash1);

      await expect(contract.connect(owner1).requestTransfer(301, owner2.address, sampleHash2))
        .to.emit(contract, "TransferRequested")
        .withArgs(301, owner1.address, owner2.address);

      const pending = await contract.pendingTransfers(301);
      expect(pending.exists).to.be.true;
      expect(pending.newOwner).to.equal(owner2.address);
      expect(pending.newDocumentHash).to.equal(sampleHash2);
    });

    it("Rejects transfer request if caller is not current owner", async function () {
      const { contract, registrar, owner1, owner2, nonRegistrar, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(302, owner1.address, sampleHash1);

      await expect(
        contract.connect(nonRegistrar).requestTransfer(302, owner2.address, sampleHash2)
      ).to.be.revertedWith("Not current owner");
    });

    it("Rejects transfer request if newOwner is current owner", async function () {
      const { contract, registrar, owner1, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(303, owner1.address, sampleHash1);

      await expect(
        contract.connect(owner1).requestTransfer(303, owner1.address, sampleHash2)
      ).to.be.revertedWith("Already owner");
    });

    it("Rejects duplicate pending transfer request", async function () {
      const { contract, registrar, owner1, owner2, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(304, owner1.address, sampleHash1);
      await contract.connect(owner1).requestTransfer(304, owner2.address, sampleHash2);

      await expect(
        contract.connect(owner1).requestTransfer(304, owner2.address, sampleHash2)
      ).to.be.revertedWith("Transfer already pending");
    });
  });

  describe("Registrar Approval and Rejection", function () {
    it("Allows registrar to approve pending transfer and updates property owner & hash", async function () {
      const { contract, registrar, owner1, owner2, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(401, owner1.address, sampleHash1);
      await contract.connect(owner1).requestTransfer(401, owner2.address, sampleHash2);

      await expect(contract.connect(registrar).approveTransfer(401))
        .to.emit(contract, "TransferApproved")
        .withArgs(401, owner1.address, owner2.address);

      const prop = await contract.properties(401);
      expect(prop.currentOwner).to.equal(owner2.address);
      expect(prop.documentHash).to.equal(sampleHash2);

      const pending = await contract.pendingTransfers(401);
      expect(pending.exists).to.be.false;
    });

    it("Rejects approval if caller is not registrar", async function () {
      const { contract, registrar, owner1, owner2, nonRegistrar, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(402, owner1.address, sampleHash1);
      await contract.connect(owner1).requestTransfer(402, owner2.address, sampleHash2);

      await expect(
        contract.connect(nonRegistrar).approveTransfer(402)
      ).to.be.revertedWith("Only registrar");
    });

    it("Allows registrar to reject pending transfer", async function () {
      const { contract, registrar, owner1, owner2, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(403, owner1.address, sampleHash1);
      await contract.connect(owner1).requestTransfer(403, owner2.address, sampleHash2);

      await expect(contract.connect(registrar).rejectTransfer(403))
        .to.emit(contract, "TransferCancelled")
        .withArgs(403);

      const pending = await contract.pendingTransfers(403);
      expect(pending.exists).to.be.false;

      // Owner should remain original owner
      const prop = await contract.properties(403);
      expect(prop.currentOwner).to.equal(owner1.address);
    });
  });

  describe("Audit History Tracking", function () {
    it("Records registration and transfer events in audit history", async function () {
      const { contract, registrar, owner1, owner2, sampleHash1, sampleHash2 } = await loadFixture(deployFixture);
      await contract.connect(registrar).registerProperty(501, owner1.address, sampleHash1);
      await contract.connect(owner1).requestTransfer(501, owner2.address, sampleHash2);
      await contract.connect(registrar).approveTransfer(501);

      const count = await contract.getHistoryCount(501);
      expect(count).to.equal(2);

      const history = await contract.getHistory(501);
      expect(history.length).to.equal(2);

      // Record 0: REGISTERED
      expect(history[0].previousOwner).to.equal(ethers.ZeroAddress);
      expect(history[0].newOwner).to.equal(owner1.address);
      expect(history[0].documentHash).to.equal(sampleHash1);
      expect(ethers.decodeBytes32String(history[0].action)).to.equal("REGISTERED");

      // Record 1: TRANSFERRED
      expect(history[1].previousOwner).to.equal(owner1.address);
      expect(history[1].newOwner).to.equal(owner2.address);
      expect(history[1].documentHash).to.equal(sampleHash2);
      expect(ethers.decodeBytes32String(history[1].action)).to.equal("TRANSFERRED");
    });
  });

  describe("Registrar Management", function () {
    it("Allows registrar to transfer registrar role and emits RegistrarChanged", async function () {
      const { contract, registrar, nonRegistrar } = await loadFixture(deployFixture);

      await expect(contract.connect(registrar).changeRegistrar(nonRegistrar.address))
        .to.emit(contract, "RegistrarChanged")
        .withArgs(registrar.address, nonRegistrar.address);

      expect(await contract.registrar()).to.equal(nonRegistrar.address);

      // Previous registrar can no longer call onlyRegistrar functions
      await expect(
        contract.connect(registrar).changeRegistrar(registrar.address)
      ).to.be.revertedWith("Only registrar");
    });
  });

  describe("Property Enumeration & Lookup", function () {
    it("Tracks registered property IDs and returns full list and count", async function () {
      const { contract, registrar, owner1, sampleHash1 } = await loadFixture(deployFixture);

      expect(await contract.getPropertyCount()).to.equal(0);
      expect((await contract.getAllPropertyIds()).length).to.equal(0);

      await contract.connect(registrar).registerProperty(601, owner1.address, sampleHash1);
      await contract.connect(registrar).registerProperty(602, owner1.address, sampleHash1);

      expect(await contract.getPropertyCount()).to.equal(2);
      const ids = await contract.getAllPropertyIds();
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(601);
      expect(ids[1]).to.equal(602);
    });
  });
});
