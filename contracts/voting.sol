// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
        string avatarIpfsHash;
        string program;
    }

    address public owner;
    bool public votingOpen;
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    uint256 public votingEndedAt;

    constructor() {
        owner = msg.sender;
        votingOpen = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier whenVotingOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

    function startVoting() public onlyOwner {
        require(!votingOpen, "Voting is already open");
        votingOpen = true;
    }

    function addCandidate(
        string memory name,
        string memory avatarIpfsHash,
        string memory program
    ) public onlyOwner {
        candidates.push(Candidate(name, 0, avatarIpfsHash, program));
    }

    function vote(uint256 candidateIndex) public whenVotingOpen {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateIndex < candidates.length, "Invalid candidate index");

        candidates[candidateIndex].voteCount += 1;
        hasVoted[msg.sender] = true;
    }

    function endVoting() public onlyOwner {
        require(votingOpen, "Voting is already closed");
        votingOpen = false;
        votingEndedAt = block.timestamp;
    }

    function getWinner() public view returns (string memory winnerName, uint256 winnerVoteCount) {
        require(!votingOpen, "Voting is still open");

        uint256 winningVoteCount = 0;
        uint256 winningIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningIndex = i;
            }
        }

        winnerName = candidates[winningIndex].name;
        winnerVoteCount = candidates[winningIndex].voteCount;
    }

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 index) public view returns (
        string memory name,
        uint256 voteCount,
        string memory avatarIpfsHash,
        string memory program
    ) {
        require(index < candidates.length, "Invalid candidate index");
        Candidate storage candidate = candidates[index];
        return (
            candidate.name,
            candidate.voteCount,
            candidate.avatarIpfsHash,
            candidate.program
        );
    }

    function getVotingEndedAt() public view returns (uint256) {
        return votingEndedAt;
    }
}
