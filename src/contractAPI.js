import { ethers } from 'ethers';

// ABI for the BasicGameContract
const gameABI = [
	"function placeBet(uint256 _betAmount) external",
	"function submitAnswer(bytes32 _answerHash) external",
	"function getGameState() external view returns (uint8)",
	"function getPlayers() external view returns (address[])",
	"function currentQuestionId() external view returns (bytes32)",
	"event GameStarted(bytes32 indexed questionId)",
	"event PlayerJoined(address indexed player, uint256 betAmount)",
	"event AnswerSubmitted(address indexed player, bytes32 answerHash)",
	"event GameCompleted(address indexed winner, uint256 winnings, uint256 fee)"
];

// ABI for the GameOracle
const oracleABI = [
	"function getCurrentQuestion() external view returns (bytes32 questionId, bytes32 questionHash)"
];

// Simulated USDT token ABI
const tokenABI = [
	"function approve(address spender, uint256 amount) external returns (bool)",
	"function balanceOf(address account) external view returns (uint256)",
	"function allowance(address owner, address spender) external view returns (uint256)"
];

// Mock contract addresses - replace with actual addresses when deploying
const GAME_CONTRACT_ADDRESS = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
const ORACLE_ADDRESS = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";
const USDT_ADDRESS = "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a";

// API endpoint
const API_ENDPOINT = "http://localhost:8000/evaluate";

class ContractAPI {
	constructor() {
		this.provider = null;
		this.signer = null;
		this.gameContract = null;
		this.oracleContract = null;
		this.tokenContract = null;
		this.connected = false;
		this.mockBalance = 1000; // Simulated USDT balance
		this.mockWalletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

		// Track questions and answers for API calls
		this.currentQuestion = null;
	}

	async connectWallet() {
		// Simulate wallet connection without MetaMask
		try {
			// Create a simulated provider and signer
			this.provider = new ethers.providers.JsonRpcProvider();
			this.connected = true;

			// Simulate a successful connection
			console.log("Simulated wallet connected:", this.mockWalletAddress);

			return {
				success: true,
				address: this.mockWalletAddress,
				balance: this.mockBalance
			};
		} catch (error) {
			console.error("Error in simulated wallet connection:", error);
			return { success: false, error: error.message };
		}
	}

	async getCurrentQuestion() {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Return a random question from our list
			const questions = [
				"What's something that everyone thinks is overrated?",
				"What's your unpopular opinion?",
				"What would you do with a million dollars?",
				"If you could have any superpower, what would it be?",
				"What's the most basic thing about modern culture?"
			];

			const randomIndex = Math.floor(Math.random() * questions.length);
			const questionId = ethers.utils.id("question" + randomIndex);
			const questionText = questions[randomIndex];

			// Store the current question for later API calls
			this.currentQuestion = questionText;

			return {
				success: true,
				questionId,
				questionText
			};
		} catch (error) {
			console.error("Error getting current question:", error);
			return { success: false, error: error.message };
		}
	}

	async approveTokens(amount) {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Simulate token approval without blockchain interaction
			console.log(`Simulated: Approved ${amount} USDT`);

			// Simulate transaction delay for realism
			await new Promise(resolve => setTimeout(resolve, 500));

			return {
				success: true,
				tx: { hash: ethers.utils.id("approval" + Date.now()) }
			};
		} catch (error) {
			console.error("Error approving tokens:", error);
			return { success: false, error: error.message };
		}
	}

	async placeBet(amount) {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Validate simulated balance
			if (this.mockBalance < amount) {
				throw new Error("Insufficient simulated USDT balance");
			}

			// Update simulated balance
			this.mockBalance -= parseInt(amount);
			console.log(`Simulated: Placed bet of ${amount} USDT. New balance: ${this.mockBalance}`);

			// Simulate transaction delay for realism
			await new Promise(resolve => setTimeout(resolve, 800));

			return {
				success: true,
				tx: { hash: ethers.utils.id("bet" + Date.now()) },
				newBalance: this.mockBalance
			};
		} catch (error) {
			console.error("Error placing bet:", error);
			return { success: false, error: error.message };
		}
	}

	async submitAnswer(answer) {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Simulate submitting answer to blockchain
			const answerHash = ethers.utils.id(answer);
			console.log("Simulated: Submitted answer with hash:", answerHash);

			// Simulate transaction delay for realism
			await new Promise(resolve => setTimeout(resolve, 1000));

			return {
				success: true,
				tx: { hash: ethers.utils.id("answer" + Date.now()) }
			};
		} catch (error) {
			console.error("Error submitting answer:", error);
			return { success: false, error: error.message };
		}
	}

	// Call the evaluation API to determine if the answer is a winner
	async simulateOracleResponse(questionId, answer) {
		try {
			// The real API call to evaluate the answer
			console.log("Calling evaluation API...");

			// Create conversation format expected by the API
			const conversationData = {
				conversation: [
					{
						role: "user",
						content: this.currentQuestion
					},
					{
						role: "assistant",
						content: answer
					}
				]
			};

			// Make the API call to the local server
			const response = await fetch(API_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(conversationData)
			});

			if (!response.ok) {
				throw new Error(`API response error: ${response.status}`);
			}

			// Parse the API response
			const result = await response.json();
			console.log("API Response:", result);

			// Determine if the answer is a winner based on the API response
			// Assuming the API returns a score or an evaluation of some kind
			// You might need to adjust this based on your actual API response format
			const isWinner = result.isBasic === false; // Not basic means win
			const score = result.score || 0;

			// Update mock balance if won
			const winAmount = isWinner ? parseInt(10) : 0;
			if (isWinner) {
				this.mockBalance += winAmount * 2; // Return bet + winnings
				console.log(`Won! New balance: ${this.mockBalance}`);
			}

			return {
				success: true,
				isWinner,
				winAmount,
				score,
				apiResponse: result,
				newBalance: this.mockBalance
			};
		} catch (error) {
			console.error("Error calling evaluation API:", error);

			// Fallback to simulated response if API fails
			console.log("Falling back to simulated evaluation...");

			// Generate a "unique" answer score based on question and answer
			const answerScore = ethers.utils.id(answer + questionId).substring(0, 10);
			const numericScore = parseInt(answerScore, 16);

			// 40% chance of winning
			const isWinner = numericScore % 100 < 40;

			// Update mock balance if won
			const winAmount = isWinner ? parseInt(10) : 0;
			if (isWinner) {
				this.mockBalance += winAmount * 2; // Return bet + winnings
				console.log(`Simulated fallback: Won! New balance: ${this.mockBalance}`);
			}

			return {
				success: true,
				isWinner,
				winAmount,
				fallback: true,
				error: error.message,
				newBalance: this.mockBalance
			};
		}
	}

	// Get current balance
	async getBalance() {
		return {
			success: true,
			balance: this.mockBalance
		};
	}
}

export default new ContractAPI(); 