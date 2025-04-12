# Are You Basic? - Blockchain Q&A Game

A simple web application that simulates interactions with a blockchain-based Q&A game. Users receive virtual USDT, place bets, answer questions within a time limit, and can win or lose based on their answers.

## Features

- Fully simulated blockchain interaction - no real cryptocurrency required
- Start with 1000 virtual USDT
- Place bets with simulated USDT
- Answer questions within a 15-second time limit
- Win or lose based on your original answers
- Experience blockchain game mechanics without real money

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/are_you_basic_frontend.git
cd are_you_basic_frontend
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. The game starts with 1000 virtual USDT in your wallet
2. Choose a bet amount from the dropdown menu
3. Click "Start Game" to begin
4. You'll be given a random question with 15 seconds to answer
5. Type your answer before time runs out
6. The system will evaluate your answer and determine if you win or lose
7. Your virtual balance will be updated based on the result

## Smart Contracts

This frontend is designed to interact with the following smart contracts (currently simulated in the app):

- `BasicGameContract.sol` - The main game contract that handles bets and player interactions
- `GameOracle.sol` - The oracle that validates player answers
- `IGameOracle.sol` - Interface for the game oracle

## Simulation Mode

The app runs in full simulation mode, meaning:

- No real cryptocurrency is used
- No MetaMask or other wallet is required
- All blockchain transactions are simulated
- Your balance is reset to 1000 USDT each time you refresh the page

## License

MIT 