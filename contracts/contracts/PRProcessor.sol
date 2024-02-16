// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { StringUtils } from "@zk-email/contracts/utils/StringUtils.sol";

import { BaseProcessorV2 } from "./processors/BaseProcessorV2.sol";
import { Groth16Verifier } from "./verifiers/pr_merged_verifier.sol";
import { IKeyHashAdapterV2 } from "./processors/keyHashAdapters/IKeyHashAdapterV2.sol";
import { IPRProcessor } from "./interfaces/IPRProcessor.sol";
import "hardhat/console.sol";

contract PRProcessor is Groth16Verifier, IPRProcessor, BaseProcessorV2 {
    using StringUtils for uint256[];
    using StringUtils for string;

    /* ============ Constants ============ */
    uint256 constant public PACK_SIZE = 7;

    /* ============ Constructor ============ */
    constructor(
        address _agent,
        IKeyHashAdapterV2 _mailserverKeyHashAdapter,
        string memory _emailFromAddress
    ) 
      Groth16Verifier()
      BaseProcessorV2(
          _agent,
          _mailserverKeyHashAdapter,
          _emailFromAddress
      ) 
    {}

    /* ============ External Functions ============ */
    function processProof(
        IPRProcessor.PRProof calldata _proof
    ) public view override onlyAgent returns (string memory repo, uint256 prNum, address toAddress) {
        require(
            this.verifyProof(_proof.a, _proof.b, _proof.c, _proof.signals),
            "Proof verification failed"
        );

        // require(isMailServerKeyHash(bytes32(_proof.signals[0])), "Invalid mailserver key hash");
        
        string memory fromEmail = _parseSignalArray(_proof.signals, 1, 5);
        require(keccak256(abi.encodePacked(fromEmail)) == keccak256(emailFromAddress), "Invalid email from address");

        repo = _parseSignalArray(_proof.signals, 5, 13);
        prNum = _parseSignalArray(_proof.signals, 13, 15).stringToUint();
        toAddress = address(uint160(_proof.signals[15]));
    }

    /* ============ Internal Functions ============ */
    function _parseSignalArray(uint256[16] calldata _signals, uint8 _from, uint8 _to) internal pure returns (string memory) {
        uint256[] memory signalArray = new uint256[](_to - _from);
        for (uint256 i = _from; i < _to; i++) {
            signalArray[i - _from] = _signals[i];
        }

        return signalArray.convertPackedBytesToString(signalArray.length * PACK_SIZE, PACK_SIZE);
    }
}