'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '../utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    try {
      const response = await fetch('http://localhost:5170/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Nieprawidłowe dane logowania.');
      }

      const { token } = await response.json();
      setToken(token); // tu do localstorage wchodzi.
      router.push('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Logowanie</h1>
        <input
          type="text"
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
        >
          Zaloguj się
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
        >
          Powrót na stronę główną
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}