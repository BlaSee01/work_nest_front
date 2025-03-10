"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../../utils/auth";

export default function WorkplaceDetails({ id }: { id: string }) {
  const router = useRouter();
  const [workplace, setWorkplace] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false); 
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    address: "",
    postalCode: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchWorkplace = async () => {
      const token = getToken();
      if (!token) {
        console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
        router.push("/login");
        return;
      }

      try {
        const base64Payload = token.split(".")[1];
        const decodedPayload = atob(base64Payload);
        const tokenPayload = JSON.parse(decodedPayload);

        const userIdFromToken = tokenPayload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        setLoggedUserId(userIdFromToken);

        console.log("UserId:",userIdFromToken);

        const response = await fetch(
          `http://localhost:5170/api/workplaces/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Błąd podczas pobierania szczegółów miejsca pracy.");
        }

        const data = await response.json();

        console.log("Pełne dane obiektu workplace:", data);
        setWorkplace(data);
        
        setEditForm({
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          postalCode: data.postalCode || "",
          email: data.email || "",
          phone: data.phone || "",
        });

        

        // czy ownerid = userid START
        const ownerId = Number(data.ownerId); 
        const loggedUserIdNumber = Number(userIdFromToken); 

        
        // logi na stałe:

        console.log("OwnerId z obiektu workplace:", ownerId);
        console.log("LoggedUserId:", loggedUserIdNumber);

        setIsOwner(ownerId === loggedUserIdNumber); 

        const memberRole = data.members.find(
          (member: any) => member.employee?.id === userIdFromToken
        )?.role;

        setRole(memberRole || null);
      
      const roleResponse = await fetch(`http://localhost:5170/api/workplaces/${id}/user-role`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        setUserRole(roleData.role);
        console.log("Rola użytkownika:", roleData.role);
      } else {
        console.error("Błąd podczas pobierania roli użytkownika:", roleResponse.statusText);
      }
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

    fetchWorkplace();
  }, [id, router]);

  const handleSearch = async () => {
    setIsLoading(true);
    const token = getToken();
  
    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${id}/search-users?query=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!response.ok) {
        throw new Error("Błąd podczas wyszukiwania użytkowników.");
      }
  
      const data = await response.json();
  
      // to można przenieśc do wyszukiwania w grupach i zdanaiahc - for later
      const filteredData = searchQuery.trim()
        ? data.filter((user: any) =>
            `${user.employee?.firstName.toLowerCase()} ${user.employee?.lastName.toLowerCase()}`.includes(searchQuery.toLowerCase())
          )
        : data.filter((user: any) => !user.workplaceId);
  
      const mappedResults = filteredData.map((user: any) => ({
        ...user,
        name: user.employee
          ? `${user.employee.firstName} ${user.employee.lastName}`
          : "Nieznana nazwa",
      }));
      setSearchResults(mappedResults);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (userId: string | number) => {
    const token = getToken();

    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${id}/add-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(Number(userId)),
        }
      );

      if (!response.ok) {
        throw new Error("Błąd podczas dodawania użytkownika.");
      }

      alert("Użytkownik został dodany.");
      setSearchResults([]);

      const updatedResponse = await fetch(
        `http://localhost:5170/api/workplaces/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (updatedResponse.ok) {
        const updatedWorkplace = await updatedResponse.json();
        setWorkplace(updatedWorkplace);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateWorkplace = async () => {
    const token = getToken();

    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        throw new Error("Błąd podczas edytowania miejsca pracy.");
      }

      alert("Dane miejsca pracy zostały zaktualizowane.");

      const updatedResponse = await fetch(
        `http://localhost:5170/api/workplaces/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (updatedResponse.ok) {
        const updatedWorkplace = await updatedResponse.json();
        setWorkplace(updatedWorkplace);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBackToWorkplaces = () => {
    router.push("/home/workplaces");
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!workplace) {
    return <p>Ładowanie szczegółów...</p>;
  }

  const handleRoleChange = async (userId: number, currentRole: string) => {

    if (!userId) {
      console.error("Nie można zmienić roli - brak userId.");
      return;
    }

    const newRole = currentRole === "member" ? "manager" : "member"; //  między 'member' a 'manager' tylko
  const confirmChange = window.confirm(
    `Czy na pewno chcesz zmienić rolę użytkownika na ${newRole}?`
  );
  
  console.log("Przekazywane dane do handleRoleChange:", { userId, currentRole });
    if (!confirmChange) return;
  
    const token = getToken();
    console.log("Wysyłane dane:", {
      userId,
      role: newRole,
    });
    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${id}/update-role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            role: newRole,
          }),
          
        }
      );
  
      if (!response.ok) {
        throw new Error("Błąd podczas zmiany roli użytkownika.");
      }
  
      alert("Rola użytkownika została zmieniona.");
  
      const updatedResponse = await fetch(
        `http://localhost:5170/api/workplaces/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (updatedResponse.ok) {
        const updatedWorkplace = await updatedResponse.json();
        setWorkplace(updatedWorkplace);
      }
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!userId) {
      console.error("Nie można usunąć użytkownika - brak userId.");
      return;
    }

    const confirmRemove = window.confirm('Czy na pewno chcesz usunąć tego użytkownika?');
    if (!confirmRemove) return;

    const token = getToken();

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${id}/remove-user/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania użytkownika.");
      }

      alert("Użytkownik został usunięty.");

      const updatedResponse = await fetch(
        `http://localhost:5170/api/workplaces/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (updatedResponse.ok) {
        const updatedWorkplace = await updatedResponse.json();
        setWorkplace(updatedWorkplace);
      }
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };
  const handleGoToWorkGroups = () => {
    router.push(`/home/workplaces/${id}/workgroups`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-yellow-50 to-yellow-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <center>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">{workplace.name}</h1>
          <p className="italic text-gray-600 mb-6">{workplace.description}</p>
  
          <p className="text-lg mb-2">
            <strong>Adres:</strong> {workplace.address || "Brak danych"}
          </p>
          <p className="text-lg mb-2">
            <strong>Kod pocztowy:</strong> {workplace.postalCode || "Brak danych"}
          </p>
          <p className="text-lg mb-2">
            <strong>Email:</strong> {workplace.email || "Brak danych"}
          </p>
          <p className="text-lg mb-6">
            <strong>Telefon:</strong> {workplace.phone || "Brak danych"}
          </p>
        </center>
  
        <center><h2 className="text-2xl font-bold mb-4">Pracownicy</h2></center>
        <ul className="list-disc mb-6 flex flex-col items-center">
          {Array.isArray(workplace.members) && workplace.members.length > 0 ? (
            workplace.members.map((member: any, index: number) => {
              const employee = member.employee;
              const displayName = employee
                ? `${employee.firstName} ${employee.lastName}`
                : member.username || "Nieznany użytkownik";
              const email = employee?.email || "Brak emaila";
              const phone = employee?.phoneNumber || "Brak telefonu";
              const address = employee?.address || "Brak adresu";
  
              return (
                <li key={member.id || `member-${index}`} className="mb-4 w-full max-w-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-lg text-gray-800"><strong>Imię:</strong> {displayName}</p>
                      <p className="text-lg text-gray-800"><strong>Rola:</strong> {member.role || "Brak roli"}</p>
                      <p className="text-lg text-gray-800"><strong>Email:</strong> {email}</p>
                      <p className="text-lg text-gray-800"><strong>Telefon:</strong> {phone}</p>
                      <p className="text-lg text-gray-800"><strong>Adres:</strong> {address}</p>
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleRoleChange(member.userId, member.role)}
                          className="px-4 py-2 bg-blue-500 text-white rounded shadow-lg transform transition duration-300 hover:scale-105"
                        >
                          Zmień rolę
                        </button>
                        <button
                          onClick={() => handleRemoveUser(member.userId)}
                          className="px-4 py-2 bg-red-500 text-white rounded shadow-lg transform transition duration-300 hover:scale-105"
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-gray-600">Brak pracowników</li>
          )}
        </ul>
  
        <center>
          {(userRole?.toLowerCase() === 'owner' || userRole?.toLowerCase() === 'manager') && (
            <>
              <button
                onClick={handleGoToWorkGroups}
                className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
              >
                Przejdź do grup roboczych
              </button>
              <button
                onClick={() => router.push(`/home/workplaces/${workplace.id}/tasks`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4 ml-4"
              >
                Przejdź do zadań
              </button>
            </>
          )}
  
          {isOwner && (
            <div className="mt-8 w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-4">Dodaj pracownika</h2>
              <input
                type="text"
                placeholder="Wpisz nazwisko pracownika"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
              >
                Szukaj
              </button>
              {isLoading && <p className="text-gray-600 mt-2">Ładowanie wyników...</p>}
              <ul className="mt-4">
                {searchResults.map((user: any) => (
                  <li key={user.id} className="flex justify-between items-center mt-2">
                    <span>{user.name}</span>
                    <button
                      onClick={() => handleAddUser(user.id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
                    >
                      Dodaj
                    </button>
                  </li>
                ))}
              </ul>
  
              <h2 className="text-2xl font-bold mt-8 mb-4">Edytuj miejsce pracy</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateWorkplace();
                }}
              >
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Nazwa</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Opis</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Adres</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Kod pocztowy</label>
                  <input
                    type="text"
                    value={editForm.postalCode}
                    onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Telefon</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mt-4"
                >
                  Zapisz zmiany
                </button>
              </form>
            </div>
          )}
          
        </center>
      </div>
      <center>
      <button
            onClick={handleBackToWorkplaces}
            className="mt-8 px-6 py-3 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          >
            Wróć do miejsc pracy
          </button>
          </center>
          <br />
    </div>
  );
}  