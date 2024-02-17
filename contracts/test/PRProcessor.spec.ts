import { ethers } from "hardhat"
import { expect } from "chai";
import { prProof } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { Signer } from "ethers";

describe("PRProcessor", () => {
  let owner: Signer;
  let attacker: Signer;

  const deploy = async () => {
    const [,,agent] = await ethers.getSigners();
    const ManagedKeyHashAdapterV2 = await ethers.getContractFactory("ManagedKeyHashAdapterV2");
    const PRProcessor = await ethers.getContractFactory("PRProcessor");

    const mailServerKayHashAdapter = await ManagedKeyHashAdapterV2.deploy([]);
    const prProcessor = await PRProcessor.deploy(agent, mailServerKayHashAdapter.getAddress(), "notifications@github.com");

    return { mailServerKayHashAdapter, prProcessor, agent }
  }

  before(async () => {
    [owner, attacker] = await ethers.getSigners();
  })

  it("should submit valid proof", async () => {
    const { prProcessor, agent } = await loadFixture(deploy);

    const ret = await (prProcessor.connect(agent) as any).processProof(prProof());
    expect(ret[0]).to.equal("jstinhw/zk-grant-testing");
    expect(ret[1]).to.equal(16n);
    expect(ret[2]).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });

  it("should revert with invalid proof", async () => {
    const { prProcessor, agent } = await loadFixture(deploy);

    const invalidProof = prProof();
    invalidProof.a[0] = 0n;

    await expect((prProcessor.connect(agent) as any).processProof(invalidProof)).to.revertedWith("Proof verification failed");
  });

  it("should revert if not agent", async () => {
    const { prProcessor, agent } = await loadFixture(deploy);

    await expect((prProcessor.connect(attacker) as any).processProof(prProof())).to.revertedWith("Only Agent can call this function");
  });
})