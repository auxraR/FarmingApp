import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Trash2, Edit2, X, Beef } from 'lucide-react';
import Swal from 'sweetalert2'

export default function FeedingPage() {
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    batch: '', food_type: '', quantity_kg: '', schedule: 'Morning', observations: ''
  });

  const fetchData = async () => {
    try {
      const [logRes, batchRes] = await Promise.all([
        apiClient.get('/feeding/'),
        apiClient.get('/batches/')
      ]);
      setLogs(Array.isArray(logRes.data) ? logRes.data : logRes.data.results);
      setBatches(batchRes.data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);


  const handleAddNew = () => {
    setSelectedLog(null); 
    setFormData({ batch: '', food_type: '', quantity_kg: '', schedule: 'Morning', observations: '' });
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
    } catch (error) {
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
  try {
    if (selectedLog && isEditing) {
      await apiClient.put(`/feeding/${selectedLog.id}/`, formData);
    } else {
      await apiClient.post('/feeding/', formData);
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
    <div className="space-y-6 text-white p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Feeding Records</h1>
        <button onClick={handleAddNew} className="bg-ganadero-active text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Plus size={18}/> New Entry
        </button>
      </div>

      <div className="bg-[#1a1c26] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/40 text-gray-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Batch</th>
              <th className="p-4">Food Type</th>
              <th className="p-4">Qty</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => (
              <tr key={log.id} onClick={() => handleViewDetails(log)} className="hover:bg-white/[0.03] cursor-pointer transition-colors group">
                <td className="p-4 text-xs text-gray-400">{log.date}</td>
                <td className="p-4 font-bold text-white">{log.batch_name}</td>
                <td className="p-4 text-sm">{log.food_type}</td>
                <td className="p-4 text-sm font-bold text-ganadero-active">{log.quantity_kg} kg</td>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1c26] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-bold">
                {isEditing ? (selectedLog ? 'Edit Record' : 'New Entry') : 'Record Details'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>

            <div className="p-6">
              {selectedLog && !isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Batch</p>
                      <p className="text-lg font-bold text-ganadero-active">{selectedLog.batch_name}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Date</p>
                      <p className="text-lg font-bold">{selectedLog.date}</p>
                    </div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Observations</p>
                    <p className="text-sm text-gray-300 mt-1">{selectedLog.observations || 'No observations recorded.'}</p>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all">
                    Edit Information
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 font-black uppercase">Batch</label>
                    <select required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-1 outline-none focus:border-ganadero-active"
                      value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                      <option value="">Select Batch...</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 font-black uppercase">Food Type</label>
                      <input required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-1 outline-none focus:border-ganadero-active"
                        value={formData.food_type} onChange={e => setFormData({...formData, food_type: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-black uppercase">Qty (kg)</label>
                      <input required type="number" step="0.1" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-1 outline-none focus:border-ganadero-active"
                        value={formData.quantity_kg} onChange={e => setFormData({...formData, quantity_kg: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-black uppercase">Observations</label>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-1 h-24 outline-none resize-none focus:border-ganadero-active"
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