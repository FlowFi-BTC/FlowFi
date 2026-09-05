import { useCallback, useState } from 'react';
import reactLogo from '/react.svg';
import viteLogo from '/vite.svg';

export const App = () => {
  const [count, setCount] = useState(0);

  const increase = useCallback(() => {
    setCount((count) => count + 1);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
      <div className="mb-8 flex gap-8">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img
            src={viteLogo}
            className="h-24 w-24 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img
            src={reactLogo}
            className="h-24 w-24 animate-spin transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa]"
            alt="React logo"
            style={{ animationDuration: '20s' }}
          />
        </a>
      </div>

      <h1 className="mb-8 text-center text-4xl font-bold">Vite + React</h1>

      <div className="mb-8 flex flex-col items-center justify-center rounded-lg bg-gray-800 p-6 shadow-lg">
        <button
          type="button"
          onClick={increase}
          className="mb-4 rounded bg-gray-700 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-gray-600"
        >
          count is {count}
        </button>
        <p className="text-gray-300">
          Edit{' '}
          <code className="rounded bg-gray-700 px-2 py-1 text-yellow-300">
            src/App.tsx
          </code>{' '}
          and save to test HMR
        </p>
      </div>

      <p className="text-center text-gray-400">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
};
