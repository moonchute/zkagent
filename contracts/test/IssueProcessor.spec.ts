import { ethers } from "hardhat"
import { convertIssueClosedProofFromStr } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("IssueProcessor", () => {
  let owner;
  let attacker;

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

    const proof = convertIssueClosedProofFromStr(
      ["0x0b64c5df9db3a5df90dbc273a04a877f0fd88e3cdaf42dd6d01dfe5882a67896", "0x068568a3069c22a189f9ae81e7d0d6ae9a64f40bd3f7c177295318524bd15fe9"],
      [
        [
          "0x14500e3fcb51f7baf05a1d86ecf7aefb76006a0248e6c1bb8db5da954f34008f",
          "0x0617eb45192aaabf1ac675b9ff8157524fb5955c9866103fd87a8933f3eaa5bd"
        ],
        [
          "0x0628f0b382dc8b3f238405f5b375bbfc807b762c02fa8d0b286e6694b3e38186",
          "0x17d6208104d8cf55c99ba689fd4c415cc2003036cdbabfead3e44d2b87b431bd"
        ],
      ],
      ["0x119c5e1338b89f976337b89d3dbc47d5dda8e97a9c1876fb1295f7b72ae510ad", "0x1f50906de74e3efbe1e44510b054661fff9ce6ac5211a1f60d5b860cb7397f52"],
      [
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
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000003531",
        "0x0000000000000000000000000000000000000000000000000000000000003631"
      ]
    )

    const ret = await (issueProcessor.connect(agent) as any).processProof(proof);
    console.log(ret)
  });

})