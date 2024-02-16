// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IIssueProcessor {
  struct IssueProof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
    uint256[17] signals;
  }

  function processProof(IssueProof calldata _proof) external view returns (string memory, uint256, uint256);
}