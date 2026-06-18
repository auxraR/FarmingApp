import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { GiphyFetch } from '@giphy/js-fetch-api';
// import { Grid } from '@giphy/react-components'; 

export default function FeedingPage() {
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [feedProducts, setFeedProducts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    batch: '', 
    producto: '',
    quantity_kg: '', 
    schedule: 'Morning', 
    observations: '',
    date: getLocalDate() 
  });

  const gf = new GiphyFetch('aoculKTuKwlnsR4p3dpLsJzfAnlC8xLY');

  const fetchStickers = (offset) => 
    gf.stickers({ offset, limit: 10 });

  const fetchData = async () => {
    try {
      const [logRes, batchRes, productsRes] = await Promise.all([
        apiClient.get('/feeding/'), 
        apiClient.get('/batches/'),
        apiClient.get('/products/')
      ]);
      setLogs(Array.isArray(logRes.data) ? logRes.data : logRes.data.results);
      setBatches(Array.isArray(batchRes.data) ? batchRes.data : batchRes.data.results);
      
      const allProducts = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results;
      const alimentos = allProducts.filter(p => p.categoria === 'Alimento');
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
    setFormData({ // Reset form con fecha local
      batch: '', producto: '', quantity_kg: '', schedule: 'Morning', observations: '', date: getLocalDate()
    });
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
      confirmButtonColor: '#2563EB', // Azul
      cancelButtonColor: '#6B7280',  // Gris
      confirmButtonText: 'Yes, edit it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setSelectedLog(log);
      setFormData({
        batch: log.batch,
        producto: '', // Lo dejamos vacío o busca el ID si tu log lo trae
        food_type: log.food_type,
        quantity_kg: log.quantity_kg,
        schedule: log.schedule,
        observations: log.observations,
        date: log.date || getLocalDate()
      });
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Archive Record?',
      text: "This will remove the feeding log from the active view.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626', // Rojo
      cancelButtonColor: '#6B7280',  // Gris
      confirmButtonText: 'Yes, archive it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        // 🔥 MAGIA DEL SOFT DELETE APLICADA
        await apiClient.patch(`/feeding/${id}/`, { estado: 0 });
        fetchData();
        Swal.fire('Archived!', 'The record has been hidden.', 'success');
      } catch {
        Swal.fire('Error', 'Could not archive the record.', 'error');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const qtyNum = Number(formData.quantity_kg);
    const productoSeleccionado = feedProducts.find(p => p.id === Number(formData.producto));
    
    // Si estamos editando y no seleccionó un producto nuevo, saltamos la validación de stock
    const isEditingWithoutNewProduct = isEditing && selectedLog && !productoSeleccionado;

    if (!Number.isFinite(qtyNum) || qtyNum < 0 || (!isEditingWithoutNewProduct && productoSeleccionado && qtyNum > productoSeleccionado.stock)) {
      Swal.fire({
        title: 'Invalid Quantity',
        text: 'Quantity (kg) cannot be negative or there is not enough food in stock.',
        icon: 'error',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    try {
      const payload = { 
        ...formData, 
        quantity_kg: qtyNum,
        food_type: productoSeleccionado ? productoSeleccionado.nombre : formData.food_type || 'Concentrado',
        observations: formData.observations.trim() === "" ? "No observations" : formData.observations
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
      Swal.fire({
        title: 'Error',
        text: 'Could not connect to the server.',
        icon: 'error',
        confirmButtonColor: '#DC2626'
      });
    }
  };

  const processedLogs = logs
    .filter(log => {
      const term = searchTerm.toLowerCase();
      const dateMatch = log.date && log.date.toLowerCase().includes(term);
      const batchMatch = log.batch_name && log.batch_name.toLowerCase().includes(term);
      return dateMatch || batchMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)) 
    .slice(0, 7); 

  if (loading) return <div className="p-8 text-green-800 font-bold animate-pulse">Loading data...</div>;

  return (
    <div className="space-y-6 p-4 bg-[#F5F4F0] min-h-screen text-stone-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-2">
            <img 
        src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZW14c29nZnlmZml4azJneHZzY3J4NTFweDIwcHM5ZXh1dmQzenh5MiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gE6xxKYcRel4SxzOzV/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} 
      />
      Feeding Records
          </h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search by date or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all text-sm font-semibold text-stone-800 placeholder-stone-400 bg-white"
            />
          </div>
          <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 whitespace-nowrap transition-all">
            <Plus size={18}/> New Entry
          </button>
        </div>
      </div>

      {/* TABLA DE REGISTROS */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-lg shadow-stone-500/5">
        <table className="w-full text-left">
          <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] font-black uppercase tracking-widest border-b border-stone-200">
            <tr>
              <th className="p-4 pl-6">Date</th>
              <th className="p-4">Batch</th>
              <th className="p-4">Food Type</th>
              <th className="p-4">Qty</th>
              <th className="p-4 text-center pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {processedLogs.length > 0 ? (
              processedLogs.map((log) => (
                <tr key={log.id} onClick={() => handleViewDetails(log)} className="hover:bg-stone-50 cursor-pointer transition-colors group">
                  <td className="p-4 pl-6 text-xs text-stone-500 font-bold">{log.date}</td>
                  <td className="p-4 font-black text-green-900 group-hover:text-green-700 transition-colors uppercase text-sm">{log.batch_name}</td>
                  <td className="p-4 text-sm font-bold text-stone-700">{log.food_type}</td>
                  <td className="p-4 text-sm font-black text-stone-800">{log.quantity_kg} <span className="text-[10px] text-stone-400">KG</span></td>
                  <td className="p-4 pr-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={(e) => handleEditClick(e, log)} className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all shadow-sm">
                        <Edit2 size={16} strokeWidth={2.5}/>
                      </button>
                      <button onClick={(e) => handleDelete(e, log.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 transition-all shadow-sm">
                        <Trash2 size={16} strokeWidth={2.5}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-12 text-center">
                  <span className="text-4xl mb-4 block">🍂</span>
                  <h3 className="text-lg font-black text-green-900">No records found</h3>
                  <p className="text-sm font-semibold text-stone-500 mt-1">There are no feeding logs that match your search.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL MULTIUSO (Detalles / Formulario) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-stone-800">
            
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#FAF8F5]">
              <h2 className="text-xl font-black text-green-900">
                {isEditing ? (selectedLog ? 'Edit Record' : 'New Entry') : 'Record Details'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5}/>
              </button>
            </div>

            <div className="p-6">
              {selectedLog && !isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200">
                      <p className="text-[9px] text-amber-800 uppercase font-black tracking-widest mb-1">Batch / Group</p>
                      <p className="text-lg font-black text-green-900">{selectedLog.batch_name}</p>
                    </div>
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200">
                      <p className="text-[9px] text-amber-800 uppercase font-black tracking-widest mb-1">Date</p>
                      <p className="text-lg font-black text-green-900">{selectedLog.date}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                      <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1">Food Type</p>
                      <p className="text-sm font-bold text-stone-800">{selectedLog.food_type}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                      <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1">Quantity</p>
                      <p className="text-sm font-bold text-stone-800">{selectedLog.quantity_kg} kg</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                    <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1">Observations</p>
                    <p className="text-sm font-semibold text-stone-600 mt-1">{selectedLog.observations || 'No observations recorded.'}</p>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 py-3.5 rounded-xl font-black transition-all">
                    Edit Information
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-amber-900 font-black uppercase tracking-widest ml-1">Batch / Group</label>
                    <select required className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 outline-none focus:border-green-800 focus:bg-white text-sm font-semibold text-stone-900"
                      value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                      <option value="">-- Select Batch --</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-amber-900 font-black uppercase tracking-widest ml-1">Food Product</label>
                      <select
                        name="producto"
                        value={formData.producto || ''}
                        onChange={e => setFormData({...formData, producto: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 outline-none focus:border-green-800 focus:bg-white text-sm font-semibold text-stone-900"
                        required={!isEditing} // Solo requerido si es nuevo
                      >
                        <option value="">{isEditing ? `-- Keep: ${formData.food_type} --` : '-- Select Feed --'}</option>
                        {feedProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (Stock: {p.stock} {p.unidad_medida})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-900 font-black uppercase tracking-widest ml-1">Qty (kg)</label>
                      <input required type="number" step="0.1" min="0" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 outline-none focus:border-green-800 focus:bg-white text-sm font-bold text-stone-900"
                        value={formData.quantity_kg} onChange={e => setFormData({...formData, quantity_kg: e.target.value})} />
                    </div>
                  </div>
                  
                  {/* 🔥 SE AGREGÓ EL CAMPO DE FECHA EN EL FORMULARIO */}
                  <div>
                      <label className="text-[10px] text-amber-900 font-black uppercase tracking-widest ml-1">Date</label>
                      <input required type="date" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 outline-none focus:border-green-800 focus:bg-white text-sm font-bold text-stone-900"
                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>

                  <div>
                    <label className="text-[10px] text-amber-900 font-black uppercase tracking-widest ml-1">Observations</label>
                    <textarea className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 h-24 outline-none resize-none focus:border-green-800 focus:bg-white text-sm font-semibold text-stone-900"
                      placeholder="Add any notes here..."
                      value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 mt-2">
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