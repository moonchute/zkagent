import path from "path";
import { F1Field, Scalar } from "ffjavascript";

export const p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(p);

const wasm_tester = require("circom_tester").wasm;

describe("A regex", function () {
  let cir;

  function textToAsciiArray(text: string): string[] {
    return Array.from(text).map(char => char.charCodeAt(0).toString());
  }

  beforeAll(async () => {
    cir = await wasm_tester(
      path.join(__dirname, "../mocks/regexes/test_issue.circom"),
      {
        include: path.join(__dirname, "../../node_modules"),
        output: path.join(__dirname, "../../build/test_issue"),
        recompile: true,
        verbose: true
      }
    )
  })

  it("Should generate witness", async () => {
    const input = {
      "msg": textToAsciiArray("Closed #15 as completed via #16.")
    };
    const expectedIssueNumValue = Array(textToAsciiArray("Closed #").length).fill("0")
      .concat(textToAsciiArray("15"))
      .concat(Array(textToAsciiArray(" as completed via #").length).fill("0"))
      .concat(Array(textToAsciiArray("16.").length).fill("0"));
    
    const expectedPRNumValue = Array(textToAsciiArray("Closed #").length).fill("0")
      .concat(Array(textToAsciiArray("15").length).fill("0"))
      .concat(Array(textToAsciiArray(" as completed via #").length).fill("0"))
      .concat(textToAsciiArray("16"))
      .concat(Array(textToAsciiArray(".").length).fill("0"));

    const witness = await cir.calculateWitness(
      input,
      true
    );
    const issueNumResult = witness.slice(2, input.msg.length + 2);
    const prNumResult = witness.slice(2 + input.msg.length, input.msg.length * 2 + 2);

    await cir.checkConstraints(witness);

    expect(Fr.eq(Fr.e(witness[0]), Fr.e(1))).toBe(true);
    expect(Fr.eq(Fr.e(witness[1]), Fr.e(1))).toBe(true);
    expect(JSON.stringify(expectedIssueNumValue)).toBe(JSON.stringify(issueNumResult));
    expect(JSON.stringify(expectedPRNumValue)).toBe(JSON.stringify(prNumResult));
  })
})