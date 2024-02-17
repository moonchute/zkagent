// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IZKAgent {
    struct Bounty {
      string repo;
      uint256 issueNo;
      uint256 prNo;
      uint256 rewardAmount;
      address rewardToken;
      address issuer;
      bool solved;
      bool cancelled;
    }

    event BountyCreated(
      uint256 bountyId,
      string indexed repo,
      uint256 indexed issueNo,
      uint256 rewardAmount,
      address rewardToken,
      address indexed issuer
    );

    event BountyAssigned(
      uint256 indexed bountyId,
      uint256 indexed prNo,
      address indexed assigner
    );

    event BountySolved(
      uint256 indexed bountyId,
      address indexed solver
    );

    event BountyReported(
      uint256 indexed bountyId,
      address indexed reporter,
      address indexed bountyIssuer
    );

    event BountyCancelled(
      uint256 indexed bountyId,
      address indexed issuer
    );

    function createBounty(
      string memory _repo,
      uint256 _issueNo,
      address _rewardToken,
      uint256 _rewardAmount
    ) external; 

    function assignBounty(
      uint256[2] calldata _a,
      uint256[2][2] calldata _b,
      uint256[2] calldata _c,
      uint256[17] calldata _signals
    ) external;

    function solveBounty(
      uint256 _bountyId,
      uint256[2] calldata _a,
      uint256[2][2] calldata _b,
      uint256[2] calldata _c,
      uint256[16] calldata _signals
    ) external;

    function reportBounty(
      uint256 _bountyId,
      uint256[2] calldata _a,
      uint256[2][2] calldata _b,
      uint256[2] calldata _c,
      uint256[16] calldata _signals
    ) external;

    function cancelBounty(
      uint256 _bountyId
    ) external;

    function withdrawProtocolFee(address token) external;

    function setIssueProcessor(address _issueProcessor) external;

    function setPRProcessor(address _prProcessor) external;

    function setProtocolFee(uint256 _protocolFee) external;

    function setProtocolTo(address _to) external;

    function setPenaltyPeriod(uint256 _penaltyPeriod) external;

    function getBounty(uint256 _bountyId) external view returns (Bounty memory);    
}