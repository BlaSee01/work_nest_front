// app/home/workplaces/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getToken } from "../../../utils/auth";

export default function CreateWorkplacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5170/api/workplaces/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
    
      if (!response.ok) {
        throw new Error("Błąd podczas tworzenia miejsca pracy.");
      }
  
      // const data = await response.json();
  
      router.push('/home/workplaces');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-pink-50 to-pink-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Utwórz nowe miejsce pracy</h1>
        <input
          type="text"
          placeholder="Nazwa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />
        <textarea
          placeholder="Opis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        ></textarea>
        <button
          onClick={handleCreate}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
        >
          Utwórz
        </button>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/home/workplaces')}
            className="px-6 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          >
            Wróć
          </button>
        </div>
      </div>
    </div>
  );  
}