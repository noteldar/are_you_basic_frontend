// start-new-game.js - Script to start a new game as the contract owner
const { ethers } = require('ethers');
const BasicGameContractABI = require('./src/abis/BasicGameContract.json');

// Hardhat local network default values
const GAME_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const RPC_URL = "http://localhost:8545";

async function startNewGame() {
	try {
		console.log("Connecting to local network...");
		const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

		// Get accounts
		const accounts = await provider.listAccounts();
		const signerAddress = accounts[0];
		console.log(`Using account: ${signerAddress}`);

		const wallet = provider.getSigner(signerAddress);

		// Connect to the game contract
		const gameContract = new ethers.Contract(
			GAME_CONTRACT_ADDRESS,
			BasicGameContractABI.abi,
			wallet
		);

		// Get current game state
		const gameState = await gameContract.getGameState();
		console.log(`Current game state: ${gameState} (0=INACTIVE, 1=ACTIVE, 2=COMPLETED)`);

		if (gameState.toString() !== "1") { // Not ACTIVE
			console.log("\nStarting a new game...");

			// Generate a new random question ID
			const newQuestionId = ethers.utils.id("new_question_" + Date.now());
			console.log(`New Question ID: ${newQuestionId}`);

			// Start a new game
			const tx = await gameContract.startGame(newQuestionId);
			console.log(`Transaction submitted: ${tx.hash}`);

			const receipt = await tx.wait();
			console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
			console.log("New game started successfully!");

			// Get updated game state
			const newGameState = await gameContract.getGameState();
			console.log(`New game state: ${newGameState} (0=INACTIVE, 1=ACTIVE, 2=COMPLETED)`);
		} else {
			console.log("\nCannot start a new game because current game is still ACTIVE.");
			console.log("Please resolve the current game first with resolve-game.js.");
		}

	} catch (error) {
		if (error.message.includes("caller is not the owner")) {
			console.error("Error: Only the contract owner can start a new game.");
			console.log("You may need to use a different account that has owner privileges.");
		} else {
			console.error("Error starting new game:", error.message);
		}
	}
}

// Run the start new game function
startNewGame()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	}); 