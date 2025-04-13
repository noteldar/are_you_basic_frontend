import { ethers } from 'ethers';
import BasicGameContractABI from './abis/BasicGameContract.json';
import GameOracleABI from './abis/GameOracle.json';
import USDTTokenABI from './abis/TestUSDT.json';

// Deployed contract addresses from Hardhat deployment
const GAME_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const ORACLE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USDT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// API endpoint for answer evaluation
const API_ENDPOINT = "http://localhost:8000/evaluate";

// Constants for game logic
const GAME_COST = 1; // Cost to play one round
const WIN_THRESHOLD = 0.5; // Score threshold to consider a win

class ContractAPI {
	constructor() {
		this.provider = null;
		this.signer = null;
		this.gameContract = null;
		this.oracleContract = null;
		this.tokenContract = null;
		this.connected = false;
		this.mockBalance = 10; // Starting balance - 10 USDT as in Python code
		this.mockWalletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
		this.consecutiveWins = 0; // Track consecutive wins for prize scaling

		// Track questions and answers for API calls
		this.currentQuestion = null;

		// Load all possible questions
		this.questions = [
			"What's your favorite book?",
			"What's your favorite movie?",
			"What's a hobby you enjoy?",
			"What's your favorite food?",
			"Where would you like to travel?",
			"What's your dream job?",
			"What's something you're proud of?",
			"What's a skill you'd like to learn?",
			"What's your favorite season and why?",
			"What's your favorite way to relax?",
			"What's something that everyone thinks is overrated?",
			"What's your unpopular opinion?",
			"What would you do with a million dollars?",
			"If you could have any superpower, what would it be?",
			"What's the most basic thing about modern culture?"
		];
	}

	async connectWallet() {
		try {
			// Connect to actual MetaMask wallet
			if (window.ethereum) {
				await window.ethereum.request({ method: 'eth_requestAccounts' });

				this.provider = new ethers.providers.Web3Provider(window.ethereum);
				this.signer = this.provider.getSigner();
				const address = await this.signer.getAddress();

				// Initialize contract instances
				this.gameContract = new ethers.Contract(
					GAME_CONTRACT_ADDRESS,
					BasicGameContractABI.abi,
					this.signer
				);

				this.oracleContract = new ethers.Contract(
					ORACLE_ADDRESS,
					GameOracleABI.abi,
					this.signer
				);

				this.tokenContract = new ethers.Contract(
					USDT_ADDRESS,
					USDTTokenABI.abi,
					this.signer
				);

				this.connected = true;

				// Get token balance
				const balance = await this.tokenContract.balanceOf(address);
				const formattedBalance = ethers.utils.formatUnits(balance, 6); // USDT has 6 decimals

				return {
					success: true,
					address,
					balance: parseFloat(formattedBalance),
					consecutiveWins: this.consecutiveWins
				};
			} else {
				throw new Error("Ethereum wallet not found. Please install MetaMask.");
			}
		} catch (error) {
			console.error("Error connecting wallet:", error);
			return { success: false, error: error.message };
		}
	}

	async getCurrentQuestion() {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Get current question from oracle contract
			const [questionId, questionHash] = await this.oracleContract.getCurrentQuestion();

			// For a real implementation, you'd store a mapping of question IDs to question text
			// For this demo, we can use predefined questions or fetch them from an API

			// Example - fetch question text from backend API
			const response = await fetch(`/api/questions/${questionId}`);
			const data = await response.json();
			const questionText = data.questionText || "What's your favorite book?";

			// Store for later API calls
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
			// Convert amount to wei (USDT has 6 decimals)
			const amountInWei = ethers.utils.parseUnits(amount.toString(), 6);

			// Approve tokens to be spent by the game contract
			const tx = await this.tokenContract.approve(GAME_CONTRACT_ADDRESS, amountInWei);
			await tx.wait();

			return { success: true, tx };
		} catch (error) {
			console.error("Error approving tokens:", error);
			return { success: false, error: error.message };
		}
	}

	async placeBet(amount) {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Convert amount to wei (USDT has 6 decimals)
			const amountInWei = ethers.utils.parseUnits(amount.toString(), 6);

			// Place bet on the contract
			const tx = await this.gameContract.placeBet(amountInWei);
			await tx.wait();

			// Get updated balance
			const address = await this.signer.getAddress();
			const balance = await this.tokenContract.balanceOf(address);
			const formattedBalance = ethers.utils.formatUnits(balance, 6);

			return {
				success: true,
				tx,
				newBalance: parseFloat(formattedBalance),
				consecutiveWins: this.consecutiveWins
			};
		} catch (error) {
			console.error("Error placing bet:", error);
			return { success: false, error: error.message };
		}
	}

	async submitAnswer(answer) {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Hash the answer
			const answerHash = ethers.utils.id(answer);

			// Submit answer to contract
			const tx = await this.gameContract.submitAnswer(answerHash);
			await tx.wait();

			return {
				success: true,
				tx,
				answerHash
			};
		} catch (error) {
			console.error("Error submitting answer:", error);
			return { success: false, error: error.message };
		}
	}

	// Bridge between API evaluation and blockchain
	async simulateOracleResponse(questionId, answer) {
		try {
			// The real API call to evaluate the answer
			console.log("Calling evaluation API...");

			// Create conversation format expected by the API
			const conversationData = {
				conversation: [
					{
						role: "system",
						content: "You are a helpful assistant."
					},
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
			const finalScore = result.final_score || 0;
			const isWinner = finalScore >= WIN_THRESHOLD;

			// In a real implementation, you would call a backend service here that would
			// call the oracle.resolveWithWinner() function

			// For this demo, we'll simulate the result and update our consecutive wins count
			// This would typically happen on-chain in the real implementation

			// Calculate winnings based on consecutive wins (match Python logic)
			let winAmount = 0;

			if (isWinner) {
				this.consecutiveWins += 1;

				if (this.consecutiveWins === 1) {
					winAmount = 10;
				} else if (this.consecutiveWins === 2) {
					winAmount = 20;
				} else { // 3 or more
					winAmount = 50;
				}

				// Here, in a full implementation, a backend service would call oracle.resolveWithWinner
				// with the user's address to transfer the winnings on-chain
			} else {
				// Reset consecutive wins if lose
				this.consecutiveWins = 0;
			}

			// Get updated balance (after oracle would have resolved the game)
			const address = await this.signer.getAddress();
			const balance = await this.tokenContract.balanceOf(address);
			const formattedBalance = ethers.utils.formatUnits(balance, 6);

			return {
				success: true,
				isWinner,
				winAmount,
				finalScore,
				aiDetectionScore: result.ai_detection_score || 0,
				coherenceScore: result.coherence_score || 0,
				consecutiveWins: this.consecutiveWins,
				apiResponse: result,
				newBalance: parseFloat(formattedBalance)
			};
		} catch (error) {
			console.error("Error calling evaluation API:", error);

			// More comprehensive error handling would be needed in a production app
			return {
				success: false,
				error: error.message
			};
		}
	}

	async getBalance() {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			const address = await this.signer.getAddress();
			const balance = await this.tokenContract.balanceOf(address);
			const formattedBalance = ethers.utils.formatUnits(balance, 6);

			return {
				success: true,
				balance: parseFloat(formattedBalance),
				consecutiveWins: this.consecutiveWins
			};
		} catch (error) {
			console.error("Error getting balance:", error);
			return { success: false, error: error.message };
		}
	}
}

export default new ContractAPI(); 