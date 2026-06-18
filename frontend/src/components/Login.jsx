import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🔥 Importamos el hook de navegación
import apiClient from '../api/client';
import logo from '../assets/logo.png'; 

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate(); // 🔥 Lo inicializamos

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/login/', credentials);
    
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('rol', res.data.rol);
   
      navigate('/'); 
    } catch (err) {
      alert("Credenciales inválidas");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F5F4F0]">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-2xl shadow-stone-500/10 w-96 border border-stone-200">
        
        {/* ESPACIO PARA EL LOGO */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Finca Baltodano" className="w-40 h-auto object-contain" />
        </div>

        <h2 className="text-2xl font-black text-center text-green-900 mb-8">Finca Flor de Maria</h2>
        
        <div className="space-y-4">
          <input 
            placeholder="User" 
            className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all font-semibold text-stone-800"
            onChange={e => setCredentials({...credentials, username: e.target.value})} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all font-semibold text-stone-800"
            onChange={e => setCredentials({...credentials, password: e.target.value})} 
          />
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black mt-8 shadow-lg shadow-blue-600/30 transition-all">
          log in
        </button>
      </form>
    </div>
  );
}