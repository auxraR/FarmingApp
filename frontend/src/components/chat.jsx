import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { GiphyFetch } from '@giphy/js-fetch-api';

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: 'ia', text: 'HIII, im your CowBot🐄, How can i do for MUUUUUUU today?' }
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const currentMsg = mensaje;
    // Agregamos el mensaje del usuario a la pantalla inmediatamente
    setChatLog(prev => [...prev, { sender: 'user', text: currentMsg }]);
    setMensaje("");
    setIsLoading(true);

    try {
      // Hacemos la petición a tu endpoint de Django
      const response = await apiClient.post('/chatbot/', { mensaje: currentMsg });
      
      setChatLog(prev => [...prev, { sender: 'ia', text: response.data.respuesta }]);
    } catch (error) {
      console.error("Error consultando al bot:", error);
      setChatLog(prev => [...prev, { 
        sender: 'ia', 
        text: 'Uy, parece que hubo un problema de conexión con el servidor. Revisa tu internet o avisa al administrador.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* VENTANA DE CHAT */}
      {isOpen && (
        <div className="bg-white w-80 md:w-96 h-[450px] rounded-3xl shadow-2xl border border-stone-200 flex flex-col mb-4 overflow-hidden transform transition-all">
          
          {/* HEADER */}
          <div className="bg-green-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-green-800 p-2 rounded-full">
               <img 
        src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZng0ZGp5MWw3cW96dHB2aHc0a3cxemI0c21ieDNzMHpueDQybGc0aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0Iy8YaAIBCsZgxnq/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '30px', height: 'auto' }} />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-wide">CowBot AI</h3>
                <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest mt-0.5">Muuu System Support</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-red-500 hover:text-white p-1.5 rounded-full transition-colors text-green-300">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* ÁREA DE MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#FAF8F5] space-y-4">
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ia' && (
                  <div className="w-6 h-6 rounded-full bg-green-900 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                   <img 
        src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjFiOTZleWU1aTloOG5wdW1hajZmM3RmcjJ4MzNwa2FjY2IxcnExbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/xUA7aWkhLe7nIKuX5K/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '15px', height: 'auto' }} />
                  </div>
                )}
                
                <div className={`p-3 max-w-[80%] rounded-2xl text-sm font-semibold shadow-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white border border-stone-200 text-stone-700 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                    <User size={12} className="text-stone-500" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Indicador de Carga Animado */}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="w-6 h-6 rounded-full bg-green-900 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Bot size={12} className="text-green-200" />
                  </div>
                <div className="p-3 bg-white border border-stone-200 rounded-2xl rounded-tl-sm text-stone-400 flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-green-700" />
                  <span className="text-xs font-bold">Moo-sing......</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Ask for help..." 
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isLoading || !mensaje.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
            >
              <Send size={18} strokeWidth={2.5} className="ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* BOTÓN FLOTANTE PRINCIPAL */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-stone-900/30 transition-all duration-300 hover:scale-110 relative ${
          isOpen ? 'bg-red-600 text-white rotate-90' : 'bg-green-900 text-white rotate-0'
        }`}
      >
        {isOpen ? <X size={24} strokeWidth={2.5} /> : <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWRtYTk2eXVycXlicWVwM2xndDJ3bXh2YnI1ejNqeXc0eDNsbmo4ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/12vu0WTtItoFt6/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '120px', height: 'auto' }} />}
        
        {/* Puntito de notificación rojo */}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
}