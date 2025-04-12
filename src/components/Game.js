import React, { useState, useEffect, useRef } from 'react';
import contractAPI from '../contractAPI';

const Game = ({ walletAddress, onWalletChange }) => {
	const [gameState, setGameState] = useState('READY'); // CONNECT, READY, QUESTION, ANSWER, RESULT
	const [question, setQuestion] = useState(null);
	const [timer, setTimer] = useState(15);
	const [answer, setAnswer] = useState('');
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');
	const [betAmount, setBetAmount] = useState(10);
	const [balance, setBalance] = useState(1000);
	const [apiDetails, setApiDetails] = useState(null);
	const timerRef = useRef(null);

	useEffect(() => {
		// Initialize simulated wallet automatically
		initializeWallet();

		// Clean up timer on unmount
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (timer === 0) {
			handleTimeUp();
		}
	}, [timer]);

	const initializeWallet = async () => {
		const walletResult = await contractAPI.connectWallet();
		if (walletResult.success) {
			setBalance(walletResult.balance);
		}
	};

	const startGame = async () => {
		setError('');
		setApiDetails(null);

		try {
			// Validate bet amount
			if (betAmount > balance) {
				throw new Error(`Insufficient balance. You have ${balance} USDT.`);
			}

			// Approve tokens first (simulated)
			const approveResult = await contractAPI.approveTokens(betAmount);
			if (!approveResult.success) {
				throw new Error(`Failed to approve tokens: ${approveResult.error}`);
			}

			// Place bet (simulated)
			const betResult = await contractAPI.placeBet(betAmount);
			if (!betResult.success) {
				throw new Error(`Failed to place bet: ${betResult.error}`);
			}

			// Update balance
			setBalance(betResult.newBalance);

			// Get current question
			const questionResult = await contractAPI.getCurrentQuestion();
			if (!questionResult.success) {
				throw new Error(`Failed to get question: ${questionResult.error}`);
			}

			setQuestion(questionResult);
			setGameState('QUESTION');

			// Start timer
			setTimer(15);
			timerRef.current = setInterval(() => {
				setTimer(prevTimer => prevTimer - 1);
			}, 1000);
		} catch (err) {
			setError(err.message);
		}
	};

	const handleTimeUp = () => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
		}

		if (answer.trim() === '') {
			// If no answer provided, end the game
			setResult({
				success: false,
				isWinner: false,
				message: "Time's up! You didn't provide an answer."
			});
			setGameState('RESULT');
			return;
		}

		setGameState('ANSWER');
		submitAnswer();
	};

	const submitAnswer = async () => {
		setError('');

		try {
			// Submit answer to blockchain (simulated)
			const submitResult = await contractAPI.submitAnswer(answer);
			if (!submitResult.success) {
				throw new Error(`Failed to submit answer: ${submitResult.error}`);
			}

			// Call the API to evaluate the answer
			const oracleResult = await contractAPI.simulateOracleResponse(
				question.questionId,
				answer
			);

			// Update balance
			setBalance(oracleResult.newBalance);

			// Store API details for display
			if (oracleResult.apiResponse) {
				setApiDetails(oracleResult.apiResponse);
			}

			setResult(oracleResult);
			setGameState('RESULT');
		} catch (err) {
			setError(err.message);
			setGameState('READY');
		}
	};

	const resetGame = () => {
		setGameState('READY');
		setQuestion(null);
		setTimer(15);
		setAnswer('');
		setResult(null);
		setError('');
		setApiDetails(null);
	};

	const renderReady = () => (
		<div className="flex flex-col items-center">
			<div className="w-full text-right mb-4">
				<span className="font-bold text-green-600">Balance: {balance} USDT</span>
			</div>
			<h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
			<p className="mb-4">
				You'll be asked a question and have 15 seconds to provide an original answer.
			</p>
			<div className="mb-4">
				<label className="block text-gray-700 text-sm font-bold mb-2">
					Bet Amount (USDT):
					<select
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						value={betAmount}
						onChange={(e) => setBetAmount(parseInt(e.target.value))}
					>
						<option value="10">10 USDT</option>
						<option value="20">20 USDT</option>
						<option value="50">50 USDT</option>
						<option value="100">100 USDT</option>
					</select>
				</label>
			</div>
			<button
				className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
				onClick={startGame}
				disabled={betAmount > balance}
			>
				Start Game
			</button>
			{betAmount > balance && (
				<p className="text-red-500 mt-2 text-sm">Insufficient balance for this bet</p>
			)}
		</div>
	);

	const renderQuestion = () => (
		<div className="flex flex-col items-center">
			<div className="w-full text-right mb-4">
				<span className="font-bold text-green-600">Balance: {balance} USDT</span>
			</div>
			<div className="text-center">
				<div className="mb-2 text-xl font-bold">Time Remaining: {timer} seconds</div>
				<div className="w-full bg-gray-200 rounded-full h-2.5">
					<div
						className="bg-blue-600 h-2.5 rounded-full"
						style={{ width: `${(timer / 15) * 100}%` }}
					></div>
				</div>
			</div>
			<h2 className="text-2xl font-bold my-6">Question:</h2>
			<p className="text-xl mb-6">{question?.questionText}</p>
			<textarea
				className="w-full p-2 border border-gray-300 rounded mb-4 h-32"
				placeholder="Type your answer here..."
				value={answer}
				onChange={(e) => setAnswer(e.target.value)}
			></textarea>
		</div>
	);

	const renderAnswer = () => (
		<div className="flex flex-col items-center">
			<h2 className="text-2xl font-bold mb-4">Evaluating Your Answer...</h2>
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			<p className="mt-4 text-gray-600">Consulting the API to evaluate your response...</p>
		</div>
	);

	const renderResult = () => (
		<div className="flex flex-col items-center text-center">
			<div className="w-full text-right mb-4">
				<span className="font-bold text-green-600">Balance: {balance} USDT</span>
			</div>
			<h2 className="text-3xl font-bold mb-6">
				{result?.isWinner ? 'YOU WIN!' : 'YOU LOSE!'}
			</h2>
			<div className={`text-5xl font-bold mb-6 ${result?.isWinner ? 'text-green-500' : 'text-red-500'}`}>
				{result?.isWinner ? '+' + result.winAmount : '0'} USDT
			</div>

			<div className="mb-6 w-full">
				<h3 className="text-xl font-bold mb-2">Your Answer:</h3>
				<p className="text-lg mb-4 border p-4 rounded bg-gray-50">{answer}</p>

				{/* API Evaluation Results */}
				{apiDetails && (
					<div className="mt-4 border rounded p-4 bg-blue-50 text-left">
						<h4 className="font-bold text-lg mb-2">API Evaluation:</h4>
						<p className="mb-2">
							<span className="font-semibold">Is Basic:</span> {apiDetails.isBasic ? "Yes" : "No"}
						</p>
						{apiDetails.score !== undefined && (
							<p className="mb-2">
								<span className="font-semibold">Score:</span> {apiDetails.score}
							</p>
						)}
						{apiDetails.explanation && (
							<div className="mb-2">
								<span className="font-semibold">Explanation:</span>
								<p className="mt-1 text-sm">{apiDetails.explanation}</p>
							</div>
						)}
					</div>
				)}

				{/* Fallback message if API failed */}
				{result?.fallback && (
					<div className="mt-4 border rounded p-4 bg-yellow-50 text-left">
						<p className="text-sm text-yellow-700">
							<span className="font-bold">Note:</span> API evaluation failed, using simulated response instead.
							<br />
							Error: {result.error}
						</p>
					</div>
				)}
			</div>

			<button
				className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
				onClick={resetGame}
			>
				Play Again
			</button>
		</div>
	);

	const renderGameContent = () => {
		switch (gameState) {
			case 'READY':
				return renderReady();
			case 'QUESTION':
				return renderQuestion();
			case 'ANSWER':
				return renderAnswer();
			case 'RESULT':
				return renderResult();
			default:
				return renderReady();
		}
	};

	return (
		<div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
					<span className="block sm:inline">{error}</span>
				</div>
			)}
			{renderGameContent()}
		</div>
	);
};

export default Game; 