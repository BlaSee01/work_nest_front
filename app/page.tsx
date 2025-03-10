'use client';

import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100">
      <h1 className="text-5xl font-bold text-gray-800 mb-8">Witamy w WorkNest HRMS!</h1>
      <div className="flex gap-6">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          onClick={() => router.push('/register')}
        >
          Zarejestruj się
        </button>
        <button
          className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          onClick={() => router.push('/login')}
        >
          Zaloguj się
        </button>
      </div>
    </div>
  );
}
