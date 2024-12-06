
# Blockchain Voting System

This voting system is implemented using a Solidity smart contract on the Ethereum blockchain. It allows an owner to create a list of candidates with their avatars and program descriptions stored on IPFS. Participants can cast their votes securely, with each vote being recorded immutably on the blockchain. This project demonstrates a secure, transparent, and immutable voting process without relying on a central authority. Ideal for educational and experimental purposes.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Smart Contract Details](#smart-contract-details)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Overview

This voting system is implemented using a Solidity smart contract on the Ethereum blockchain. Participants cast their votes securely and anonymously, with all votes being recorded immutably on the blockchain. This project serves as a simple example of how blockchain technology can facilitate trustless voting.

Candidate avatars are stored in IPFS (InterPlanetary File System) for decentralized and efficient access. Each candidate's avatar is referenced by an IPFS hash, ensuring that avatar data is distributed and accessible.

## Features

- **Decentralized Voting**: Votes are cast and counted on a blockchain, eliminating the need for central oversight.
- **Transparency and Immutability**: All votes are public and cannot be altered after submission.
- **IPFS-Hosted Avatars**: Candidate avatars are stored on IPFS for decentralized access.
- **Flexible Voting Periods**: The voting period can be specified during contract deployment.
- **Winner Determination**: The contract provides a way to retrieve the winner after voting ends.

## Requirements

- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (for managing packages)
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [Solidity](https://docs.soliditylang.org/) - Smart contract language
- [IPFS](https://ipfs.io/) - For storing candidate avatars

## Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/SergeiBazunov/VotingDApp.git
   cd VotingDApp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Hardhat**
   Initialize Hardhat in the project directory:
   ```bash
   npx hardhat
   ```

4. **Compile the Contract**
   ```bash
   npx hardhat compile
   ```

5. **Deploy the Contract**
   Deploy the contract locally:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

   For deploying on a test network (e.g., Rinkeby or Goerli), configure the network in `hardhat.config.js`.

## Smart Contract Details

The `Voting.sol` contract allows an owner to create a list of candidates and manage a voting period. Each candidate can have an avatar stored on IPFS, referenced by their IPFS hash. Voters can:
- Cast one vote for their chosen candidate.
- View the results after the voting period ends.

### Key Functions

- **`addCandidate(string memory name, string memory avatarIpfsHash, string memory program)`**: Adds a candidate to the voting list with associated avatar and program information stored on IPFS (restricted to the contract owner).
- **`startVoting()`**: Starts the voting period.
- **`vote(uint256 candidateIndex)`**: Allows a participant to cast one vote for a specific candidate.
- **`endVoting()`**: Ends the voting period and records the end timestamp.
- **`getWinner()`**: Returns the winner's name and vote count after voting ends.
- **`getCandidate(uint256 index)`**: Retrieves candidate information including avatar IPFS hash and program.
- **`getVotingEndedAt()`**: Returns the timestamp of when the voting ended.

## Usage

1. **Add Candidates**  
   The contract owner can add candidates with associated IPFS-stored avatars and program descriptions.

2. **Start Voting**  
   The contract owner can initiate the voting period.

3. **Cast Votes**  
   Registered participants can cast one vote each for their chosen candidate.

4. **End Voting and View Results**  
  After voting ends, the owner can end the voting period, and anyone can view the winner.

## Frontend Setup

This project includes a frontend built with **React** to interact with the blockchain voting contract.

1. **Voting Contract Address**:  
   Set the address of your deployed contract in a configuration file (e.g., `.env` or directly in the code):
   
   ```javascript
   const VOTING_CONTRACT_ADDRESS = "your_contract_address_here";
   ```

2. **ABI Import**:
Import the contract's ABI in your frontend to enable interaction with the contract’s functions:

   ```javascript
   import VotingABI from "./VotingABI.json";
   ```

2. **Node.js and npm**:
Ensure Node.js and npm are installed. Run the following commands to set up and start the React application:

   ```bash
   npm start
   ```

## Contributing

We welcome contributions! Please submit a pull request or open an issue for feedback or questions.

## License

This project is licensed under the MIT License.

## Author

**Sergei Bazunov**

- GitHub: [SergeiBazunov](https://github.com/SergeiBazunov)
- Email: [bazunovsergei01@gmail.com](mailto:bazunovsergei01@gmail.com)