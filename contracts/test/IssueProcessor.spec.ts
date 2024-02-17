import { ethers } from "hardhat"
import { issueProof } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { Signer } from "ethers";

describe("IssueProcessor", () => {
  let owner: Signer;
  let attacker: Signer;

  const deploy = async () => {
    const [,,agent] = await ethers.getSigners();
    const ManagedKeyHashAdapterV2 = await ethers.getContractFactory("ManagedKeyHashAdapterV2");
    const IssueProcessor = await ethers.getContractFactory("IssueProcessor");

    const mailServerKayHashAdapter = await ManagedKeyHashAdapterV2.deploy([]);
    const issueProcessor = await IssueProcessor.deploy(agent.address, mailServerKayHashAdapter.getAddress(), "notifications@github.com");

    return { mailServerKayHashAdapter, issueProcessor, agent}
  }

  before(async () => {
    [owner, attacker] = await ethers.getSigners();
  })

  it("should submit valid proof", async () => {
    const { issueProcessor, agent } = await loadFixture(deploy);

    const ret = await (issueProcessor.connect(agent) as any).processProof(issueProof());
    expect(ret[0]).to.equal("jstinhw/zk-grant-testing");
    expect(ret[1]).to.equal(15n);
    expect(ret[2]).to.equal(16n);
  });

  it("should revert with invalid proof", async () => {
    const { issueProcessor, agent } = await loadFixture(deploy);

    const invalidProof = issueProof();
    invalidProof.a[0] = 0n;

    await expect((issueProcessor.connect(agent) as any).processProof(invalidProof)).to.revertedWith("Proof verification failed");
  });

  it("should revert if not agent", async () => {
    const { issueProcessor, agent } = await loadFixture(deploy);

    await expect((issueProcessor.connect(attacker) as any).processProof(issueProof())).to.revertedWith("Only Agent can call this function");
  });

})