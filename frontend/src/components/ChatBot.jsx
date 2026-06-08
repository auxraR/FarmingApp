import React, { useState } from 'react';
import axios from 'axios';

export const ChatBotFinca = () => {
  const [inputUsuario, setInputUsuario] = useState('');
  const [conversacion, setConversacion] = useState([]);

  const enviarMensaje = async () => {
    if (!inputUsuario.trim()) return;

    setConversacion([...conversacion, { rol: 'user', texto: inputUsuario }]);
    const mensajeAEnviar = inputUsuario;
    setInputUsuario('');

    try {
      const respuesta = await axios.post('http://localhost:8000/api/chatbot/', {
        mensaje: mensajeAEnviar
      });

      setConversacion(prev => [...prev, { rol: 'bot', texto: respuesta.data.respuesta }]);
      
    } catch (error) {
      console.error("Hubo una falla en la conexión:", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="historial">
        {conversacion.map((msg, index) => (
          <p key={index}><strong>{msg.rol === 'user' ? 'Tú: ' : 'Bot: '}</strong>{msg.texto}</p>
        ))}
      </div>
      <input 
        type="text" 
        value={inputUsuario} 
        onChange={(e) => setInputUsuario(e.target.value)} 
        maxLength="200"
        placeholder="Pregunta algo sobre la producción..."
      />
      <button onClick={enviarMensaje}>Enviar</button>
    </div>
  );
};