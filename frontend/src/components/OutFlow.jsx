import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { DoorOpen, Search, Plus, RotateCcw, Info, Calendar } from 'lucide-react';

const OutflowPage = () => {
  const [outflows, setOutflows] = useState([]);
  const [availableLivestock, setAvailableLivestock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    ganado: '',
    motivo_salida: 'Death/Illness',
    observaciones: ''
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
    if (!form.ganado) return Swal.fire({ icon: 'warning', title: 'Select an animal' });

    try {
      await apiClient.post('/sales-outflow/', form);
      Swal.fire({ title: 'Success', text: 'Outflow recorded.', icon: 'success', timer: 1500, showConfirmButton: false });
      setForm({ ganado: '', motivo_salida: 'Death/Illness', observaciones: '' });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not record outflow.' });
    }
  };

  const handleRevert = async (id) => {
    const result = await Swal.fire({
      title: 'Reintegrate animal?',
      text: "The outflow record will be deleted and the animal will return to 'In Farm' status.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#000000',
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

  if (isLoading) return <div className="p-8 text-center mt-20">Loading...</div>;

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[0px]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0E0]">
        <h1 className="text-3xl font-bold text-[#11131F] flex items-center gap-3">
          <DoorOpen size={32} /> Outflow Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus size={20} /> Record New Outflow
            </h2>
            <form onSubmit={handleSubmitOutflow} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#8C92AC] mb-2 uppercase">Select Animal</label>
                <select 
                  name="ganado" 
                  value={form.ganado} 
                  onChange={handleInputChange}
                  className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] text-sm focus:ring-1 focus:ring-black"
                  required
                >
                  <option value="">-- Choose Animal --</option>
                  {availableLivestock.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre || `ID #${a.id}`} ({a.raza})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8C92AC] mb-2 uppercase">Reason</label>
                <select 
                  name="motivo_salida" 
                  value={form.motivo_salida} 
                  onChange={handleInputChange}
                  className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] text-sm focus:ring-1 focus:ring-black"
                >
                  <option value="Death/Illness">Death/Illness</option>
                  <option value="Theft/Escape">Theft/Escape</option>
                  <option value="Self-Consumption">Self-Consumption</option>
                  <option value="Gift/Donation">Gift/Donation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8C92AC] mb-2 uppercase">Observations</label>
                <textarea 
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleInputChange}
                  placeholder="Details about the event..."
                  className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] text-sm h-24 focus:ring-1 focus:ring-black"
                />
              </div>

              <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-800 transition shadow-lg">
                Confirm Outflow
              </button>
            </form>
          </div>
        </div>

        {/* LADO DERECHO: TABLA DE ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} /> Recent Outflows (Last 7 Days)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F4F6F8] text-[#8C92AC] text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-4 rounded-l-xl">Date</th>
                    <th className="p-4">Animal</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {outflows.map((out) => {
                    const canRevert = out.motivo_salida !== 'Venta' && isRevertible(out.fecha_salida);
                    
                    return (
                      <tr key={out.id} className="hover:bg-[#F9FAFB] transition-colors group">
                        <td className="p-4 text-xs font-medium text-[#8C92AC]">{out.fecha_salida}</td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-black">{out.animal_nombre || `ID #${out.animal_id_tag}`}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                            out.motivo_salida === 'Venta' ? 'border-blue-200 text-blue-600 bg-blue-50' : 
                            out.motivo_salida === 'Muerte/Enfermedad' ? 'border-red-200 text-red-600 bg-red-50' : 
                            'border-gray-200 text-gray-600 bg-gray-50'
                          }`}>
                            {out.motivo_salida}
                          </span>
                        </td>
                        <td className="p-4">
                          {canRevert ? (
                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                              <Info size={12} /> Revertible
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#8C92AC]">Locked</span>
                          )}
                        </td>
                        <td className="p-4">
                          {canRevert && (
                            <button 
                              onClick={() => handleRevert(out.id)}
                              className="p-2 bg-black text-white rounded-lg hover:bg-zinc-700 transition transform group-hover:scale-110"
                              title="Revert this outflow"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {outflows.length === 0 && (
                <div className="p-10 text-center text-[#8C92AC] italic">No outflows recorded yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OutflowPage;