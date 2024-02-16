

interface IssueProofA {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
  signals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

interface IssueProofB {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
  signals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

export const convertIssueClosedProofFromStr = (
  a: [string, string],
  b: [[string, string], [string, string]],
  c: [string, string],
  signals: string[]
): IssueProofA => {
  const aBN = a.map((el) => BigInt(el)) as IssueProofA["a"];
  const bBN = b.map((el) => el.map((el) => BigInt(el))) as IssueProofA["b"];
  const cBN = c.map((el) => BigInt(el)) as IssueProofA["c"];
  const signalsBN = signals.map((el) => BigInt(el)) as IssueProofA["signals"];

  return {
    a: aBN,
    b: bBN,
    c: cBN,
    signals: signalsBN,
  }
}

export const convertPRClosedProofFromStr = (
  a: [string, string],
  b: [[string, string], [string, string]],
  c: [string, string],
  signals: string[]
): IssueProofB => {
  const aBN = a.map((el) => BigInt(el)) as IssueProofB["a"];
  const bBN = b.map((el) => el.map((el) => BigInt(el))) as IssueProofB["b"];
  const cBN = c.map((el) => BigInt(el)) as IssueProofB["c"];
  const signalsBN = signals.map((el) => BigInt(el)) as IssueProofB["signals"];

  return {
    a: aBN,
    b: bBN,
    c: cBN,
    signals: signalsBN,
  }
}
