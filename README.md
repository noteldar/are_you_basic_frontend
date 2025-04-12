# Are You Basic? - Blockchain Q&A Game

A web application that integrates with a local API to evaluate answers in a blockchain-based Q&A game. Users receive virtual USDT, place bets, answer questions within a time limit, and win or lose based on the API's evaluation of their answers.

## Features

- API integration with a local evaluation service (http://localhost:8000/evaluate)
- Simulated blockchain interaction (no real cryptocurrency required)
- Start with 1000 virtual USDT
- Place bets with simulated USDT
- Answer questions within a 15-second time limit
- Win or lose based on API evaluation of your answers
- Experience blockchain game mechanics with real answer evaluation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Local API running at http://localhost:8000/evaluate

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

3. Ensure the local API is running at http://localhost:8000

4. Start the development server
```
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## API Integration

The application makes POST requests to a local API endpoint at http://localhost:8000/evaluate. The API expects a JSON payload in the following format:

```json
{
  "conversation": [
    {
      "role": "user",
      "content": "The question text"
    },
    {
      "role": "assistant",
      "content": "The user's answer"
    }
  ]
}
```

The API should return a response that indicates whether the answer is "basic" or not, optionally with a score and explanation.

## How to Play

1. The game starts with 1000 virtual USDT in your wallet
2. Choose a bet amount from the dropdown menu
3. Click "Start Game" to begin
4. You'll be given a random question with 15 seconds to answer
5. Type your answer before time runs out
6. Your answer will be sent to the API for evaluation
7. Results will be displayed, showing whether you win or lose
8. Your virtual balance will be updated based on the result

## Smart Contracts

This frontend is designed to interact with the following smart contracts (currently simulated in the app):

- `BasicGameContract.sol` - The main game contract that handles bets and player interactions
- `GameOracle.sol` - The oracle that validates player answers
- `IGameOracle.sol` - Interface for the game oracle

## Simulation Mode

The blockchain interactions are simulated, meaning:

- No real cryptocurrency is used
- No MetaMask or other wallet is required
- All blockchain transactions are simulated
- Your balance is reset to 1000 USDT each time you refresh the page

However, the answer evaluation uses a real API for determining if an answer is "basic" or not.

## License

MIT 