// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IGameOracle
 * @dev Interface for the off-chain oracle that validates player answers
 */
interface IGameOracle {
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
    ) external;
    
    /**
     * @dev Get the current game question
     * @return questionId The current question ID
     * @return questionHash The hash of the current question
     */
    function getCurrentQuestion() external view returns (
        bytes32 questionId,
        bytes32 questionHash
    );
} 