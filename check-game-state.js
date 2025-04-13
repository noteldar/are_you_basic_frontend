// check-game-state.js - Script to check current game state
const { ethers } = require('ethers');
const BasicGameContractABI = require('./src/abis/BasicGameContract.json');
const USDTTokenABI = require('./src/abis/TestUSDT.json');

// Hardhat local network default values
const GAME_CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const USDT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL = "http://localhost:8545";

async function checkGameState() {
	try {
		console.log("Connecting to local network...");
		const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

		// Get the first account from Hardhat's default accounts
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

		// Connect to the USDT token contract
		const tokenContract = new ethers.Contract(
			USDT_ADDRESS,
			USDTTokenABI.abi,
			wallet
		);

		// Get current game state
		const gameState = await gameContract.getGameState();
		console.log(`Current game state: ${gameState}`);

		// Get bet amount for player
		const betAmount = await gameContract.getPlayerBet(signerAddress);
		const formattedBetAmount = ethers.utils.formatUnits(betAmount, 6); // USDT has 6 decimals
		console.log(`Player bet amount: ${formattedBetAmount} USDT`);

		// Check if player has submitted an answer
		const hasSubmittedAnswer = await gameContract.hasPlayerSubmittedAnswer(signerAddress);
		console.log(`Player has submitted answer: ${hasSubmittedAnswer}`);

		// Get USDT balance
		const balance = await tokenContract.balanceOf(signerAddress);
		const formattedBalance = ethers.utils.formatUnits(balance, 6);
		console.log(`USDT balance: ${formattedBalance} USDT`);

		// Check token allowance
		const allowance = await tokenContract.allowance(signerAddress, GAME_CONTRACT_ADDRESS);
		const formattedAllowance = ethers.utils.formatUnits(allowance, 6);
		console.log(`USDT allowance for game contract: ${formattedAllowance} USDT`);

		// Determine player's game state
		if (betAmount.isZero()) {
			console.log("\nSTATUS: Player has NOT placed a bet. Can start a new game.");
		} else if (!hasSubmittedAnswer) {
			console.log("\nSTATUS: Player has placed a bet but has NOT submitted an answer yet.");
			console.log("RECOMMENDATION: Run reset-game.js to submit a dummy answer and clear the state.");
		} else {
			console.log("\nSTATUS: Player has placed a bet AND submitted an answer.");
			console.log("RECOMMENDATION: Game should be completed by the oracle. Check oracle state.");
		}

	} catch (error) {
		console.error("Error checking game state:", error.message);
	}
}

// Run the check function
checkGameState()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	}); 