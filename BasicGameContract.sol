// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IGameOracle.sol";

/**
 * @title BasicGameContract
 * @dev A secure contract for handling player bets with BEP-20 USDT
 */
contract BasicGameContract is Ownable, ReentrancyGuard {
    // USDT token interface
    IERC20 public usdtToken;
    
    // Oracle interface
    IGameOracle public oracle;
    
    // Fee percentage (5%)
    uint256 public constant FEE_PERCENTAGE = 5;
    
    // Project wallet for collecting fees
    address public projectWallet;
    
    // Game state enum
    enum GameState { INACTIVE, ACTIVE, COMPLETED }
    
    // Game structure
    struct Game {
        bytes32 questionId;
        address[] players;
        mapping(address => bool) hasPlayed;
        mapping(address => uint256) betAmounts;
        mapping(address => bool) hasSubmittedAnswer;
        GameState state;
        uint256 totalPot;
    }
    
    // Current game
    Game private currentGame;
    
    // Current question ID
    bytes32 public currentQuestionId;
    
    // Oracle address
    address public oracleAddress;
    
    // Events
    event GameStarted(bytes32 indexed questionId);
    event PlayerJoined(address indexed player, uint256 betAmount);
    event AnswerSubmitted(address indexed player, bytes32 answerHash);
    event GameCompleted(address indexed winner, uint256 winnings, uint256 fee);
    event OracleAddressChanged(address indexed newOracleAddress);
    event ProjectWalletChanged(address indexed newProjectWallet);
    
    /**
     * @dev Constructor sets the token address, oracle address, and project wallet
     * @param _usdtAddress The address of the USDT token
     * @param _oracleAddress The address of the trusted oracle
     * @param _projectWallet The address of the project wallet to receive fees
     */
    constructor(
        address _usdtAddress,
        address _oracleAddress,
        address _projectWallet
    ) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        require(_oracleAddress != address(0), "Invalid oracle address");
        require(_projectWallet != address(0), "Invalid project wallet address");
        
        usdtToken = IERC20(_usdtAddress);
        oracleAddress = _oracleAddress;
        oracle = IGameOracle(_oracleAddress);
        projectWallet = _projectWallet;
    }
    
    /**
     * @dev Start a new game with a unique question ID
     * @param _questionId The unique identifier for the current question
     */
    function startGame(bytes32 _questionId) external onlyOwner {
        require(currentGame.state != GameState.ACTIVE, "Game already active");
        
        // Reset current game
        delete currentGame.players;
        currentGame.questionId = _questionId;
        currentGame.state = GameState.ACTIVE;
        currentGame.totalPot = 0;
        
        currentQuestionId = _questionId;
        
        emit GameStarted(_questionId);
    }
    
    /**
     * @dev Allow a player to place a bet
     * @param _betAmount The amount of USDT to bet
     */
    function placeBet(uint256 _betAmount) external nonReentrant {
        require(currentGame.state == GameState.ACTIVE, "No active game");
        require(_betAmount > 0, "Bet amount must be greater than 0");
        require(!currentGame.hasPlayed[msg.sender], "Already placed a bet");
        
        // Transfer USDT tokens from player to contract
        bool success = usdtToken.transferFrom(msg.sender, address(this), _betAmount);
        require(success, "Token transfer failed");
        
        // Record player's bet
        currentGame.players.push(msg.sender);
        currentGame.hasPlayed[msg.sender] = true;
        currentGame.betAmounts[msg.sender] = _betAmount;
        currentGame.totalPot += _betAmount;
        
        emit PlayerJoined(msg.sender, _betAmount);
    }
    
    /**
     * @dev Allow a player to submit an answer
     * @param _answerHash The hash of the player's answer
     */
    function submitAnswer(bytes32 _answerHash) external {
        require(currentGame.state == GameState.ACTIVE, "No active game");
        require(currentGame.hasPlayed[msg.sender], "Player has not placed a bet");
        require(!currentGame.hasSubmittedAnswer[msg.sender], "Already submitted an answer");
        
        // Mark player as having submitted an answer
        currentGame.hasSubmittedAnswer[msg.sender] = true;
        
        // Request validation from oracle
        oracle.requestValidation(currentGame.questionId, msg.sender, _answerHash);
        
        emit AnswerSubmitted(msg.sender, _answerHash);
    }
    
    /**
     * @dev Oracle callback to determine the winner
     * @param _questionId The question ID to validate against
     * @param _winner The address of the winner
     */
    function resolveGame(bytes32 _questionId, address _winner) external nonReentrant {
        require(msg.sender == oracleAddress, "Only oracle can resolve");
        require(currentGame.state == GameState.ACTIVE, "No active game");
        require(_questionId == currentGame.questionId, "Question ID mismatch");
        require(currentGame.hasPlayed[_winner], "Winner did not participate");
        require(currentGame.hasSubmittedAnswer[_winner], "Winner did not submit an answer");
        
        // Calculate winnings and fee
        uint256 totalPot = currentGame.totalPot;
        uint256 fee = (totalPot * FEE_PERCENTAGE) / 100;
        uint256 winnings = totalPot - fee;
        
        // Update game state
        currentGame.state = GameState.COMPLETED;
        
        // Transfer winnings to winner
        bool winnerTransfer = usdtToken.transfer(_winner, winnings);
        require(winnerTransfer, "Winner transfer failed");
        
        // Transfer fee to project wallet
        bool feeTransfer = usdtToken.transfer(projectWallet, fee);
        require(feeTransfer, "Fee transfer failed");
        
        emit GameCompleted(_winner, winnings, fee);
    }
    
    /**
     * @dev Update the oracle address
     * @param _newOracleAddress The new oracle address
     */
    function setOracleAddress(address _newOracleAddress) external onlyOwner {
        require(_newOracleAddress != address(0), "Invalid oracle address");
        oracleAddress = _newOracleAddress;
        oracle = IGameOracle(_newOracleAddress);
        emit OracleAddressChanged(_newOracleAddress);
    }
    
    /**
     * @dev Update the project wallet address
     * @param _newProjectWallet The new project wallet address
     */
    function setProjectWallet(address _newProjectWallet) external onlyOwner {
        require(_newProjectWallet != address(0), "Invalid project wallet address");
        projectWallet = _newProjectWallet;
        emit ProjectWalletChanged(_newProjectWallet);
    }
    
    /**
     * @dev Get list of players in current game
     * @return List of player addresses
     */
    function getPlayers() external view returns (address[] memory) {
        return currentGame.players;
    }
    
    /**
     * @dev Get current game state
     * @return Current game state
     */
    function getGameState() external view returns (GameState) {
        return currentGame.state;
    }
    
    /**
     * @dev Get player bet amount
     * @param _player The player address
     * @return Bet amount
     */
    function getPlayerBet(address _player) external view returns (uint256) {
        return currentGame.betAmounts[_player];
    }
    
    /**
     * @dev Check if player has submitted an answer
     * @param _player The player address
     * @return True if player has submitted an answer
     */
    function hasPlayerSubmittedAnswer(address _player) external view returns (bool) {
        return currentGame.hasSubmittedAnswer[_player];
    }
    
    /**
     * @dev Emergency function to recover stuck tokens
     * @param _tokenAddress The address of the token to recover
     * @param _amount The amount to recover
     */
    function recoverTokens(address _tokenAddress, uint256 _amount) external onlyOwner {
        require(currentGame.state != GameState.ACTIVE, "Cannot recover during active game");
        IERC20 token = IERC20(_tokenAddress);
        bool success = token.transfer(owner(), _amount);
        require(success, "Token recovery failed");
    }
} 