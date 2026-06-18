import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../api/client';
import { MessageCircle, X, Send, Loader2, Bot, User, Maximize2 } from 'lucide-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import logo from '../assets/pll.png'; 

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: 'ia', text: "Hi there! 👋 I'm CowBot, what can I help you with today?" }
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
    setChatLog(prev => [...prev, { sender: 'user', text: currentMsg }]);
    setMensaje("");
    setIsLoading(true);

    try {
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
      {/* VENTANA DE CHAT ESTILO EDX */}
      {isOpen && (
        <div className="bg-white w-[380px] h-[600px] max-h-[85vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col mb-4 overflow-hidden transform transition-all">
          
          {/* HEADER OSCURO */}
          <div className="bg-[#0D2A27] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg">
               <img 
                  src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZng0ZGp5MWw3cW96dHB2aHc0a3cxemI0c21ieDNzMHpueDQybGc0aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0Iy8YaAIBCsZgxnq/giphy.gif" 
                  alt="CowBot Logo" 
                  style={{ width: '28px', height: 'auto' }} 
                />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-wide flex items-center gap-1">
                  CowBot <span className="bg-amber-500 text-amber-950 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Xpert</span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-stone-300 hover:text-white p-1.5 transition-colors">
                <Maximize2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-stone-300 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ÁREA DE MENSAJES */}
          <div className="flex-1 p-5 overflow-y-auto bg-white space-y-6">
            
            {/* DISCLAIMER ESTILO EDX */}
            <div className="p-4 bg-[#F8F9FA] rounded-2xl text-[12px] text-stone-600 leading-relaxed border border-stone-100 shadow-sm">
              Before we get started, just a reminder that this chat is AI generated, mistakes are possible. By using it you agree that the Finca may create a record of this chat. Your personal data will be used as described in our privacy policy.
            </div>

            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ia' && (
                  <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-stone-200 flex items-center justify-center mr-3 flex-shrink-0">
                   <img 
                      src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjFiOTZleWU1aTloOG5wdW1hajZmM3RmcjJ4MzNwa2FjY2IxcnExbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/xUA7aWkhLe7nIKuX5K/giphy.gif" 
                      alt="AI Icon" 
                      style={{ width: '18px', height: 'auto' }} 
                    />
                  </div>
                )}
                
                <div className={`p-3.5 max-w-[80%] text-[13px] shadow-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-stone-100 text-stone-800 rounded-2xl rounded-tr-sm font-medium border border-stone-200' 
                    : 'bg-[#F8F9FA] text-stone-700 rounded-2xl rounded-tl-sm border border-stone-100'
                }`}>
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center ml-3 flex-shrink-0">
                    <User size={14} className="text-stone-600" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Indicador de Carga Animado */}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-stone-200 flex items-center justify-center mr-3 flex-shrink-0">
                    <Bot size={14} className="text-green-800" />
                  </div>
                <div className="p-3 bg-[#F8F9FA] border border-stone-100 rounded-2xl rounded-tl-sm text-stone-500 flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-green-800" />
                  <span className="text-xs font-medium">Moo-sing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT FORM ESTILO PÍLDORA (EDX) */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-100">
            <div className="relative flex items-center w-full">
              <input 
                type="text" 
                placeholder="Write a message" 
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-stone-300 text-stone-800 rounded-full pl-5 pr-12 py-3.5 text-[13px] font-medium outline-none focus:border-green-800 focus:ring-1 focus:ring-green-800 transition-all disabled:opacity-50 placeholder-stone-400 shadow-sm"
              />
              <button 
                type="submit" 
                disabled={isLoading || !mensaje.trim()}
                className="absolute right-2 p-2 text-stone-400 hover:text-green-800 disabled:hover:text-stone-400 disabled:opacity-50 transition-colors flex items-center justify-center bg-transparent"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOTÓN FLOTANTE PRINCIPAL */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-transform duration-300 ${
          isOpen ? 'scale-90 opacity-0 pointer-events-none absolute' : 'scale-100 opacity-100 relative'
        }`}
      >
        <img 
          src={logo}
          alt="Abrir ChatBot" 
          style={{ width: '150px', height: 'auto', filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.2))' }} 
        />
        
        {/* Puntito de notificación rojo */}
        {!isOpen && (
          <span className="absolute top-2 right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
}