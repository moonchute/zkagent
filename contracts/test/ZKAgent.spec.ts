import { ethers, network } from "hardhat"
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { Signer, keccak256, solidityPacked, AbiCoder } from "ethers";
import { TestERC20, ZKAgent } from "../typechain-types";
import { issueProof, prProof } from "./utils";

describe("ZKAgent", () => {
  let owner: Signer;
  let bountyCreator: Signer;
  let bountySolver: Signer;
  const bountyReceiver = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const abiCoder = AbiCoder.defaultAbiCoder();

  const deploy = async () => {
    const protocolFee = 100; // 1%
    const penaltyPeriod = 86400; // 1 day

    const ZKAgent = await ethers.getContractFactory("ZKAgent");
    const zkAgent = await ZKAgent.deploy(protocolFee, penaltyPeriod, owner.getAddress());

    const ManagedKeyHashAdapterV2 = await ethers.getContractFactory("ManagedKeyHashAdapterV2");
    const IssueProcessor = await ethers.getContractFactory("IssueProcessor");
    const PRProcessor = await ethers.getContractFactory("PRProcessor");

    const mailServerKayHashAdapter = await ManagedKeyHashAdapterV2.deploy([]);
    const prProcessor = await (await PRProcessor.deploy(zkAgent, mailServerKayHashAdapter.getAddress(), "notifications@github.com")).getAddress();
    const issueProcessor = await (await IssueProcessor.deploy(zkAgent, mailServerKayHashAdapter.getAddress(), "notifications@github.com")).getAddress();

    await zkAgent.connect(owner).initialize(issueProcessor, prProcessor);

    // Test ERC20
    const agentAddress = await zkAgent.getAddress();
    const creatorAddress = await bountyCreator.getAddress();
    const erc20Amount = 100_000;
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const testERC20 = await TestERC20.deploy();

    await testERC20.mint(creatorAddress, erc20Amount);
    await testERC20.connect(bountyCreator).approve(agentAddress, erc20Amount);

    return { zkAgent, issueProcessor, prProcessor, testERC20 }
  }

  const getBountyId = () => {
    const repo = "jstinhw/zk-grant-testing"
    const issueNo = 15;

    const bountyId = keccak256(solidityPacked(
      ["string", "uint256"],
      [repo, issueNo]
    ))
    return bountyId

  }

  const createBounty = async (zkAgent: ZKAgent, testERC20: TestERC20) => {
    const erc20Address = await testERC20.getAddress();
    const repo = "jstinhw/zk-grant-testing"
    const bountyAmount = 1000;
    const issueNo = 15;

    const bountyId = keccak256(solidityPacked(
      ["string", "uint256"],
      [repo, issueNo]
    ))
    
    await zkAgent.connect(bountyCreator).createBounty(repo, issueNo, erc20Address, bountyAmount);
    return bountyId
  }

  const assignBounty = async (zkAgent: ZKAgent) => {
    const proof = issueProof();
    await zkAgent.connect(bountyCreator).assignBounty(proof.a, proof.b, proof.c, proof.signals);
  }

  before(async () => {
    [owner, bountyCreator, bountySolver] = await ethers.getSigners();
  })

  describe("initialize", () => {
    it("should have correct constructor state", async () => {
      const { zkAgent } = await loadFixture(deploy);

      expect(await zkAgent.owner()).to.equal(await owner.getAddress());
      expect(await zkAgent.protocolFee()).to.equal(100);
      expect(await zkAgent.penaltyPeriod()).to.equal(86400);
    })

    it("should have correct initial state", async () => {
      const { zkAgent, issueProcessor, prProcessor } = await loadFixture(deploy);

      expect(await zkAgent.issueProcessor()).to.equal(issueProcessor);
      expect(await zkAgent.prProcessor()).to.equal(prProcessor);
      expect(await zkAgent.isInitialized()).to.equal(true);
    });

    it("should revert not owner", async () => {
      const { zkAgent, issueProcessor, prProcessor } = await loadFixture(deploy);

      await expect(zkAgent.connect(owner).initialize(issueProcessor, prProcessor)).to.revertedWith("ZKAgent: already initialized");
    });

    it("should revert already initialized", async () => {
      const { zkAgent, issueProcessor, prProcessor } = await loadFixture(deploy);

      await expect(zkAgent.connect(bountyCreator).initialize(issueProcessor, prProcessor)).to.revertedWith("Ownable: caller is not the owner");
    });
  })

  describe("create bounty", () => {
    it("should create bounty", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const creatorAddress = await bountyCreator.getAddress();
      const zkAgentAddress = await zkAgent.getAddress();
      const erc20Address = await testERC20.getAddress();
      const repo = "zkagent/bounty"
      const bountyAmount = 1000;
      const issueNo = 1;

      const bountyId = keccak256(solidityPacked(
        ["string", "uint256"],
        [repo, issueNo]
      ))
      
      const beforeCreatorBalance = await testERC20.balanceOf(creatorAddress);
      const beforeAgentBalance = await testERC20.balanceOf(zkAgentAddress);
      await expect(zkAgent.connect(bountyCreator).createBounty(repo, issueNo, erc20Address, bountyAmount))
        .to.emit(zkAgent, "BountyCreated")
        .withArgs(bountyId, repo, issueNo, bountyAmount, erc20Address, creatorAddress);
      
      const afterCreatorBalance = await testERC20.balanceOf(creatorAddress);
      const afterAgentBalance = await testERC20.balanceOf(zkAgentAddress);

      expect(await zkAgent.bounties(bountyId)).to.deep.equal(
        [
          repo,
          issueNo,
          0,
          bountyAmount, 
          erc20Address,
          creatorAddress,
          false,
          false 
        ]
      );
      expect(beforeCreatorBalance - afterCreatorBalance).to.equal(1_000n);
      expect(afterAgentBalance - beforeAgentBalance).to.equal(1_000n);
    })

    it("should revert duplicate bounty", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const erc20Address = await testERC20.getAddress();
      const repo = "zkagent/bounty"
      const bountyAmount = 1000;
      const issueNo = 1;
      
      await zkAgent.connect(bountyCreator).createBounty(repo, issueNo, erc20Address, bountyAmount);
      await expect(zkAgent.connect(bountyCreator).createBounty(repo, issueNo, erc20Address, bountyAmount))
        .to.revertedWith("ZKAgent: bounty already exists");
    })

    it("should revert creator is blocked", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = await bountyCreator.getAddress();
      const erc20Address = await testERC20.getAddress();
      const repo = "zkagent/bounty"
      const bountyAmount = 1000;
      const issueNo = 1;

      const penaltySlot = keccak256(
        abiCoder.encode(
          ["address", "uint256"],
          [creatorAddress, 8]
        )
      )

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        penaltySlot,
        "0x0000000000000000000000000000000000000000000000000000ffffffffffff",
      ]);

      await expect(zkAgent.connect(bountyCreator).createBounty(repo, issueNo, erc20Address, bountyAmount))
        .to.revertedWith("ZKAgent: issuer is blocked");
    })
  })

  describe("assign bounty", () => {
    it("should assign bounty", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const prNo = 16;
      const bountyId = await createBounty(zkAgent, testERC20);
      const solverAddress = await bountySolver.getAddress();

      const proof = issueProof();

      await expect(zkAgent.connect(bountySolver).assignBounty(proof.a, proof.b, proof.c, proof.signals))
        .to.emit(zkAgent, "BountyAssigned")
        .withArgs(bountyId, prNo, solverAddress);

      const bountyPrNp = (await zkAgent.bounties(bountyId)).prNo;
      expect(bountyPrNp).to.equal(prNo);
    });

    it("should revert bounty not exists", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      const proof = issueProof();

      await expect(zkAgent.assignBounty(proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty not exists");
    });

    it("should revert bounty already solved", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      const proof = issueProof();

      const bountyId = await createBounty(zkAgent, testERC20);
      const creatorAddress = (await bountyCreator.getAddress()).slice(2);
      const zkAgentAddress = await zkAgent.getAddress();
      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x0000000000000000000000ff" + creatorAddress
      ]);

      await expect(zkAgent.assignBounty(proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty already solved");
    })
  })

  describe("solve bounty", () => {
    it("should solve bounty", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const bountyId = await createBounty(zkAgent, testERC20);
      await assignBounty(zkAgent);

      const erc20Address = await testERC20.getAddress();
      const solverAddress = await bountySolver.getAddress();
      const zkAgentAddress = await zkAgent.getAddress();

      const beforeReceiverBalance = await testERC20.balanceOf(bountyReceiver);
      const beforeAgentBalance = await testERC20.balanceOf(zkAgentAddress);
      const proof = prProof();

      await expect(zkAgent.connect(bountySolver).solveBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.emit(zkAgent, "BountySolved")
        .withArgs(bountyId, solverAddress);

      const afterReceiverBalance = await testERC20.balanceOf(bountyReceiver);
      const afterAgentBalance = await testERC20.balanceOf(zkAgentAddress);

      const bounty = await zkAgent.bounties(bountyId);
      const protocolFee = await zkAgent.protocolFeeBalances(erc20Address);
      expect(bounty.solved).to.equal(true);
      expect(beforeAgentBalance - afterAgentBalance).to.equal(990n);
      expect(afterReceiverBalance - beforeReceiverBalance).to.equal(990n);
      expect(protocolFee).to.equal(10n);
    })

    it("should revert bounty not exists", async () => {
      const { zkAgent } = await loadFixture(deploy);
      const proof = prProof();
      const bountyId = getBountyId();

      await expect(zkAgent.solveBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty not exists");
    })

    it("should revert bounty cancelled", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = (await bountyCreator.getAddress()).slice(2);
      const bountyId = await createBounty(zkAgent, testERC20);

      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x00000000000000000000ff00" + creatorAddress
      ]);
      const proof = prProof();

      await expect(zkAgent.solveBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty already cancelled");
    })

    it("should revert bounty already solved", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = (await bountyCreator.getAddress()).slice(2);
      const bountyId = await createBounty(zkAgent, testERC20);

      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x0000000000000000000000ff" + creatorAddress
      ]);
      const proof = prProof();

      await expect(zkAgent.solveBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty already solved");
    })

    it("should revert bounty id mismatch", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = (await bountyCreator.getAddress()).slice(2);
      const bountyId = await createBounty(zkAgent, testERC20);
      await assignBounty(zkAgent);
      const proof = prProof();

      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 1n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ]);

      await expect(zkAgent.solveBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty id mismatch");
    })

    it("should revert prNo mismatch", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const bountyId = await createBounty(zkAgent, testERC20);
      await assignBounty(zkAgent);
      const proof = prProof();

      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 2n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ]);

      await expect(zkAgent.connect(bountySolver).solveBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .revertedWith("ZKAgent: bounty prNo mismatch");
    })
  })

  describe("report bounty", () => {
    it("should report bounty", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const zkAgentAddress = await zkAgent.getAddress();
      const solverAddress = await bountySolver.getAddress();
      const creatorAddress = await bountyCreator.getAddress();
      const bountyId = await createBounty(zkAgent, testERC20);
      await assignBounty(zkAgent);
      const proof = prProof();

      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);
      
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x00000000000000000000ff00" + creatorAddress.slice(2)
      ]);
      await expect(zkAgent.connect(bountySolver).reportBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.emit(zkAgent, "BountyReported")
        .withArgs(bountyId, solverAddress, creatorAddress);
      const timestamp = (await ethers.provider.getBlock("latest"))?.timestamp ?? 0;

      const penaltyTimestamp = await zkAgent.penaltyTimestamp(creatorAddress);
      expect(penaltyTimestamp).to.equal(BigInt(timestamp + 86400));
    });

    it("should revert bounty not exists", async () => {
      const { zkAgent } = await loadFixture(deploy);
      const proof = prProof();

      await expect(zkAgent.connect(bountySolver).reportBounty(0, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty not exists");
    })

    it("should revert bounty not cancelled", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const bountyId = await createBounty(zkAgent, testERC20);
      const proof = prProof();

      await expect(zkAgent.connect(bountySolver).reportBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty not cancelled");
    })

    it("should revert bounty not cancelled", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = await bountyCreator.getAddress();
      const bountyId = await createBounty(zkAgent, testERC20);
      const proof = prProof();

      const bountSlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);
      
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountSlot,
        "0x0000000000000000000000ff" + creatorAddress.slice(2)
      ]);

      await expect(zkAgent.connect(bountySolver).reportBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty not cancelled");
    })

    it("should revert bounty id mismatch", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = await bountyCreator.getAddress();
      const bountyId = await createBounty(zkAgent, testERC20);
      await assignBounty(zkAgent);
      const proof = prProof();

      const bountyIssueSlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 1n).toString(16);

      const bountyCancelledSlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountyIssueSlot,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ]);
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountyCancelledSlot,
        "0x00000000000000000000ff00" + creatorAddress.slice(2)
      ]);

      await expect(zkAgent.reportBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .to.revertedWith("ZKAgent: bounty id mismatch");
    })

    it("should revert prNo mismatch", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = await bountyCreator.getAddress();
      const bountyId = await createBounty(zkAgent, testERC20);
      await assignBounty(zkAgent);
      const proof = prProof();

      const bountyPRSlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 2n).toString(16);
      const bountyCancelledSlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);
      
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountyPRSlot,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ]);
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountyCancelledSlot,
        "0x00000000000000000000ff00" + creatorAddress.slice(2)
      ]);

      await expect(zkAgent.connect(bountySolver).reportBounty(bountyId, proof.a, proof.b, proof.c, proof.signals))
        .revertedWith("ZKAgent: bounty prNo mismatch");
    })
  })

  describe("cancel bounty", () => {
    it("should cancel bounty", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);

      const bountyId = await createBounty(zkAgent, testERC20);
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = await bountyCreator.getAddress();
      
      const beforeCreatorBalance = await testERC20.balanceOf(creatorAddress);
      const beforeAgentBalance = await testERC20.balanceOf(zkAgentAddress);

      await expect(zkAgent.connect(bountyCreator).cancelBounty(bountyId))
        .to.emit(zkAgent, "BountyCancelled")
        .withArgs(bountyId, creatorAddress);

      const afterCreatorBalance = await testERC20.balanceOf(creatorAddress);
      const afterAgentBalance = await testERC20.balanceOf(zkAgentAddress);

      const bounty = await zkAgent.bounties(bountyId);
      expect(bounty.cancelled).to.equal(true);
      expect(beforeAgentBalance - afterAgentBalance).to.equal(1_000n);
      expect(afterCreatorBalance - beforeCreatorBalance).to.equal(1_000n);
    });

    it("should revert bounty not exists", async () => {
      const { zkAgent } = await loadFixture(deploy);
      const bountyId = getBountyId();

      await expect(zkAgent.cancelBounty(bountyId))
        .to.revertedWith("ZKAgent: not issuer");
    })

    it("should revert not creator", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      const bountyId = await createBounty(zkAgent, testERC20);

      await expect(zkAgent.connect(bountySolver).cancelBounty(bountyId))
        .to.revertedWith("ZKAgent: not issuer");
    })

    it("should revert bounty already solved", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      const zkAgentAddress = await zkAgent.getAddress();
      const creatorAddress = (await bountyCreator.getAddress()).slice(2);
      const bountyId = await createBounty(zkAgent, testERC20);

      const bountySlot = "0x" + (BigInt(keccak256(
        abiCoder.encode(
          ["uint256", "uint256"],
          [bountyId, 6]
        )
      )) + 5n).toString(16);

      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        bountySlot,
        "0x0000000000000000000000ff" + creatorAddress
      ]);
      await expect(zkAgent.connect(bountyCreator).cancelBounty(bountyId))
        .to.revertedWith("ZKAgent: bounty already solved");
    })
  });

  describe("governance set functions", () => {
    it("should withdraw protocol fee", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const erc20Address = await testERC20.getAddress();
      const protofolTo = await zkAgent.protocolTo();

      const zkAgentAddress = await zkAgent.getAddress();
      await createBounty(zkAgent, testERC20);
      const protocolFeeSlot = keccak256(
        abiCoder.encode(
          ["address", "uint256"],
          [erc20Address, 7]
        )
      )
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        protocolFeeSlot,
        "0x000000000000000000000000000000000000000000000000000000000000000a",
      ]);

      const beforeProtocolBalance = await testERC20.balanceOf(protofolTo);
      await zkAgent.connect(owner).withdrawProtocolFee(erc20Address);
      const afterProtocolBalance = await testERC20.balanceOf(protofolTo);
      const protocolFee = await zkAgent.protocolFeeBalances(erc20Address);

      expect(afterProtocolBalance - beforeProtocolBalance).to.equal(10n);
      expect(protocolFee).to.equal(0n);
    })

    it("should revert withdraw protocol fee not owner", async () => {
      const { zkAgent, testERC20 } = await loadFixture(deploy);
      
      const erc20Address = await testERC20.getAddress();
      const zkAgentAddress = await zkAgent.getAddress();
      await createBounty(zkAgent, testERC20);
      const protocolFeeSlot = keccak256(
        abiCoder.encode(
          ["address", "uint256"],
          [erc20Address, 7]
        )
      )
      await network.provider.send("hardhat_setStorageAt", [
        zkAgentAddress,
        protocolFeeSlot,
        "0x000000000000000000000000000000000000000000000000000000000000000a",
      ]);

      await expect(zkAgent.connect(bountyCreator).withdrawProtocolFee(erc20Address))
        .to.revertedWith("Ownable: caller is not the owner");
    })

    it("should set issue processor", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const newIssueProcessor = ethers.Wallet.createRandom().address;

      await zkAgent.connect(owner).setIssueProcessor(newIssueProcessor);
      expect(await zkAgent.issueProcessor()).to.equal(newIssueProcessor);
    });

    it("should set pr processor", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const newPRProcessor = ethers.Wallet.createRandom().address;

      await zkAgent.connect(owner).setPRProcessor(newPRProcessor);
      expect(await zkAgent.prProcessor()).to.equal(newPRProcessor);
    });

    it("should set protocol fee", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const newProtocolFee = 200;

      await zkAgent.connect(owner).setProtocolFee(newProtocolFee);
      expect(await zkAgent.protocolFee()).to.equal(newProtocolFee);
    })

    it("should set protocol to", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const newProtocolTo = ethers.Wallet.createRandom().address;

      await zkAgent.connect(owner).setProtocolTo(newProtocolTo);
      expect(await zkAgent.protocolTo()).to.equal(newProtocolTo);
    })

    it("should set penalty period", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const newPenaltyPeriod = 864000;

      await zkAgent.connect(owner).setPenaltyPeriod(newPenaltyPeriod);
      expect(await zkAgent.penaltyPeriod()).to.equal(newPenaltyPeriod);
    })

    it("should revert not owner", async () => {
      const { zkAgent, issueProcessor, prProcessor } = await loadFixture(deploy);

      const randomAddress = ethers.Wallet.createRandom().address;
      const newFee = 200;
      const newPeriod = 864000;

      await expect(zkAgent.connect(bountyCreator).setIssueProcessor(randomAddress)).to.revertedWith("Ownable: caller is not the owner");
      await expect(zkAgent.connect(bountyCreator).setPRProcessor(randomAddress)).to.revertedWith("Ownable: caller is not the owner");
      await expect(zkAgent.connect(bountyCreator).setProtocolFee(newFee)).to.revertedWith("Ownable: caller is not the owner");
      await expect(zkAgent.connect(bountyCreator).setProtocolTo(randomAddress)).to.revertedWith("Ownable: caller is not the owner");
      await expect(zkAgent.connect(bountyCreator).setPenaltyPeriod(newPeriod)).to.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert invalid to address", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const invalidAddress = "0x0000000000000000000000000000000000000000";
      await expect(zkAgent.connect(owner).setProtocolTo(invalidAddress))
        .to.revertedWith("ZKAgent: invalid protocol to address");
    })

    it("should revert invalid protocol fee", async () => {
      const { zkAgent } = await loadFixture(deploy);

      const invalidFee = 1000;
      await expect(zkAgent.connect(owner).setProtocolFee(invalidFee))
        .to.revertedWith("ZKAgent: invalid protocol fee");
    })
  })

})