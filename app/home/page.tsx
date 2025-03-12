"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, refreshToken } from "../utils/auth";

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("token"); 
    router.push("/login"); 
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5170/api/home", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Błąd podczas ładowania danych.");
        }

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();

    const interval = setInterval(async () => {  // refresh tokena, w nstepnych globalnie powinienem
      const token = getToken();
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1])); 
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();

        if (expirationTime - currentTime < 5 * 60 * 1000) { // jak to sie ma do exp w BE (?)
          await refreshToken();
        }
      }
    }, 60 * 1000); 

    return () => clearInterval(interval); 
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl text-red-600">Błąd: {error}</h1>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl">Ładowanie danych...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-50 to-purple-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{data.message}</h1>
      <h2 className="text-2xl text-gray-700 mb-6">Twoja rola: {data.role}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.sections.map((section: any, index: number) => (
          <div
            key={index}
            className="border p-6 rounded-lg shadow-lg cursor-pointer bg-white hover:bg-gray-50 transform transition duration-300 hover:scale-105"
            onClick={() => {
              if (section.title === "Twoje miejsce pracy") {
                router.push("/home/workplaces");
              } else if (section.title === "Profil") {
                router.push("/home/profile");
              } else if (section.title === "Zadania") {
                router.push("/home/tasks");
              } else {
                alert("Funkcja w budowie!");
              }
            }}
          >
            <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
            <p className="text-gray-600">{section.description}</p>
          </div>
        ))}
      </div>
      <button
        onClick={handleLogout}
        className="mt-8 px-6 py-3 bg-red-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
      >
        Wyloguj
      </button>
    </div>
  );
}  