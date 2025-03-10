"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../utils/auth";

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }
  
      try {
        const base64Payload = token.split(".")[1];
        const decodedPayload = atob(base64Payload);
        const tokenPayload = JSON.parse(decodedPayload);

        console.log("Token Payload:", tokenPayload); // zostawić.

        const userId = tokenPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        if (!userId) {
          throw new Error("Nie udało się uzyskać ID użytkownika z tokena.");
        }
        console.log(`Requesting user data with userId: ${userId}`);
        console.log(`API URL: http://localhost:5170/api/employee/${userId}`);
        
        const response = await fetch(`http://localhost:5170/api/employee/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (!response.ok) {
          throw new Error("Błąd podczas ładowania danych użytkownika.");
        }
  
        const data = await response.json();
        setUserData(data);
        setFormData(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
  
    fetchData();
  }, [router]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5170/api/employee/${userData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        throw new Error("Błąd podczas zapisywania danych.");
      }
  
      const updatedData = await response.json(); // dane serwera tu
      setUserData(updatedData);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };
  

  if (error) {
    return <p className="text-red-600">Błąd: {error}</p>;
  }

  if (!userData) {
    return <p>Ładowanie danych...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-yellow-50 to-yellow-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Profil użytkownika</h1>
  
        {isEditing ? (
          <>
            <label className="block mb-2 text-lg font-medium text-gray-700">Imię:</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-4"
            />
  
            <label className="block mb-2 text-lg font-medium text-gray-700">Nazwisko:</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-4"
            />
  
            <label className="block mb-2 text-lg font-medium text-gray-700">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-4"
            />
  
            <label className="block mb-2 text-lg font-medium text-gray-700">Telefon:</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-4"
            />
  
            <label className="block mb-2 text-lg font-medium text-gray-700">Adres:</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-4"
            />
  
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mr-2"
              >
                Zapisz
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
              >
                Anuluj
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-lg text-gray-800"><strong>Imię:</strong> {userData.firstName}</p>
            <p className="mb-2 text-lg text-gray-800"><strong>Nazwisko:</strong> {userData.lastName}</p>
            <p className="mb-2 text-lg text-gray-800"><strong>Email:</strong> {userData.email}</p>
            <p className="mb-2 text-lg text-gray-800"><strong>Telefon:</strong> {userData.phoneNumber}</p>
            <p className="mb-4 text-lg text-gray-800"><strong>Adres:</strong> {userData.address}</p>
            
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
            >
              Edytuj
            </button>
            <br />
            <button
              onClick={() => router.push("/home")}
              className="px-6 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
            >
              Powrót do Strony Głównej
            </button>
          </div>
        )}
      </div>
    </div>
  );  
}