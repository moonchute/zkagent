//SPDX-License-Identifier: MIT

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { IKeyHashAdapterV2 } from "./keyHashAdapters/IKeyHashAdapterV2.sol";

pragma solidity ^0.8.18;

contract BaseProcessorV2 is Ownable {

    /* ============ Modifiers ============ */
    modifier onlyAgent() {
        require(msg.sender == agent, "Only Agent can call this function");
        _;
    }

    /* ============ State Variables ============ */
    address public immutable agent;
    IKeyHashAdapterV2 public mailServerKeyHashAdapter;
    bytes public emailFromAddress;

    /* ============ Constructor ============ */
    constructor(
        address _agent,
        IKeyHashAdapterV2 _mailServerKeyHashAdapter,
        string memory _emailFromAddress
    )
        Ownable()
    {
        agent = _agent;
        mailServerKeyHashAdapter = _mailServerKeyHashAdapter;
        emailFromAddress = bytes(_emailFromAddress);
    }

    /* ============ External Functions ============ */

    function setMailserverKeyHashAdapter(IKeyHashAdapterV2 _mailServerKeyHashAdapter) external onlyOwner {
        mailServerKeyHashAdapter = _mailServerKeyHashAdapter;
    }

    /**
     * @notice ONLY OWNER: Sets the from email address for validated emails. Check that email address is properly
     * padded (if necessary). Padding will be dependent on if unpacking functions cut trailing 0s or not.
     *
     * @param _emailFromAddress    The from email address for validated emails, MUST BE PROPERLY PADDED
     */
    function setEmailFromAddress(string memory _emailFromAddress) external onlyOwner {
        emailFromAddress = bytes(_emailFromAddress);
    }


    /* ============ External Getters ============ */

    function getEmailFromAddress() external view returns (bytes memory) {
        return emailFromAddress;
    }

    function isMailServerKeyHash(bytes32 _keyHash) public view returns (bool) {
        return IKeyHashAdapterV2(mailServerKeyHashAdapter).isMailServerKeyHash(_keyHash);
    }
}
