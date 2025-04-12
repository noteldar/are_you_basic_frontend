// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IGameOracle.sol";
import "./BasicGameContract.sol";

/**
 * @title GameOracle
 * @dev Implementation of the game oracle for validating player answers
 */
contract GameOracle is IGameOracle, Ownable {
    // Reference to the game contract
    BasicGameContract public gameContract;
    
    // Current question details
    bytes32 public currentQuestionId;
    bytes32 public currentQuestionHash;
    
    // Mapping of player answers
    mapping(bytes32 => mapping(address => bytes32)) private playerAnswers;
    
    // Events
    event ValidationRequested(bytes32 indexed questionId, address indexed player);
    event QuestionSet(bytes32 indexed questionId, bytes32 questionHash);
    event GameContractChanged(address indexed newGameContract);
    
    /**
     * @dev Constructor sets the game contract
     * @param _gameContract The address of the game contract
     */
    constructor(address _gameContract) {
        require(_gameContract != address(0), "Invalid game contract address");
        gameContract = BasicGameContract(_gameContract);
    }
    
    /**
     * @dev Set the current question
     * @param _questionId The unique identifier for the question
     * @param _questionHash The hash of the question
     */
    function setQuestion(bytes32 _questionId, bytes32 _questionHash) external onlyOwner {
        currentQuestionId = _questionId;
        currentQuestionHash = _questionHash;
        
        emit QuestionSet(_questionId, _questionHash);
    }
    
    /**
     * @dev Request validation for a player's answer
     * @param _questionId The unique identifier for the question
     * @param _player The address of the player who submitted the answer
     * @param _answerHash The hash of the player's answer
     */
    function requestValidation(
        bytes32 _questionId,
        address _player,
        bytes32 _answerHash
    ) external override {
        require(msg.sender == address(gameContract), "Only game contract can request");
        require(_questionId == currentQuestionId, "Question ID mismatch");
        
        // Store player's answer
        playerAnswers[_questionId][_player] = _answerHash;
        
        emit ValidationRequested(_questionId, _player);
    }
    
    /**
     * @dev Get the current game question
     * @return questionId The current question ID
     * @return questionHash The hash of the current question
     */
    function getCurrentQuestion() external view override returns (
        bytes32 questionId,
        bytes32 questionHash
    ) {
        return (currentQuestionId, currentQuestionHash);
    }
    
    /**
     * @dev Resolve the game with the winner
     * @param _questionId The question ID
     * @param _correctAnswerHash The hash of the correct answer
     */
    function resolveWithAnswer(bytes32 _questionId, bytes32 _correctAnswerHash) external onlyOwner {
        require(_questionId == currentQuestionId, "Question ID mismatch");
        
        address winner = address(0);
        
        // Loop through players to find the first correct answer
        address[] memory players = gameContract.getPlayers();
        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            if (playerAnswers[_questionId][player] == _correctAnswerHash) {
                winner = player;
                break;
            }
        }
        
        // If a winner was found, resolve the game
        require(winner != address(0), "No correct answer found");
        gameContract.resolveGame(_questionId, winner);
    }
    
    /**
     * @dev Directly set a winner (for manual resolution if needed)
     * @param _questionId The question ID
     * @param _winner The address of the winner
     */
    function resolveWithWinner(bytes32 _questionId, address _winner) external onlyOwner {
        require(_questionId == currentQuestionId, "Question ID mismatch");
        
        // Resolve the game with the specified winner
        gameContract.resolveGame(_questionId, _winner);
    }
    
    /**
     * @dev Update the game contract address
     * @param _newGameContract The new game contract address
     */
    function setGameContract(address _newGameContract) external onlyOwner {
        require(_newGameContract != address(0), "Invalid game contract address");
        gameContract = BasicGameContract(_newGameContract);
        
        emit GameContractChanged(_newGameContract);
    }
    
    /**
     * @dev Get player's answer hash
     * @param _questionId The question ID
     * @param _player The player address
     * @return The hash of the player's answer
     */
    function getPlayerAnswer(bytes32 _questionId, address _player) external view returns (bytes32) {
        return playerAnswers[_questionId][_player];
    }
} 