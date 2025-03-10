'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../utils/auth';
import React from 'react';

type Task = {
  id: number;
  content: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedUserId: number | null;
  assignedWorkGroupId: number | null;
  completionDate: string | null;
  attachments: string[];
  workplaceName: string;
  assignedUser: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  assignedWorkGroup: {
    id: number;
    name: string;
  } | null;
  workplace: {
    id: number;
    name: string;
  } | null;
};

type ErrorType = string | null;

export default function TaskListPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<ErrorType>(null);

  // Funkcja do pobierania zadań
  const fetchTasks = async () => {
    const token = getToken();

    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      setError("Użytkownik nie jest zalogowany. Zaloguj się, aby zobaczyć zadania.");
      router.push('/login');
      return;
    }

    try {
      const response = await fetch("http://localhost:5170/api/user-tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Błąd podczas pobierania zadań: ${response.status} - ${errorText}`);
        throw new Error(`Błąd podczas pobierania zadań: ${errorText}`);
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }

  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, workplaceId: number, newStatus: string) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${workplaceId}/tasks/${taskId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Pełen komunikat błędu:", errorMessage);
        throw new Error(`Błąd podczas zmiany statusu zadania: ${errorMessage}`);
      }
  
      const updatedTask = await response.json();
      const originalTask = tasks.find((task) => task.id === taskId);
  
      setTasks(
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...updatedTask,
                workplace: originalTask?.workplace || null,
                workplaceName: originalTask?.workplaceName || updatedTask.workplace?.name || "",
                assignedUser: originalTask?.assignedUser || null,
                assignedWorkGroup: originalTask?.assignedWorkGroup || null,
              }
            : task
        )
      );
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };
  

  /*const fetchAttachments = async (taskId: number) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return [];
    }

    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${taskId}/tasks/${taskId}/files`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Pełen komunikat błędu:", errorMessage);
        throw new Error(`Błąd podczas pobierania załączników: ${errorMessage}`);
      }

      const files = await response.json();
      return files; // Zakładam, że API zwraca listę plików w formacie string[]
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
      return [];
    }
  };*/  // poprzednia wersja, zostawić na razie - TEMP

  const refreshAttachments = async (taskId: number, workplaceId: number) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5170/api/workplaces/${workplaceId}/tasks/${taskId}/refresh-attachments`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  

  const handleFileUpload = async (taskId: number, workplaceId: number, files: FileList) => {
    if (files.length === 0) {
      console.error("Brak wybranego pliku.");
      setError("Brak wybranego pliku.");
      return;
    }
  
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }
  
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
  
    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${workplaceId}/tasks/${taskId}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Pełen komunikat błędu:", errorMessage);
        throw new Error(`Błąd podczas przesyłania załącznika: ${errorMessage}`);
      }
  
      const updatedTask = await response.json();
      const originalTask = tasks.find((task) => task.id === taskId);
  
      setTasks(
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...updatedTask,
                workplace: originalTask?.workplace || null,
                workplaceName: originalTask?.workplaceName || updatedTask.workplace?.name || "",
                assignedUser: originalTask?.assignedUser || null,
                assignedWorkGroup: originalTask?.assignedWorkGroup || null,
              }
            : task
        )
      );
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };
  
  const handleFileDownload = async (taskId: number, fileName: string) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5170/api/workplaces/${taskId}/tasks/${taskId}/files/${fileName}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Pełen komunikat błędu:", errorMessage);
        throw new Error(`Błąd podczas pobierania pliku: ${errorMessage}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      console.error("Wystąpił błąd:", err.message);
      setError(err.message);
    }
  };

  const handleFileDelete = async (workplaceId: number, taskId: number, fileName: string) => {
    const token = getToken();
    if (!token) {
      console.error("Token jest pusty! Użytkownik nie jest zalogowany.");
      router.push('/login');
      return;
    }
  
    try {
      const encodedFileName = encodeURIComponent(fileName);
      const url = `http://localhost:5170/api/workplaces/${workplaceId}/tasks/${taskId}/attachments/${encodedFileName}`;
      console.log(`Wywołanie API DELETE: ${url}`);
  
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Błąd z API podczas usuwania pliku:", errorMessage);
        throw new Error(`Błąd podczas usuwania załącznika: ${errorMessage}`);
      }
  
      const data = await response.json();
      console.log("Załącznik usunięty:", data);
  
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, attachments: data.attachments } : t
        )
      );
    } catch (err: any) {
      console.error("Wystąpił błąd podczas usuwania załącznika:", err.message);
      setError(err.message);
    }
  };
  
  console.log(tasks); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full">
        <div className="mt-8 w-full max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista zadań</h2>
        
          {tasks.length > 0 ? (
            <ul>
              {tasks.map((task) => (
                <li key={task.id} className="mb-4 border p-4 rounded-lg shadow-lg bg-white">
                  <p className="text-lg text-gray-800"><strong>Treść:</strong> {task.content}</p>
                  <p className="text-lg text-gray-800"><strong>Miejsce pracy:</strong> {task.workplaceName}</p>
                  <p className="text-lg text-gray-800"><strong>Jednostka odpowiedzialna:</strong> {task.assignedUser ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : task.assignedWorkGroup ? task.assignedWorkGroup.name : "Nie przypisano"}</p>
                  <p className="text-lg text-gray-800"><strong>Termin:</strong> {task.dueDate}</p>
                  <p className="text-lg text-gray-800"><strong>Priorytet:</strong> {task.priority}</p>
                  <p className={`text-lg font-semibold ${
                    task.status === 'Do wykonania' ? 'text-blue-500' : 
                    task.status === 'W trakcie' ? 'text-yellow-500' : 
                    task.status === 'Zrobione' ? 'text-green-500' : ''
                  }`}>
                    <strong>Status:</strong> {task.status}
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
                            <button
                              onClick={() => handleFileDelete(task.workplace?.id || 0, task.id, fileName)}
                              className="ml-2 px-2 py-1 bg-red-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
                            >
                              X
                            </button>
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-gray-600">Brak</p>
                    )}
                  </div>
                  <div className="mt-2 flex justify-between">
                  <button
            onClick={() => handleStatusChange(task.id, task.workplace?.id || 0, 'W trakcie')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          >
            W trakcie
          </button>
          <button
            onClick={() => handleStatusChange(task.id, task.workplace?.id || 0, 'Zrobione')}
            className="px-4 py-2 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          >
            Zrobione
          </button>

          <button
            onClick={() => refreshAttachments(task.id, task.workplace?.id || 0)}
            className="px-4 py-2 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
          >
            Odśwież załączniki
          </button>
          </div>
          <div className="mt-4">
            <input
              type="file"
              multiple
              onChange={(e) =>
                e.target.files && handleFileUpload(task.id, task.workplace?.id || 0, e.target.files)
              }
              className="w-full border p-2 rounded"
            />
          </div>

                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-600 font-bold text-center">Brak zadań</p>
          )}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
        <center>
        <button
          onClick={() => router.push(`/home`)}
          className="mt-8 px-6 py-3 bg-gray-600 text-white rounded-full shadow-lg transform transition duration-300 hover:scale-105"
        >
          Wróć do Panelu Głównego
        </button>
        </center>
        <br />
      </div>
    </div>
  );

}