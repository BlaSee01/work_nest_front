'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:5170/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setMessage('Rejestracja udana! Przekierowanie na stronę logowania...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setMessage('Błąd podczas rejestracji.');
      }
    } catch (error) {
      setMessage('Błąd sieci.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Zarejestruj się</h1>
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
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
          onClick={handleRegister}
        >
          Zarejestruj
        </button>
        <button
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          onClick={() => router.push('/')}
        >
          Powrót na stronę główną
        </button>
        {message && <p className="text-center mt-4">{message}</p>}
      </div>
    </div>
  );
}
