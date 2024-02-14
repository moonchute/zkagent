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
      path.join(__dirname, "../mocks/regexes/test_from.circom"),
      {
        include: path.join(__dirname, "../../node_modules"),
        output: path.join(__dirname, "../../build/test_from"),
        recompile: true,
        verbose: true
      }
    )
  })

  it("Should generate witness", async () => {
    const input = {
      "msg": textToAsciiArray("from:jhw <notifications@github.com>\r\n")
    };
    const expectedValue = Array(textToAsciiArray("from:jhw <").length).fill("0")
      .concat(textToAsciiArray("notifications@github.com"))
      .concat(Array(textToAsciiArray(">\r\n").length).fill("0"))

    const witness = await cir.calculateWitness(
      input,
      true
    );
    const result = witness.slice(2, input.msg.length + 2);
    await cir.checkConstraints(witness);

    expect(Fr.eq(Fr.e(witness[0]), Fr.e(1))).toBe(true);
    expect(Fr.eq(Fr.e(witness[1]), Fr.e(1))).toBe(true);
    expect(JSON.stringify(expectedValue)).toBe(JSON.stringify(result));
  })
})