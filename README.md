# Are You Basic?

A web application that challenges players to provide non-basic (original, creative) responses to questions. The app uses a local API to evaluate answers and determine if they're "basic" or not.

## Game Concept

Prove your humanity by giving non-basic responses. If you sound like AI or give generic responses, you're BASIC!

## Game Rules

1. Each round costs $1 to play
2. Win $10 for your first non-basic response
3. Win $20 for your second consecutive win
4. Win $50 for your third consecutive win or more
5. If your response is basic, you lose your consecutive wins
6. You have 15 seconds to answer each question
7. Game over when you run out of money

## Features

- Integration with a local evaluation API (http://localhost:8000/evaluate)
- 15-second timer for each question
- Consecutive win tracking with increasing prizes
- Score display showing final score, AI detection score, and coherence score
- Simulated currency system

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
      "role": "system",
      "content": "You are a helpful assistant."
    },
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

The API should return a response with evaluation scores:
```json
{
  "final_score": 0.75,
  "ai_detection_score": 0.3,
  "coherence_score": 0.9
}
```

A final score of 0.5 or higher means the answer is NOT basic, and the player wins.

## How to Play

1. Start with $10 in your bank
2. Each round costs $1 to play
3. Answer the question within 15 seconds
4. Your answer will be sent to the API for evaluation
5. If your score is 0.5 or higher, you win!
6. Consecutive wins increase your prize amounts
7. Keep playing until you run out of money

## Technical Implementation

The frontend is a React application that simulates blockchain interactions but uses a real API for answer evaluation. The application has three main components:

1. **ContractAPI.js**: Handles simulated blockchain and real API interactions
2. **Game.js**: Manages game state, UI, and logic
3. **App.js**: Main application wrapper

## License

MIT 