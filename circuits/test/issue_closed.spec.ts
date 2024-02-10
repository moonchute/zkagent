import path from "path";
import { F1Field, Scalar } from "ffjavascript";

export const p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(p);

const wasm_tester = require("circom_tester").wasm;

describe("Issue closed", function () {
  let cir;

  function textToAsciiArray(text: string): string[] {
    return Array.from(text).map(char => char.charCodeAt(0).toString());
  }

  beforeAll(async () => {
    cir = await wasm_tester(
      path.join(__dirname, "../../../circuits/issue_closed.circom"),
      {
        include: path.join(__dirname, "../../node_modules"),
        output: path.join(__dirname, "../../build"),
        recompile: false,
        verbose: true
      }
    )
  })

  it("Should generate witness", async () => {
    
  })
})