// reset-game.js - Script to reset game state by submitting an answer
const { ethers } = require('ethers');
const BasicGameContractABI = require('./src/abis/BasicGameContract.json');

// Hardhat local network default values
const GAME_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const RPC_URL = "http://localhost:8545";

async function resetGame() {
	try {
		console.log("Connecting to local network...");
		const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

		// Get the first account from Hardhat's default accounts
		const [signer] = await provider.listAccounts();
		console.log(`Using account: ${signer}`);

		const wallet = provider.getSigner(signer);

		// Connect to the game contract
		const gameContract = new ethers.Contract(
			GAME_CONTRACT_ADDRESS,
			BasicGameContractABI.abi,
			wallet
		);

		console.log("Submitting dummy answer to reset game state...");
		// Create a dummy answer hash
		const dummyAnswer = "reset_game_state_" + Date.now();
		const answerHash = ethers.utils.id(dummyAnswer);

		// Try to submit the answer
		const tx = await gameContract.submitAnswer(answerHash);
		console.log(`Transaction submitted: ${tx.hash}`);

		// Wait for the transaction to be confirmed
		const receipt = await tx.wait();
		console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
		console.log("Game state should now be reset!");

	} catch (error) {
		if (error.message.includes("Player has not placed a bet")) {
			console.log("No pending bet found - game state is already clean!");
		} else {
			console.error("Error resetting game state:", error.message);
		}
	}
}

// Run the reset function
resetGame()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	}); 