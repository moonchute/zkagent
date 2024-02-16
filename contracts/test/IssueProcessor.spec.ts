import { ethers } from "hardhat"
import { convertIssueClosedProofFromStr } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";

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
      [
        "0x280c1fd4462537e6fb9852479da9f8f2b42b5061db00732da44811e0c0123bc0", 
        "0x0a922851acaa437ecb0c0a253afc78187034f198dc1536ceed18379bb291cd0e"
      ],
      [
        ["0x2c86855d7171dfcd72344d16101cdf4f7906dd77f409a67913f2c798750c87ba", "0x0e24fbd46cf9dd16c3ef029e0bc3af07f20312ace2fce9e24179704b660b70b3"],
        ["0x2d3f1f14b0cd8ccbffa641bfe27fb29d214fb2262b368c63feb8e8411ac62b09", "0x2ab3b1d89e0a9caa51572ff532576d2a9f1edde2d302f42ca403ea90eaa120a0"]
      ],
      [
        "0x0d9d3aa0dc6bbd0eba763a7e505cca72d023fcd3424031682b079866a68d23a6", 
        "0x0b7cc398197519f78fefa731e56f2a52841415f8a62cb220642a30232f998175"
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
        "0x0000000000000000000000000000000000000000000000000000000000003531",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000003631",
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ]
    )

    const ret = await (issueProcessor.connect(agent) as any).processProof(proof);
    expect(ret[0]).to.equal("jstinhw/zk-grant-testing");
    expect(ret[1]).to.equal(15n);
    expect(ret[2]).to.equal(16n);
  });

})