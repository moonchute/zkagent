// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IPRProcessor {
  struct PRProof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
    uint256[16] signals;
  }

  function processProof(PRProof calldata _proof) external view returns (string memory, uint256, address);
}