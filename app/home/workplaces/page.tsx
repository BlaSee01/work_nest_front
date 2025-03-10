'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../utils/auth';

export default function WorkplacesPage() {
  const router = useRouter();
  const [workplaces, setWorkplaces] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchWorkplaces = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const base64Payload = token.split(".")[1];
      const decodedPayload = atob(base64Payload);
      const tokenPayload = JSON.parse(decodedPayload);

      const userIdFromToken = tokenPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      setLoggedUserId(Number(userIdFromToken));

      console.log("UserId:", userIdFromToken);

      try {
        const response = await fetch('http://localhost:5170/api/workplaces/my', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Błąd podczas pobierania miejsc pracy.');
        }

        const data = await response.json();
        setWorkplaces(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchWorkplaces();
  }, [router]);

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation(); // aby błedu nei krzyczało, mimo pomyslności ooperacji

    const confirmDelete = window.confirm('Czy na pewno chcesz usunąć to miejsce pracy?');
    if (!confirmDelete) return;

    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania miejsca pracy.");
      }
      // workpalces apdejt
      setWorkplaces(workplaces.filter((wp: any) => wp.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-50 to-green-100">
      <h1 className="text-5xl font-bold text-black-700 mb-8">Twoje miejsca pracy</h1>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-6"
        onClick={() => router.push('/home/workplaces/create')}
      >
        Dodaj nowe miejsce pracy
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workplaces.map((workplace) => {
          console.log(`Comparing loggedUserId: ${loggedUserId} with ownerId: ${workplace.ownerId}`);
          return (
            <div
              key={workplace.id}
              className="relative border p-6 rounded-lg shadow-lg cursor-pointer bg-white hover:bg-blue-50 transform transition duration-300 hover:scale-105"
              onClick={() => router.push(`/home/workplaces/${workplace.id}`)}
            >
              {loggedUserId === workplace.ownerId && (
                <button
                  onClick={(event) => handleDelete(workplace.id, event)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                >
                  &#10005;
                </button>
              )}
              <h3 className="text-xl font-semibold text-gray-800">{workplace.name}</h3>
              <p className="text-gray-600">{workplace.description}</p>
            </div>
          );
        })}
      </div>
  
      <div className="mt-6">
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-3 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
        >
          Powrót do Panelu Głównego
        </button>
      </div>
    </div>
  ); 
}