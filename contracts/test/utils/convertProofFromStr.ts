

interface IssueProof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
  signals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

interface PRProof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
  signals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

export const convertIssueClosedProofFromStr = (
  a: [string, string],
  b: [[string, string], [string, string]],
  c: [string, string],
  signals: string[]
): IssueProof => {
  const aBN = a.map((el) => BigInt(el)) as IssueProof["a"];
  const bBN = b.map((el) => el.map((el) => BigInt(el))) as IssueProof["b"];
  const cBN = c.map((el) => BigInt(el)) as IssueProof["c"];
  const signalsBN = signals.map((el) => BigInt(el)) as IssueProof["signals"];

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
): PRProof => {
  const aBN = a.map((el) => BigInt(el)) as PRProof["a"];
  const bBN = b.map((el) => el.map((el) => BigInt(el))) as PRProof["b"];
  const cBN = c.map((el) => BigInt(el)) as PRProof["c"];
  const signalsBN = signals.map((el) => BigInt(el)) as PRProof["signals"];

  return {
    a: aBN,
    b: bBN,
    c: cBN,
    signals: signalsBN,
  }
}
