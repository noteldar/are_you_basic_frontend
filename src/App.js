import React from 'react';
import Game from './components/Game';

function App() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-10">
			<header className="max-w-4xl mx-auto mb-10 text-center">
				<h1 className="text-4xl font-bold text-blue-800 mb-2">Are You Basic?</h1>
				<h2 className="text-2xl text-purple-700">Blockchain Q&A Game <span className="text-sm font-normal">(Simulation Mode)</span></h2>
			</header>

			<main className="max-w-4xl mx-auto p-4">
				{/* Game Component */}
				<Game />
			</main>

			<footer className="mt-10 text-center text-gray-600">
				<p>&copy; 2023 Are You Basic Blockchain Game</p>
				<p className="text-sm mt-1">Running in simulation mode with virtual USDT</p>
			</footer>
		</div>
	);
}

export default App; 