import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');

  const handle = (e) => {
    e.preventDefault();
    if (username.trim().length >= 2) onLogin(username.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-night-950">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-wolf-400 mb-2">🐺</h1>
          <h1 className="text-4xl font-bold text-moon-300 mb-1">Loup-Garou</h1>
          <p className="text-moon-400 opacity-60">Le jeu de déduction sociale</p>
        </div>
        <form onSubmit={handle} className="bg-night-800 p-8 rounded-2xl border border-night-600 w-80">
          <label className="block text-moon-400 text-sm mb-2 text-left">
            Votre pseudonyme
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="ex: Pierre, Marie..."
            minLength={2}
            maxLength={20}
            required
            className="w-full bg-night-900 border border-night-600 text-moon-300
                       rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-wolf-400
                       placeholder-moon-400 placeholder-opacity-30"
          />
          <button
            type="submit"
            className="w-full bg-wolf-400 hover:bg-wolf-500 text-white font-bold
                       py-3 rounded-lg transition-colors duration-200"
          >
            Entrer dans le village
          </button>
        </form>
      </div>
    </div>
  );
}