import React from 'react';
import Game from './components/Game';

function App() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 py-10">
			<header className="max-w-4xl mx-auto mb-10 text-center">
				<h1 className="text-4xl font-bold text-white mb-2">A R E  Y O U  B A S I C ?</h1>
				<div className="border-b border-gray-600 w-48 mx-auto my-4"></div>
			</header>

			<main className="max-w-4xl mx-auto p-4">
				{/* Game Component */}
				<Game />
			</main>

			<footer className="mt-10 text-center text-gray-400">
				<p>Prove your humanity by giving non-basic responses</p>
				<p className="text-sm mt-3">Using local API at http://localhost:8000/evaluate</p>
			</footer>
		</div>
	);
}

export default App; 