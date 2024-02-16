import { ethers } from "hardhat"
import { convertPRClosedProofFromStr } from "./utils";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("PRProcessor", () => {
  let owner;
  let attacker;

  const deploy = async () => {
    const [,,agent] = await ethers.getSigners();
    const ManagedKeyHashAdapterV2 = await ethers.getContractFactory("ManagedKeyHashAdapterV2");
    const PRProcessor = await ethers.getContractFactory("PRProcessor");

    const mailServerKayHashAdapter = await ManagedKeyHashAdapterV2.deploy([]);
    const prProcessor = await PRProcessor.deploy(agent.address, mailServerKayHashAdapter.getAddress(), "notifications@github.com");

    return { mailServerKayHashAdapter, prProcessor, agent}
  }

  before(async () => {
    [owner, attacker] = await ethers.getSigners();
  })

  it("should submit valid proof", async () => {
    const { prProcessor, agent } = await loadFixture(deploy);

    const proof = convertPRClosedProofFromStr(
      [
        "0x2b2e9f01c806ab953fe8d03277526b74b744cb84fbfdc8e2b4981c879bf7549d", 
        "0x0099c664a3ad8d06fb44d2a0a80601e4fa1d18fc0f40cd6bc4bd0919b4e48bee"
      ],
      [
        ["0x09a2dcfdd8db7b9ecfcffe48406051ab400a9b8f8b340e4d20d2b4e0ae5da8fa", "0x299755142d4396655ddfd4119052ad8e0d96e890f429e0e4555fd122ed025889"],
        ["0x256f74771938ebeae5ef68a9ac1bdf6e3eaa415b26aa521722c83c1b151712f6", "0x21860b7aeab4dcea94b671c4852114fa07e00fba5a4564b698356d1c6853e2f1"]
      ],
      [
        "0x1db36ec72e3093c0bb759d97b55976141d1408cd62695c02a4142a02d062cf7f", 
        "0x12d488715fa1795b23afe2d449d88586f7bf0f55f315dd5c194b891fbbdbe06b"
      ],
      [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000063696669746f6e",
        "0x0000000000000000000000000000000000000000000000000040736e6f697461",
        "0x000000000000000000000000000000000000000000000000002e627568746967",
        "0x00000000000000000000000000000000000000000000000000000000006d6f63",
        "0x0000000000000000000000000000000000000000000000000077686e6974736a",
        "0x000000000000000000000000000000000000000000000000006172672d6b7a2f",
        "0x00000000000000000000000000000000000000000000000000747365742d746e",
        "0x0000000000000000000000000000000000000000000000000000000000676e69",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000003631",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"
      ]
    )

    const ret = await (prProcessor.connect(agent) as any).processProof(proof);
    expect(ret[0]).to.equal("jstinhw/zk-grant-testing");
    expect(ret[1]).to.equal(16n);
    expect(ret[2]).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });
})