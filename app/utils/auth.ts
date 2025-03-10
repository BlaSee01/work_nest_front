export function getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  export function setToken(token: string): void {
    localStorage.setItem('token', token);
  }
  
  export function removeToken(): void {
    localStorage.removeItem('token');
  }
  
  export async function refreshToken(): Promise<void> {
    const token = getToken();
    if (!token) return;
  
    try {
      const response = await fetch('http://localhost:5170/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token),
      });
  
      if (response.ok) {
        const { Token } = await response.json();
        setToken(Token);
      } else {
        removeToken();
        window.location.href = '/login';
      }
    } catch {
      removeToken();
      window.location.href = '/login';
    }
  }
  