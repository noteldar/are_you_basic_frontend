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
// eslint-disable-next-line no-unused-vars
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

				// More aggressive approach to clearing any pending bets
				try {
					console.log("Aggressively clearing game state during wallet connection");
					// Submit a dummy answer to clear any pending bets (don't wait for result)
					const dummyAnswer = "initialize_clearing_pending_bet";
					const answerHash = ethers.utils.id(dummyAnswer);

					// Try a few times with different answers to ensure we clear the state
					const clearingAttempts = ["clear_attempt_1", "clear_attempt_2", "clear_attempt_3"];
					for (const attempt of clearingAttempts) {
						try {
							const attemptHash = ethers.utils.id(attempt);
							// Don't await - just fire and forget
							this.gameContract.submitAnswer(attemptHash).catch(() => {
								// Expected to fail if no pending bet
							});
							// Small delay between attempts
							await new Promise(resolve => setTimeout(resolve, 500));
						} catch (err) {
							// Ignore errors here
						}
					}

					// Now verify if we've successfully cleared any pending bets
					const pendingBetCheck = await this.hasPendingBet();
					if (pendingBetCheck.success && pendingBetCheck.hasPendingBet) {
						console.log("Still has pending bet after clearing attempts, trying one more");
						// One final attempt, this time waiting for the transaction
						try {
							const finalAttempt = "final_clear_attempt";
							const finalHash = ethers.utils.id(finalAttempt);
							const tx = await this.gameContract.submitAnswer(finalHash);
							await tx.wait();
							console.log("Final clearing attempt complete");
						} catch (finalErr) {
							console.log("Final clearing attempt failed:", finalErr.message);
						}
					}
				} catch (checkError) {
					console.log("Error during aggressive clearing:", checkError.message);
					// Ignore errors, this is just a cleanup attempt
				}

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
			// eslint-disable-next-line no-unused-vars
			const [questionId, questionHash] = await this.oracleContract.getCurrentQuestion();

			// Use a predefined question from our local list
			// Convert questionId to a number and use modulo to get a valid index
			const questionIndex = (parseInt(questionId.toString()) % this.questions.length);
			const questionText = this.questions[questionIndex];

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
			const amountInWei = ethers.utils.parseUnits("1000", 6); // 1000 USDT to avoid frequent approvals

			// Approve tokens to be spent by the game contract
			const tx = await this.tokenContract.approve(GAME_CONTRACT_ADDRESS, amountInWei);
			await tx.wait();

			return { success: true, tx };
		} catch (error) {
			console.error("Error approving tokens:", error);
			return { success: false, error: error.message };
		}
	}

	async hasPendingBet() {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			const address = await this.signer.getAddress();

			// Check if player has submitted an answer already
			const hasSubmittedAnswer = await this.gameContract.hasPlayerSubmittedAnswer(address);

			// Check if player has placed a bet
			const betAmount = await this.gameContract.getPlayerBet(address);
			const hasBet = !betAmount.isZero(); // If bet amount is not zero, they have placed a bet

			// If they have a bet but haven't submitted an answer, they have a pending bet
			const hasPendingBet = hasBet && !hasSubmittedAnswer;

			// In some cases the contract might be in a state where the player has submitted an answer
			// but the game hasn't been fully resolved. For our UI purposes, we'll consider this 
			// as NOT having a pending bet, so they can start a new game.
			const canStartNewGame = !hasBet || (hasBet && hasSubmittedAnswer);

			return {
				success: true,
				hasPendingBet,
				canStartNewGame
			};
		} catch (error) {
			console.error("Error checking pending bet:", error);
			return { success: false, error: error.message };
		}
	}

	async placeBet(amount) {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			// Always try to submit a dummy answer first to ensure game state is clean
			// This is a more aggressive approach that might fix persistent state issues
			try {
				console.log("Preemptively clearing any potential pending bets before placing a new bet");
				const dummyAnswer = "force_clear_before_bet";
				const answerHash = ethers.utils.id(dummyAnswer);
				// We don't await this transaction - if it fails, that's okay as it means 
				// there wasn't a pending bet to clear
				this.gameContract.submitAnswer(answerHash).catch(() => {
					// Silently catch errors - we expect this to fail if no pending bet
					console.log("No pending bet to clear - continuing to place bet");
				});

				// Wait a short moment to allow blockchain state to update
				await new Promise(resolve => setTimeout(resolve, 2000));
			} catch (clearError) {
				// Ignore any errors in this preemptive cleanup
				console.log("Ignored error during preemptive cleanup:", clearError.message);
			}

			// Check if the user already has a pending bet
			const pendingBetCheck = await this.hasPendingBet();

			// Only block if there's a pending bet without an answer submitted
			if (pendingBetCheck.success && pendingBetCheck.hasPendingBet) {
				return {
					success: false,
					error: "You have already placed a bet. Please submit an answer first."
				};
			}

			// If the user has submitted an answer but the game hasn't been fully resolved on-chain,
			// we'll force place a new bet by trying the transaction directly.
			// This will either succeed with a new bet or fail with a specific error.

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
			// Check if the error is due to already having placed a bet
			if (error.message.includes("Already placed a bet")) {
				return {
					success: false,
					error: "You have already placed a bet. Please submit an answer first."
				};
			}
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

	async forceClearGameState() {
		if (!this.connected) return { success: false, error: "Wallet not connected" };

		try {
			const pendingBetCheck = await this.hasPendingBet();

			// If there's a pending bet without an answer, submit a dummy answer to clear it
			if (pendingBetCheck.success && pendingBetCheck.hasPendingBet) {
				console.log("Found a pending bet, submitting dummy answer to clear it");
				const dummyAnswer = "clearing_pending_bet";
				const answerHash = ethers.utils.id(dummyAnswer);

				// Try submitting the dummy answer multiple times to ensure it clears
				let attempts = 0;
				let success = false;
				while (attempts < 3 && !success) {
					try {
						const tx = await this.gameContract.submitAnswer(answerHash);
						await tx.wait();
						console.log("Successfully cleared pending bet state");
						success = true;
					} catch (err) {
						console.log(`Error while submitting dummy answer (attempt ${attempts + 1}):`, err.message);
						attempts++;
						// Wait a bit before retrying
						await new Promise(resolve => setTimeout(resolve, 1000));
					}
				}

				// Verify the bet was cleared by checking again
				const verifyCheck = await this.hasPendingBet();
				if (verifyCheck.success && verifyCheck.hasPendingBet) {
					console.log("Warning: Still has pending bet after clearing attempt");
				}
			} else if (pendingBetCheck.success && !pendingBetCheck.canStartNewGame) {
				// Handle the edge case where the player has submitted an answer but the game hasn't been fully resolved
				console.log("Game state indicates answer submitted but game not resolved - forcing reset");
				try {
					// Try a different approach to force reset the game state
					const dummyAnswer = "force_reset_game_state";
					const answerHash = ethers.utils.id(dummyAnswer);
					const tx = await this.gameContract.submitAnswer(answerHash);
					await tx.wait();
				} catch (err) {
					console.log("Error while force resetting game state:", err.message);
				}
			}

			// After this, the player should be able to place a new bet
			return { success: true };
		} catch (error) {
			console.error("Error force clearing game state:", error);
			return { success: false, error: error.message };
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

// Fix the anonymous export warning
const contractAPIInstance = new ContractAPI();
export default contractAPIInstance; 