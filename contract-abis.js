// Simplified ABIs for contracts
const contractABIs = {
	testUSDT: [
		"function balanceOf(address owner) view returns (uint256)",
		"function decimals() view returns (uint8)",
		"function approve(address spender, uint256 amount) returns (bool)",
		"function allowance(address owner, address spender) view returns (uint256)",
		"function transfer(address to, uint256 amount) returns (bool)",
		"function mintTestTokens(address to, uint256 amount) external"
	],

	gameContract: [
		"function getGameState() view returns (uint8)",
		"function currentQuestionId() view returns (bytes32)",
		"function placeBet(uint256 betAmount) external",
		"function submitAnswer(bytes32 answerHash) external",
		"function hasPlayerSubmittedAnswer(address player) view returns (bool)",
		"function getPlayers() external view returns (address[])",
		"function getPlayerBet(address player) external view returns (uint256)"
	],

	oracle: [
		"function getCurrentQuestion() external view returns (bytes32, bytes32)",
		"function setQuestion(bytes32 questionId, bytes32 questionHash) external",
		"function resolveWithAnswer(bytes32 questionId, bytes32 correctAnswerHash) external"
	]
};

// Export for ES modules
export default contractABIs; 