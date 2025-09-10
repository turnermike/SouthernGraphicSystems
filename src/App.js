import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <img src={logo} className="w-20 h-20 mx-auto mb-4 animate-spin" alt="logo" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            React + Tailwind CSS
          </h1>
          <p className="text-gray-600 mb-6">
            Your React app with Tailwind CSS is ready! 
            <span className="block mt-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              Edit src/App.js and save to reload.
            </span>
          </p>
          <a
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <div className="mt-4">
            <a
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 ml-2"
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn Tailwind
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
