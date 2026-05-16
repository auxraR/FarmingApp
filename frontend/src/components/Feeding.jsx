import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import Swal from 'sweetalert2'

export default function FeedingPage() {
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [feedProducts, setFeedProducts] = useState([]);

  const [formData, setFormData] = useState({
    batch: '', food_type: '', quantity_kg: '', schedule: 'Morning', observations: ''
  });

  const fetchData = async () => {
    try {
      const [logRes, batchRes,productsRes] = await Promise.all([
        apiClient.get('/feeding/'),
        apiClient.get('/batches/'),
        apiClient.get('/products/')
      ]);
      setLogs(Array.isArray(logRes.data) ? logRes.data : logRes.data.results);
      setBatches(batchRes.data);
      const alimentos = productsRes.data.filter(p => p.categoria === 'Alimento');
      setFeedProducts(alimentos);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);


  const handleAddNew = () => {
    setSelectedLog(null); 
    setIsEditing(true); 
    setIsModalOpen(true);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setIsEditing(false); 
    setIsModalOpen(true);
  };

  const handleEditClick = async (e, log) => {
  e.stopPropagation();

  const result = await Swal.fire({
    title: 'Are you sure you want to edit this record?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Yes, edit it',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    setSelectedLog(log);
    setFormData({
      batch: log.batch,
      food_type: log.food_type,
      quantity_kg: log.quantity_kg,
      schedule: log.schedule,
      observations: log.observations
    });
    setIsEditing(true);
    setIsModalOpen(true);
  }
};

const handleDelete = async (e, id) => {
  e.stopPropagation();

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await apiClient.delete(`/feeding/${id}/`);
      fetchData();
      Swal.fire(
        'Deleted!',
        'The record has been deleted.',
        'success'
      );
    } catch {
      Swal.fire(
        'Error',
        'Could not delete the record.',
        'error'
      );
    }
  }
};

const handleSave = async (e) => {
    e.preventDefault();
    const qtyNum = Number(formData.quantity_kg);
    const productoSeleccionado = feedProducts.find(p => p.id === Number(formData.producto));
    if (!Number.isFinite(qtyNum) || qtyNum < 0 || productoSeleccionado && qtyNum > productoSeleccionado.stock) {
      Swal.fire({
        title: 'Invalid Quantity',
        text: 'Quantity (kg) cannot be negative or there a not enough food ',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {

      const productoSeleccionado = feedProducts.find(p => p.id === Number(formData.producto));
      
      const payload = { 
        ...formData, 
        quantity_kg: qtyNum,
        food_type: productoSeleccionado ? productoSeleccionado.nombre : 'Concentrado' ,
        observations: formData.observations.trim() === "" ? "Sin observaciones" : formData.observations
      };

      if (selectedLog && isEditing) {
        await apiClient.put(`/feeding/${selectedLog.id}/`, payload);
      } else {
        await apiClient.post('/feeding/', payload);
      }

      setIsModalOpen(false);
      
      Swal.fire({
        title: 'Success',
        text: 'The information was saved successfully.',
        icon: 'success',
        timer: 2000, 
        showConfirmButton: false
      });

      fetchData();
    } catch (err) {
      console.error("Error saving data:", err);
      console.log("Error detallado de Django:", err.response?.data); 
      
      Swal.fire({
        title: 'Error',
        text: 'Could not connect to the SQL server.',
        icon: 'error',
        confirmButtonText: 'Understood'
      });
    }
  };

  if (loading) return <div className="p-8 text-ganadero-active animate-pulse">Loading data...</div>;

  return (
    <div className="space-y-6 text-black-700 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black-700">Feeding Records</h1>
        <button onClick={handleAddNew} className="bg-ganadero-active text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Plus size={18}/> New Entry
        </button>
      </div>

      <div className="bg-[#f8f9fa] rounded-2xl border border-black/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/5 text-gray-600 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Batch</th>
              <th className="p-4">Food Type</th>
              <th className="p-4">Qty</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {logs.map((log) => (
              <tr key={log.id} onClick={() => handleViewDetails(log)} className="hover:bg-black/5 cursor-pointer transition-colors group">
                <td className="p-4 text-xs text-gray-600">{log.date}</td>
                <td className="p-4 font-bold text-black-700 group-hover:text-green-600 transition-colors">{log.batch_name}</td>
                <td className="p-4 text-sm text-gray-700">{log.food_type}</td>
                <td className="p-4 text-sm font-bold text-black-700">{log.quantity_kg} kg</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={(e) => handleEditClick(e, log)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit2 size={14}/></button>
                    <button onClick={(e) => handleDelete(e, log.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL MULTIUSO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#f8f9fa] border border-black/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-black-700">
            <div className="p-6 border-b border-black/10 flex justify-between items-center bg-black/5">
              <h2 className="text-xl font-bold text-black-700">
                {isEditing ? (selectedLog ? 'Edit Record' : 'New Entry') : 'Record Details'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black"><X size={20}/></button>
            </div>

            <div className="p-6">
              {selectedLog && !isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-black/10">
                      <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Batch</p>
                      <p className="text-lg font-bold text-black-700">{selectedLog.batch_name}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-black/10">
                      <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Date</p>
                      <p className="text-lg font-bold text-black-700">{selectedLog.date}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-black/10">
                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Observations</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedLog.observations || 'No observations recorded.'}</p>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="w-full bg-ganadero-active text-black hover:bg-ganadero-active/90 py-3 rounded-xl font-bold transition-all">
                    Edit Information
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-600 font-black uppercase">Batch</label>
                    <select required className="w-full bg-white border border-black/10 rounded-xl p-3 mt-1 outline-none focus:border-ganadero-active"
                      value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                      <option value="">Select Batch...</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#8C92AC] mb-2 uppercase">Food Product</label>
                      <select
                        name="producto"
                        value={formData.producto || ''}
                        onChange={e => setFormData({...formData, producto: e.target.value})}
                        className="w-full bg-white border border-black/10 rounded-xl p-3 mt-1 outline-none focus:border-ganadero-active"
                        required
                      >
                        <option value="">-- Select Feed --</option>
                        {feedProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (Stock: {p.stock} {p.unidad_medida})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 font-black uppercase">Qty (kg)</label>
                      <input required type="number" step="0.1" min="0" className="w-full bg-white border border-black/10 rounded-xl p-3 mt-1 outline-none focus:border-ganadero-active"
                        value={formData.quantity_kg} onChange={e => setFormData({...formData, quantity_kg: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 font-black uppercase">Observations</label>
                    <textarea className="w-full bg-white border border-black/10 rounded-xl p-3 mt-1 h-24 outline-none resize-none focus:border-ganadero-active"
                      value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-ganadero-active text-black font-bold py-4 rounded-2xl shadow-lg shadow-ganadero-active/20 transition-all hover:scale-[1.02]">
                    {selectedLog ? 'Update Record' : 'Save Record'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
