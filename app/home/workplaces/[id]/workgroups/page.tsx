'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../../utils/auth';
import React from 'react';

export default function WorkGroupsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: workplaceId } = React.use(params);
  const [workGroups, setWorkGroups] = useState<any[]>([]);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
  const [searchResults, setSearchResults] = useState<{ [key: number]: any[] }>({});
  const [selectedUserIds, setSelectedUserIds] = useState<{ [key: number]: number | null }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workplaceId) {
      console.error('workplaceId is null');
      return;
    }

    const fetchWorkGroups = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Błąd podczas pobierania grup roboczych.');
        }

        const data = await response.json();
        setWorkGroups(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchWorkGroups();
  }, [router, workplaceId]);

  const handleCreateWorkGroup = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    if (!workplaceId) {
      console.error('workplaceId is null');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas tworzenia grupy roboczej.');
      }

      const newWorkGroup = await response.json();
      setWorkGroups([...workGroups, newWorkGroup]);
      setName('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSearchUser = async (workGroupId: number) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const searchTerm = searchTerms[workGroupId];
    if (!searchTerm) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups/${workGroupId}/search-user?lastName=${searchTerm}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Błąd podczas wyszukiwania użytkowników.');
      }

      const data = await response.json();
      setSearchResults(prevResults => ({ ...prevResults, [workGroupId]: data }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddUserToWorkGroup = async (workGroupId: number) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const selectedUserId = selectedUserIds[workGroupId];
    if (!selectedUserId) {
      alert('Proszę wybrać użytkownika.');
      return;
    }

    const selectedGroup = workGroups.find(group => group.id === workGroupId);
    if (selectedGroup && selectedGroup.members.some((member: any) => member.id === selectedUserId)) {
      alert('Użytkownik już jest w grupie.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups/${workGroupId}/add-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas dodawania użytkownika do grupy roboczej.');
      }

      const updatedResponse = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setWorkGroups(updatedData);
        setSearchTerms(prevTerms => ({ ...prevTerms, [workGroupId]: '' }));
        setSearchResults(prevResults => ({ ...prevResults, [workGroupId]: [] }));
        setSelectedUserIds(prevIds => ({ ...prevIds, [workGroupId]: null }));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveUserFromWorkGroup = async (workGroupId: number, userId: number) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups/${workGroupId}/remove-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas usuwania użytkownika z grupy roboczej.');
      }

      const updatedResponse = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setWorkGroups(updatedData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteWorkGroup = async (workGroupId: number) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups/${workGroupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json(); 
        alert(`Błąd podczas usuwania grupy roboczej: ${errorData.message}`);
        return;
      }

      const updatedResponse = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/workgroups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setWorkGroups(updatedData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSearchTermChange = (workGroupId: number, value: string) => {
    setSearchTerms(prevTerms => ({ ...prevTerms, [workGroupId]: value }));
  };

  const handleUserSelect = (workGroupId: number, userId: number) => {
    setSelectedUserIds(prevIds => ({ ...prevIds, [workGroupId]: userId }));
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!workGroups.length) {
    return (<center>
      <div>
      <h1 className="text-2xl font-bold">Grupy robocze</h1>
      <div className="mt-4 w-full max-w-lg">
        <h2 className="text-xl font-bold">Utwórz nową grupę roboczą</h2>
        <input
          type="text"
          placeholder="Nazwa grupy"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <textarea
          placeholder="Opis grupy"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded w-full mt-2"
        ></textarea>
        <button
          onClick={handleCreateWorkGroup}
          className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
        >
          Utwórz
        </button>
      </div><br></br>
        <p className="text-red-500 text-xl font-bold">Brak grup roboczych do wyświetlenia.</p><br></br>
        <button
          onClick={() => router.push(`/home/workplaces/${workplaceId}`)}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
        >
          Wróć do miejsca pracy
        </button>
      </div></center>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-50 to-green-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full mb-8">
        <div className="mt-8 w-full max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Utwórz nową grupę roboczą</h2>
          <input
            type="text"
            placeholder="Nazwa grupy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-4 rounded-lg w-full mb-4"
          />
          <textarea
            placeholder="Opis grupy"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-4 rounded-lg w-full mb-4"
          ></textarea>
          <button
            onClick={handleCreateWorkGroup}
            className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
          >
            Utwórz
          </button>
        </div>
      </div>
  
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <div className="mt-8 w-full max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista grup roboczych</h2>
          <ul>
            {workGroups.map((group) => (
              <li
                key={group.id}
                className="mb-4 border p-4 rounded-lg shadow-lg bg-white"
              >
                <h3 className="text-xl font-semibold text-gray-800">{group.name}</h3>
                <p className="text-gray-600">{group.description}</p>
                <h4 className="text-lg font-bold text-gray-800 mt-4">Członkowie:</h4>
                <ul className="list-disc ml-5">
                  {Array.isArray(group.members) && group.members.length ? (
                    group.members.map((member: any) => (
                      <li key={member.id} className="flex justify-between items-center">
                        <span>{member.firstName} {member.lastName}</span>
                        <button
                          onClick={() => handleRemoveUserFromWorkGroup(group.id, member.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 ml-4"
                        >
                          Usuń
                        </button>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-600">Brak członków w tej grupie.</p>
                  )}
                </ul>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Szukaj użytkownika po nazwisku"
                    value={searchTerms[group.id] || ''}
                    onChange={(e) => handleSearchTermChange(group.id, e.target.value)}
                    className="border p-4 rounded-lg w-full mb-4"
                  />
                  <button
                    onClick={() => handleSearchUser(group.id)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
                  >
                    Szukaj
                  </button>
                  <ul className="list-disc ml-5">
                    {searchResults[group.id]?.map((user) => (
                      <li
                        key={user.id}
                        onClick={() => handleUserSelect(group.id, user.id)}
                        className="cursor-pointer hover:bg-gray-200 p-2 rounded mb-2"
                      >
                        {user.firstName} {user.lastName}
                      </li>
                    ))}
                  </ul>
                  {selectedUserIds[group.id] && (
                    <button
                      onClick={() => handleAddUserToWorkGroup(group.id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
                    >
                      Dodaj użytkownika
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteWorkGroup(group.id)}
                    className="px-6 py-3 bg-red-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
                  >
                    Usuń grupę roboczą
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
      </div>
      <center>
        <button
          onClick={() => router.push(`/home/workplaces/${workplaceId}`)}
          className="mt-8 px-6 py-3 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
        >
          Wróć do miejsca pracy
        </button>
        </center>
        <br />
    </div>
  );
}  