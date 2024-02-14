import path from "path";
import { F1Field, Scalar } from "ffjavascript";
import fs from "fs";

export const p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(p);

const wasm_tester = require("circom_tester").wasm;

describe("Issue closed", function () {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes
  let cir;

  function textToAsciiArray(text: string): string[] {
    return Array.from(text).map(char => char.charCodeAt(0).toString());
  }

  beforeAll(async () => {
    cir = await wasm_tester(
      path.join(__dirname, "../circuits/issue_closed.circom"),
      {
        include: path.join(__dirname, "../node_modules"),
        output: path.join(__dirname, "../build"),
        recompile: false,
        verbose: true
      }
    )
  })

  it("Should generate witness", async () => {
    const input = JSON.parse(fs.readFileSync(`input/input.json`, "utf-8"));

    const witness = await cir.calculateWitness(
      input,
      true
    );

    await cir.checkConstraints(witness);
    // expect(Fr.eq(Fr.e(witness[0]), Fr.e(1))).toBe(true);
    // expect(Fr.eq(Fr.e(witness[1]), Fr.e(1))).toBe(true);
  })
})