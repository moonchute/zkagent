import path from "path";
import { F1Field, Scalar } from "ffjavascript";
import fs from "fs";

export const p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(p);

const wasm_tester = require("circom_tester").wasm;

describe("PR merged", function () {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes
  let cir;

  beforeAll(async () => {
    cir = await wasm_tester(
      path.join(__dirname, "../circuits/pr_merged.circom"),
      {
        include: path.join(__dirname, "../node_modules"),
        output: path.join(__dirname, "../build"),
        recompile: false,
        verbose: true
      }
    )
  })

  it("Should generate witness", async () => {
    const input = JSON.parse(fs.readFileSync(`input/pr.json`, "utf-8"));

    const witness = await cir.calculateWitness(
      input,
      true
    );

    await cir.checkConstraints(witness);
  })
})