// resolve-game.js - Script to check oracle state and force game resolution
const { ethers } = require('ethers');
const BasicGameContractABI = require('./src/abis/BasicGameContract.json');
const GameOracleABI = require('./src/abis/GameOracle.json');

// Hardhat local network default values
const GAME_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const ORACLE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const RPC_URL = "http://localhost:8545";

async function resolveGame() {
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

		// Connect to the oracle contract
		const oracleContract = new ethers.Contract(
			ORACLE_ADDRESS,
			GameOracleABI.abi,
			wallet
		);

		// Get current question ID from the game contract
		const currentQuestionId = await gameContract.currentQuestionId();
		console.log(`Current Question ID: ${currentQuestionId}`);

		// Get current game state
		const gameState = await gameContract.getGameState();
		console.log(`Current game state: ${gameState} (0=INACTIVE, 1=ACTIVE, 2=COMPLETED)`);

		// Get players
		const players = await gameContract.getPlayers();
		console.log("Players in current game:", players);

		if (gameState.toString() === "1") { // ACTIVE
			console.log("\nAttempting to force resolve game with player as winner...");

			// Try to resolve with the first player as winner
			try {
				const tx = await oracleContract.resolveWithWinner(currentQuestionId, signerAddress);
				console.log(`Transaction submitted: ${tx.hash}`);

				const receipt = await tx.wait();
				console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
				console.log("Game should now be resolved!");
			} catch (oracleError) {
				console.error("Error resolving game with oracle:", oracleError.message);

				console.log("\nTrying alternative method - direct call to game contract...");
				try {
					// Try to call resolveGame directly on the game contract (may not work depending on permissions)
					const tx = await gameContract.resolveGame(currentQuestionId, signerAddress);
					console.log(`Transaction submitted: ${tx.hash}`);

					const receipt = await tx.wait();
					console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
					console.log("Game should now be resolved!");
				} catch (gameError) {
					console.error("Error resolving game directly:", gameError.message);

					// Check if we're the owner of the contract
					console.log("\nChecking if we can start a new game as owner...");
					try {
						// Try to start a new game (if we're the owner)
						const newQuestionId = ethers.utils.id("new_question_" + Date.now());
						const tx = await gameContract.startGame(newQuestionId);
						console.log(`Transaction submitted: ${tx.hash}`);

						const receipt = await tx.wait();
						console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
						console.log("Started a new game with fresh state!");
					} catch (ownerError) {
						console.error("Error starting new game:", ownerError.message);
						console.log("\nAll resolution attempts failed. You may need to reset your node or manually interact with the contracts.");
					}
				}
			}
		} else if (gameState.toString() === "2") { // COMPLETED
			console.log("\nGame is already completed. Try starting a new game.");
		} else { // INACTIVE
			console.log("\nGame is inactive. You can start a new game.");
		}

	} catch (error) {
		console.error("Error resolving game:", error.message);
	}
}

// Run the resolve function
resolveGame()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	}); 