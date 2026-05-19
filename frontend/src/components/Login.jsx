import { useState } from 'react';
import apiClient from '../api/client';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/login/', credentials);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('rol', res.data.rol);
      window.location.href = '/'; 
    } catch (err) {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F4F6F8]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Finca Baltodano</h2>
        <input 
          placeholder="Usuario" 
          className="w-full mb-4 p-3 border rounded"
          onChange={e => setCredentials({...credentials, username: e.target.value})} 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          className="w-full mb-6 p-3 border rounded"
          onChange={e => setCredentials({...credentials, password: e.target.value})} 
        />
        <button className="w-full bg-black text-white p-3 rounded font-bold">Entrar</button>
      </form>
    </div>
  );
}