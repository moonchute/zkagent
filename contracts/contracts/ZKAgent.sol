// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IIssueProcessor } from "./interfaces/IIssueProcessor.sol";
import { IPRProcessor } from "./interfaces/IPRProcessor.sol";
import { IZKAgent } from "./interfaces/IZKAgent.sol";

contract ZKAgent is IZKAgent, Ownable {

    uint256 public constant MAX_PROTOCOL_FEE = 500; // 5%
    IIssueProcessor public issueProcessor;
    IPRProcessor public prProcessor;
    uint256 public penaltyPeriod;
    uint256 public protocolFee;
    address public protocolTo;

    mapping (uint256 => Bounty) public bounties;
    mapping (address => uint256) public protocolFeeBalances;
    mapping (address => uint256) public penaltyTimestamp;

    bool public isInitialized;

    constructor (
        uint256 _protocolFee,
        uint256 _penaltyPeriod,
        address _owner
    ) Ownable() {
        protocolFee = _protocolFee;
        penaltyPeriod = _penaltyPeriod;

        protocolTo = _owner;
        _transferOwnership(_owner);
    }

    function initialize(
        IIssueProcessor _issueProcessor,
        IPRProcessor _prProcessor
    ) external onlyOwner {
        require(!isInitialized, "ZKAgent: already initialized");
        issueProcessor = _issueProcessor;
        prProcessor = _prProcessor;
        isInitialized = true;
    }

    /* ============ External Functions ============ */
  
    function createBounty(
        string memory _repo, 
        uint256 _issueNo, 
        address _rewardToken, 
        uint256 _rewardAmount
    ) external override {
        uint256 bountyId = uint256(keccak256(abi.encodePacked(_repo, _issueNo)));
        require(penaltyTimestamp[msg.sender] < block.timestamp, "ZKAgent: issuer is blocked");
        require(bounties[bountyId].issuer == address(0), "ZKAgent: bounty already exists");

        bounties[bountyId] = Bounty({
            repo: _repo,
            issueNo: _issueNo,
            prNo: 0,
            rewardAmount: _rewardAmount,
            rewardToken: _rewardToken,
            issuer: msg.sender,
            solved: false,
            cancelled: false
        });
        IERC20(_rewardToken).transferFrom(msg.sender, address(this), _rewardAmount);

        emit BountyCreated(bountyId, _repo, _issueNo, _rewardAmount, _rewardToken, msg.sender);
    }

    function assignBounty(
        uint256[2] calldata _a, 
        uint256[2][2] calldata _b, 
        uint256[2] calldata _c, 
        uint256[17] calldata _signals
    ) external override {
        (
            uint256 bountyId,
            uint256 prNo
        ) = _verifyIssueProof(_a, _b, _c, _signals);

        bounties[bountyId].prNo = prNo;

        emit BountyAssigned(bountyId, prNo, msg.sender);
    }

    function solveBounty(
        uint256 _bountyId,
        uint256[2] calldata _a,
        uint256[2][2] calldata _b,
        uint256[2] calldata _c,
        uint256[16] calldata _signals
    ) external override {
        Bounty memory bounty = bounties[_bountyId];
        require(bounty.issuer != address(0), "ZKAgent: bounty not exists");
        require(!bounty.cancelled, "ZKAgent: bounty already cancelled"); 
        require(!bounty.solved, "ZKAgent: bounty already solved");

        address toAddress = _verifyPRProof(_a, _b, _c, _signals, _bountyId, bounty);

        bounties[_bountyId].solved = true;
        uint256 protocolFeeAmount = bounty.rewardAmount * protocolFee / 10000;
        uint256 bountyRewardAmount = bounty.rewardAmount - protocolFeeAmount;

        protocolFeeBalances[bounty.rewardToken] += protocolFeeAmount;
        IERC20(bounty.rewardToken).transfer(toAddress, bountyRewardAmount);

        emit BountySolved(_bountyId, msg.sender);
    }

    function reportBounty(
        uint256 _bountyId,
        uint256[2] calldata _a,
        uint256[2][2] calldata _b,
        uint256[2] calldata _c,
        uint256[16] calldata _signals
    ) external override {
        Bounty memory bounty = bounties[_bountyId];
        require(bounty.issuer != address(0), "ZKAgent: bounty not exists");
        require(bounty.cancelled && !bounty.solved, "ZKAgent: bounty not cancelled");

        _verifyPRProof(_a, _b, _c, _signals, _bountyId, bounty);

        penaltyTimestamp[bounty.issuer] = block.timestamp + penaltyPeriod;

        emit BountyReported(_bountyId, msg.sender, bounty.issuer);
    }

    function cancelBounty(
        uint256 _bountyId
    ) external override {
        Bounty memory bounty = bounties[_bountyId];
        require(bounty.issuer == msg.sender, "ZKAgent: not issuer");
        require(!bounty.solved, "ZKAgent: bounty already solved");

        bounties[_bountyId].cancelled = true;
        IERC20(bounty.rewardToken).transfer(msg.sender, bounty.rewardAmount);

        emit BountyCancelled(_bountyId, msg.sender);
    }

    /* ============ Governance Functions ============ */

    function withdrawProtocolFee(address token) external override onlyOwner {
        uint256 amount = protocolFeeBalances[token];
        protocolFeeBalances[token] = 0;

        IERC20(token).transfer(protocolTo, amount);
    }

    function setIssueProcessor(address _issueProcessor) external override onlyOwner {
        issueProcessor = IIssueProcessor(_issueProcessor);
    }

    function setPRProcessor(address _prProcessor) external override onlyOwner {
        prProcessor = IPRProcessor(_prProcessor);
    }

    function setProtocolFee(uint256 _protocolFee) external override onlyOwner {
        require(_protocolFee <= MAX_PROTOCOL_FEE, "ZKAgent: invalid protocol fee");

        protocolFee = _protocolFee;
    }

    function setProtocolTo(address _to) external override onlyOwner {
        require(_to != address(0), "ZKAgent: invalid protocol to address");

        protocolTo = _to;
    }

    function setPenaltyPeriod(uint256 _penaltyPeriod) external override onlyOwner {
        penaltyPeriod = _penaltyPeriod;
    }

    /* ============ External View Functions ============ */

    function getBounty(uint256 _bountyId) external view override returns (Bounty memory) {
        return bounties[_bountyId];
    }

    /* ============ Internal Functions ============ */

    function _verifyIssueProof(
        uint256[2] calldata _a, 
        uint256[2][2] calldata _b, 
        uint256[2] calldata _c, 
        uint256[17] calldata _signals
    ) internal 
      view
      returns (uint256, uint256)
    {
        (
            string memory repo, 
            uint256 issueNo,
            uint256 prNo
        ) = IIssueProcessor(issueProcessor).processProof(
            IIssueProcessor.IssueProof({
                a: _a,
                b: _b,
                c: _c,
                signals: _signals
            })
        );
        uint256 bountyId = uint256(keccak256(abi.encodePacked(repo, issueNo)));

        Bounty storage bounty = bounties[bountyId];
        require(bounty.issuer != address(0), "ZKAgent: bounty not exists");
        require(!bounty.solved, "ZKAgent: bounty already solved");

        return (bountyId, prNo);
    }

    function _verifyPRProof(
        uint256[2] calldata _a, 
        uint256[2][2] calldata _b, 
        uint256[2] calldata _c, 
        uint256[16] calldata _signals,
        uint256 _bountyId,
        Bounty memory _bounty
    ) internal
      view
      returns (address)
    {
        (
            string memory repo, 
            uint256 prNo,
            address toAddress
        ) = IPRProcessor(prProcessor).processProof(
            IPRProcessor.PRProof({
                a: _a,
                b: _b,
                c: _c,
                signals: _signals
            })
        );
        require(_bountyId == uint256(keccak256(abi.encodePacked(repo, _bounty.issueNo))), "ZKAgent: bounty id mismatch");
        require(_bounty.prNo == prNo, "ZKAgent: bounty prNo mismatch");

        return toAddress;
    }
}