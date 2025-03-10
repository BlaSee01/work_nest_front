'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../../utils/auth';
import React from 'react';

type Params = {
  id: string;
};

type Task = {
  id: number;
  content: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedUserId: number | null;
  assignedWorkGroupId: number | null;
  assignedUser?: { firstName: string; lastName: string };
  assignedWorkGroup?: { name: string };
  attachments: string[];
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type WorkGroup = {
  id: number;
  name: string;
};

type ErrorType = string | null;

export default function TasksPage({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { id: workplaceId } = React.use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [content, setContent] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>(''); 
  const [priority, setPriority] = useState<string>('Niski'); 
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [assignedWorkGroupId, setAssignedWorkGroupId] = useState<number | null>(null);
  const [searchQueryUser, setSearchQueryUser] = useState<string>('');
  const [searchQueryGroup, setSearchQueryGroup] = useState<string>('');
  const [searchResultsUser, setSearchResultsUser] = useState<User[]>([]);
  const [searchResultsGroup, setSearchResultsGroup] = useState<WorkGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorType>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = getToken();
      if (!token) {
        console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Błąd podczas pobierania zadań.');
        }

        const data: Task[] = await response.json();
        setTasks(data);
      } catch (err: any) {
        console.error("Wystąpił błąd:", err.message);
        setError(err.message);
      }
    };

    fetchTasks();
  }, [workplaceId, router]);

  const handleSearchUsers = async () => {
    setIsLoading(true);
    const token = getToken();
  
    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${workplaceId}/search-users-workgroup?query=${encodeURIComponent(searchQueryUser)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!response.ok) {
        throw new Error("Błąd podczas wyszukiwania użytkowników.");
      }
  
      const data = await response.json();
      setSearchResultsUser(data.map((user: any) => ({
        id: user.id,
        firstName: user.employee?.firstName || '',
        lastName: user.employee?.lastName || ''
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchGroups = async () => {
    setIsLoading(true);
    const token = getToken();
  
    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${workplaceId}/search-workgroups?query=${encodeURIComponent(searchQueryGroup)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!response.ok) {
        throw new Error("Błąd podczas wyszukiwania grup roboczych.");
      }
  
      const data = await response.json();
      setSearchResultsGroup(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }

    if (!content || !dueDate || !dueTime || !priority) {
      alert("Podaj wszystkie wymagane wartości");
      return;
    }

    if ((assignedUserId && assignedWorkGroupId) || (!assignedUserId && !assignedWorkGroupId)) {
      setError("Musisz podać albo użytkownika, albo grupę roboczą, ale nie obie wartości.");
      return;
    }

    const dueDateTime = `${dueDate}T${dueTime}:00Z`; 

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, dueDate: dueDateTime, priority, assignedUserId, assignedWorkGroupId })
      });

      if (!response.ok) {
        const errorMessage = await response.text(); 
        throw new Error(`Błąd podczas tworzenia zadania: ${errorMessage}`);
      }

      await fetchTasks();

      setContent('');
      setDueDate('');
      setDueTime('');
      setPriority('Niski'); 
      setAssignedUserId(null);
      setAssignedWorkGroupId(null);
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania zadań.');
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorMessage = await response.text(); 
        throw new Error(`Błąd podczas usuwania zadania: ${errorMessage}`);
      }

      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

  const handleFileDownload = async (taskId: number, fileName: string) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/tasks/${taskId}/attachments/${fileName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania załącznika.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

  const refreshAttachments = async (taskId: number) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${taskId}/tasks/${taskId}/refresh-attachments`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Pełen komunikat błędu:", errorMessage);
        throw new Error(`Błąd podczas odświeżania załączników: ${errorMessage}`);
      }

      const updatedTask = await response.json();
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, attachments: updatedTask.attachments } : t
        )
      );
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full mb-8">
        <div className="mt-8 w-full max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Utwórz nowe zadanie</h2>
          <textarea
            placeholder="Treść zadania"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border p-4 rounded-lg w-full mb-4"
          ></textarea>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border p-4 rounded-lg w-full mb-4"
          />
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="border p-4 rounded-lg w-full mb-4"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border p-4 rounded-lg w-full mb-4"
          >
            <option value="Niski">Niski</option>
            <option value="Średni">Średni</option>
            <option value="Wysoki">Wysoki</option>
          </select>
  
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-2">Przypisz użytkownika:</h3>
            <input
              type="text"
              placeholder="Wpisz nazwisko pracownika"
              value={searchQueryUser}
              onChange={(e) => setSearchQueryUser(e.target.value)}
              className="border p-4 rounded-lg w-full mb-4"
            />
            <button
              onClick={handleSearchUsers}
              className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
            >
              Szukaj użytkowników
            </button>
            {isLoading && <p className="text-gray-600 mb-4">Ładowanie wyników...</p>}
            <ul>
              {searchResultsUser.map((user) => (
                <li key={user.id} className="flex justify-between items-center mb-4">
                  <span>{`${user.firstName} ${user.lastName}`}</span>
                  <button
                    onClick={() => {
                      setAssignedUserId(user.id);
                      setAssignedWorkGroupId(null);
                    }}
                    className={`px-4 py-2 text-white rounded-full shadow-lg transform transition duration-300 ${
                      assignedUserId === user.id ? 'bg-green-700' : 'bg-green-500'
                    }`}
                  >
                    {assignedUserId === user.id ? 'Wybrano' : 'Wybierz'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
  
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-2">Przypisz grupę roboczą:</h3>
            <input
              type="text"
              placeholder="Wpisz nazwę grupy roboczej"
              value={searchQueryGroup}
              onChange={(e) => setSearchQueryGroup(e.target.value)}
              className="border p-4 rounded-lg w-full mb-4"
            />
            <button
              onClick={handleSearchGroups}
              className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
            >
              Szukaj grup roboczych
            </button>
            {isLoading && <p className="text-gray-600 mb-4">Ładowanie wyników...</p>}
            <ul>
              {searchResultsGroup.map((group) => (
                <li key={group.id} className="flex justify-between items-center mb-4">
                  <span>{group.name}</span>
                  <button
                    onClick={() => {
                      setAssignedWorkGroupId(group.id);
                      setAssignedUserId(null);
                    }}
                    className={`px-4 py-2 text-white rounded-full shadow-lg transform transition duration-300 ${
                      assignedWorkGroupId === group.id ? 'bg-green-700' : 'bg-green-500'
                    }`}
                  >
                    {assignedWorkGroupId === group.id ? 'Wybrano' : 'Wybierz'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
  
          <button
            onClick={handleCreateTask}
            className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105 mb-4"
          >
            Utwórz
          </button>
          {error && <p className="text-red-500 mb-4">{error}</p>}
        </div>
      </div>
  
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <div className="mt-8 w-full max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista zadań</h2>
          <ul>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className={`mb-4 border p-4 rounded-lg shadow-lg ${
                    task.status === 'W trakcie' ? 'task-in-progress' : ''
                  } ${task.status === 'Zrobione' ? 'task-completed' : ''} bg-white`}
                >
                  <p className="text-lg text-gray-800">
                    <strong>Treść:</strong> {task.content}
                  </p>
                  <p className="text-lg text-gray-800">
                    <strong>Termin:</strong> {task.dueDate}
                  </p>
                  <p className="text-lg text-gray-800">
                    <strong>Priorytet:</strong> {task.priority}
                  </p>
                  <p className="text-lg text-gray-800">
                    <strong>Status:</strong> {task.status}
                  </p>
                  <p className="text-lg text-gray-800">
                    <strong>Przypisane do:</strong>{' '}
                    {task.assignedUser
                      ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}`
                      : task.assignedWorkGroup
                      ? task.assignedWorkGroup.name
                      : 'Brak'}
                  </p>
                  <strong className="text-lg text-gray-800">Załączniki:</strong>
                  <div>
                    {task.attachments.length > 0 ? (
                      task.attachments.map((attachment, index) => {
                        const fileName = attachment.split('/').pop() || '';
                        return (
                          <p key={index}>
                            <button
                              onClick={() => handleFileDownload(task.id, fileName)}
                              className="text-blue-600 hover:underline"
                            >
                              {fileName}
                            </button>
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-gray-600">Brak</p>
                    )}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
                    >
                      Usuń
                    </button>
                    <button
                      onClick={() => refreshAttachments(task.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
                    >
                      Odśwież załączniki
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-red-600 font-bold text-center">Brak zadań</p>
            )}
          </ul>
          {error && <p className="text-red-500 mt-4">{error}</p>}
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
    </div>
  );

}