import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { DoorOpen, Search, Plus, RotateCcw, Info, Calendar } from 'lucide-react';

const OutflowPage = () => {
  const [outflows, setOutflows] = useState([]);
  const [availableLivestock, setAvailableLivestock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 SOLUCIÓN AL BUG DE ZONA HORARIA
  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Valores por defecto en español para la base de datos
  const [form, setForm] = useState({
    ganado: '',
    motivo_salida: 'Muerte/Enfermedad', 
    observaciones: '',
    fecha_salida: getLocalDate() // 🔥 Fecha local por defecto
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [outflowsRes, livestockRes] = await Promise.all([
        apiClient.get('/sales-outflow/'), 
        apiClient.get('/livestock/?estado=1') 
      ]);
      setOutflows(outflowsRes.data);
      setAvailableLivestock(livestockRes.data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmitOutflow = async (e) => {
    e.preventDefault();
    if (!form.ganado) return Swal.fire({ icon: 'warning', title: 'Missing Data', text: 'Please select an animal.', confirmButtonColor: '#2563EB' });

    try {
      await apiClient.post('/sales-outflow/', form);
      Swal.fire({ title: 'Success', text: 'Outflow recorded successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      setForm({ ganado: '', motivo_salida: 'Muerte/Enfermedad', observaciones: '', fecha_salida: getLocalDate() });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not record outflow.', confirmButtonColor: '#2563EB' });
    }
  };

  const handleRevert = async (id) => {
    const result = await Swal.fire({
      title: 'Reintegrate animal?',
      text: "The outflow record will be archived and the animal will return to 'In Farm' active status.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB', // Azul
      cancelButtonColor: '#6B7280',  // Gris
      confirmButtonText: 'Yes, revert'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.post(`/sales-outflow/${id}/revertir/`);
        Swal.fire('Reverted!', 'The animal is back in inventory.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.error || 'Could not revert.', 'error');
      }
    }
  };

  const isRevertible = (dateStr) => {
    const outflowDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today - outflowDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Traductor visual para la tabla
  const translateReason = (reason) => {
    if (!reason) return 'Unknown';
    const r = reason.toLowerCase();
    if (r.includes('venta')) return 'Sale';
    if (r.includes('muerte') || r.includes('enfermedad')) return 'Death / Illness';
    if (r.includes('robo') || r.includes('escape')) return 'Theft / Escape';
    if (r.includes('autoconsumo')) return 'Self-Consumption';
    if (r.includes('regalo') || r.includes('donacion')) return 'Gift / Donation';
    return reason;
  };

  if (isLoading) return <div className="flex-1 p-8 bg-[#F5F4F0] text-center mt-20 text-green-900 font-bold animate-pulse">Loading data...</div>;

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-4 text-stone-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-3">
            Outflow Management
          </h1>
          <p className="text-sm text-amber-900 font-semibold mt-1"></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-green-900">
              <Plus size={22} className="text-blue-600" /> Record New Outflow
            </h2>
            <form onSubmit={handleSubmitOutflow} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-1.5 uppercase tracking-widest ml-1">Select Animal</label>
                <select 
                  name="ganado" 
                  value={form.ganado} 
                  onChange={handleInputChange}
                  className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all"
                  required
                >
                  <option value="">-- Choose Animal --</option>
                  {availableLivestock.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre || `ID #${a.id}`} ({a.raza})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-1.5 uppercase tracking-widest ml-1">Reason</label>
                <select 
                  name="motivo_salida" 
                  value={form.motivo_salida} 
                  onChange={handleInputChange}
                  className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all"
                >
                  {/* Values para la base de datos, texto para el usuario */}
                  <option value="Muerte/Enfermedad">Death / Illness</option>
                  <option value="Robo/Escape">Theft / Escape</option>
                  <option value="Autoconsumo">Self-Consumption</option>
                  <option value="Regalo/Donacion">Gift / Donation</option>
                </select>
              </div>

              {/* 🔥 NUEVO: CAMPO DE FECHA LOCAL */}
              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-1.5 uppercase tracking-widest ml-1">Date</label>
                <input 
                  type="date"
                  name="fecha_salida"
                  value={form.fecha_salida}
                  onChange={handleInputChange}
                  className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-amber-900 mb-1.5 uppercase tracking-widest ml-1">Observations</label>
                <textarea 
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleInputChange}
                  placeholder="Details about the event..."
                  className="w-full p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800 h-24 focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all resize-none"
                />
              </div>

              <button type="submit" className="w-full py-4 mt-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
                Confirm Outflow
              </button>
            </form>
          </div>
        </div>

        {/* LADO DERECHO: TABLA DE ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2 text-green-900">
                <Calendar size={22} className="text-amber-800" /> Recent Outflows (Last 7 Days)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
                  <tr>
                    <th className="p-5 pl-6">Date</th>
                    <th className="p-5">Animal</th>
                    <th className="p-5">Reason</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 pr-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {outflows.map((out) => {
                    const canRevert = out.motivo_salida !== 'Venta' && isRevertible(out.fecha_salida);
                    
                    return (
                      <tr key={out.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="p-5 pl-6 text-xs font-bold text-stone-500">
                          {new Date(out.fecha_salida).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-black text-green-900">{out.animal_nombre || `ID #${out.animal_id_tag}`}</p>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            out.motivo_salida === 'Venta' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                            (out.motivo_salida === 'Muerte/Enfermedad' || out.motivo_salida === 'Robo/Escape') ? 'border-red-200 text-red-600 bg-red-50' : 
                            'border-stone-200 text-stone-600 bg-stone-100'
                          }`}>
                            {translateReason(out.motivo_salida)}
                          </span>
                        </td>
                        <td className="p-5">
                          {canRevert ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1.5">
                              <Info size={12} strokeWidth={3} /> Revertible
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Locked</span>
                          )}
                        </td>
                        <td className="p-5 pr-6 text-center">
                          {canRevert ? (
                            <button 
                              onClick={() => handleRevert(out.id)}
                              className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm mx-auto flex"
                              title="Revert this outflow"
                            >
                              <RotateCcw size={16} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {outflows.length === 0 && (
                <div className="p-12 text-center">
                  <span className="text-4xl mb-4 block"></span>
                  <h3 className="text-lg font-black text-green-900">No recent outflows</h3>
                  <p className="text-sm font-semibold text-stone-500 mt-1">Animals that leave the farm will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OutflowPage;