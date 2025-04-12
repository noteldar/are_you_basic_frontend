import React, { useState, useEffect, useRef } from 'react';
import contractAPI from '../contractAPI';

const Game = ({ walletAddress, onWalletChange }) => {
	const [gameState, setGameState] = useState('READY'); // CONNECT, READY, QUESTION, ANSWER, RESULT
	const [question, setQuestion] = useState(null);
	const [timer, setTimer] = useState(15);
	const [answer, setAnswer] = useState('');
	const [result, setResult] = useState(null);
	const [error, setError] = useState('');
	const [balance, setBalance] = useState(10);
	const [consecutiveWins, setConsecutiveWins] = useState(0);
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
			setConsecutiveWins(walletResult.consecutiveWins || 0);
		}
	};

	const startGame = async () => {
		setError('');
		setApiDetails(null);

		try {
			// Each game costs 1 USDT to play
			if (balance < 1) {
				throw new Error(`Insufficient balance. You need at least 1 USDT to play.`);
			}

			// Place bet (always costs 1 USDT)
			const betResult = await contractAPI.placeBet(1);
			if (!betResult.success) {
				throw new Error(`Failed to place bet: ${betResult.error}`);
			}

			// Update balance
			setBalance(betResult.newBalance);
			setConsecutiveWins(betResult.consecutiveWins);

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
			// If no answer provided, player loses
			setResult({
				success: false,
				isWinner: false,
				message: "TIME'S UP! TOO SLOW!",
				consecutiveWins: 0
			});
			setConsecutiveWins(0); // Reset consecutive wins
			setGameState('RESULT');
			return;
		}

		setGameState('ANSWER');
		submitAnswer();
	};

	const handleSubmit = () => {
		// Clear timer
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		// Check if answer is empty
		if (answer.trim() === '') {
			setError("Please provide an answer before submitting.");
			return;
		}

		// Submit answer
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

			// Update balance and consecutive wins
			setBalance(oracleResult.newBalance);
			setConsecutiveWins(oracleResult.consecutiveWins);

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
		if (balance <= 0) {
			// Game over if no money left
			setGameState('GAME_OVER');
		} else {
			setGameState('READY');
			setQuestion(null);
			setTimer(15);
			setAnswer('');
			setResult(null);
			setError('');
			setApiDetails(null);
		}
	};

	const renderReady = () => (
		<div className="flex flex-col items-center">
			<div className="w-full flex justify-between mb-4">
				<span className="font-bold text-blue-600">Consecutive Wins: {consecutiveWins}</span>
				<span className="font-bold text-green-600">Bank: ${balance}</span>
			</div>
			<div className="border-b border-gray-300 w-full mb-4"></div>
			<h2 className="text-2xl font-bold mb-4">Are You Basic?</h2>
			<p className="mb-4 text-center">
				Prove your humanity by giving non-basic responses.<br />
				If you sound like AI or give nonsense, you're BASIC!
			</p>
			<div className="mb-6 bg-gray-100 p-4 rounded-md w-full">
				<h3 className="font-bold mb-2">Rules:</h3>
				<ol className="list-decimal pl-5">
					<li>Each round costs $1 to play</li>
					<li>Win $10 for your first non-basic response</li>
					<li>Win $20 for your second consecutive win</li>
					<li>Win $50 for your third consecutive win or more</li>
					<li>If your response is basic, you lose your consecutive wins</li>
					<li>You have 15 seconds to answer each question</li>
					<li>Game over when you run out of money</li>
				</ol>
			</div>
			<button
				className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
				onClick={startGame}
				disabled={balance < 1}
			>
				Start Game ($1)
			</button>
			{balance < 1 && (
				<p className="text-red-500 mt-2 text-sm">Insufficient balance to play</p>
			)}
		</div>
	);

	const renderQuestion = () => (
		<div className="flex flex-col items-center">
			<div className="w-full flex justify-between mb-4">
				<span className="font-bold text-blue-600">Consecutive Wins: {consecutiveWins}</span>
				<span className="font-bold text-green-600">Bank: ${balance}</span>
			</div>
			<div className="border-b border-gray-300 w-full mb-4"></div>
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
			<button
				className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
				onClick={handleSubmit}
				disabled={answer.trim() === ''}
			>
				Submit Answer
			</button>
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
			<div className="w-full flex justify-between mb-4">
				<span className="font-bold text-blue-600">Consecutive Wins: {consecutiveWins}</span>
				<span className="font-bold text-green-600">Bank: ${balance}</span>
			</div>
			<div className="border-b border-gray-300 w-full mb-4"></div>

			{result?.isWinner ? (
				<>
					<h2 className="text-3xl font-bold mb-6 text-green-500">NOT BASIC!</h2>
					<div className="text-4xl font-bold mb-6 text-green-600">
						+${result.winAmount}
					</div>
				</>
			) : (
				<>
					<h2 className="text-3xl font-bold mb-2 text-red-500">Y O U  A R E  B A S I C !</h2>
					<div className="p-1 border-t border-b border-red-500 w-full mb-6">
						<p className="text-red-500">You lose this round.</p>
					</div>
				</>
			)}

			<div className="mb-6 w-full">
				<h3 className="text-xl font-bold mb-2">Your Answer:</h3>
				<p className="text-lg mb-4 border p-4 rounded bg-gray-50">{answer}</p>

				{/* API Evaluation Results */}
				{apiDetails && (
					<div className="mt-4 border rounded p-4 bg-blue-50 text-left">
						<h4 className="font-bold text-lg mb-2">Evaluation Results:</h4>
						{apiDetails.final_score !== undefined && (
							<p className="mb-2">
								<span className="font-semibold">Final Score:</span> {apiDetails.final_score.toFixed(3)}
							</p>
						)}
						{apiDetails.ai_detection_score !== undefined && (
							<p className="mb-2">
								<span className="font-semibold">AI Detection Score:</span> {apiDetails.ai_detection_score.toFixed(3)}
							</p>
						)}
						{apiDetails.coherence_score !== undefined && (
							<p className="mb-2">
								<span className="font-semibold">Coherence Score:</span> {apiDetails.coherence_score.toFixed(3)}
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
				{balance <= 0 ? "Game Over" : "Play Again"}
			</button>
		</div>
	);

	const renderGameOver = () => (
		<div className="flex flex-col items-center text-center">
			<h2 className="text-3xl font-bold mb-6">Game Over!</h2>
			<p className="text-xl mb-8">You've run out of money!</p>
			<button
				className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
				onClick={() => window.location.reload()}
			>
				Start New Game
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
			case 'GAME_OVER':
				return renderGameOver();
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