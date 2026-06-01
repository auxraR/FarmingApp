import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { Settings, Tag, Users, Plus, Edit2, Trash2, X, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, categoria: '', precio_kg: '' });

  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ id: null, name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, batchRes] = await Promise.all([
        apiClient.get('/precios-mercado/'),
        apiClient.get('/batches/')
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
      setBatches(Array.isArray(batchRes.data) ? batchRes.data : batchRes.data.results || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setLoading(false);
    }
  };

  const handleOpenCat = (cat = null) => {
    if (cat) {
      setIsEditingCat(true);
      setCatForm({ id: cat.id, categoria: cat.categoria, precio_kg: cat.precio_kg });
    } else {
      setIsEditingCat(false);
      setCatForm({ id: null, categoria: '', precio_kg: '' });
    }
    setShowCatModal(true);
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    try {
      const payload = { categoria: catForm.categoria, precio_kg: parseFloat(catForm.precio_kg) };
      if (isEditingCat) {
        await apiClient.put(`/precios-mercado/${catForm.id}/`, payload);
      } else {
        await apiClient.post('/precios-mercado/', payload);
      }
      Swal.fire({ title: 'Success', text: 'Category saved.', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'Could not save category.', 'error');
    }
  };

  const handleDeleteCat = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: "You can only delete this if no animals are linked to it.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/precios-mercado/${id}/`);
        Swal.fire('Deleted!', 'Category removed.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Action Denied', 'Cannot delete because animals are currently assigned to this category.', 'error');
      }
    }
  };

  const handleOpenBatch = (batch = null) => {
    if (batch) {
      setIsEditingBatch(true);
      setBatchForm({ id: batch.id, name: batch.name });
    } else {
      setIsEditingBatch(false);
      setBatchForm({ id: null, name: '' });
    }
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: batchForm.name };
      if (isEditingBatch) {
        await apiClient.put(`/batches/${batchForm.id}/`, payload);
      } else {
        await apiClient.post('/batches/', payload);
      }
      Swal.fire({ title: 'Success', text: 'Group saved.', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowBatchModal(false);
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'Could not save group.', 'error');
    }
  };

  const handleDeleteBatch = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Group?',
      text: "This will remove the group. Make sure no animals or feeding logs depend on it.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/batches/${id}/`);
        Swal.fire('Deleted!', 'Group removed.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Action Denied', 'Cannot delete because records are linked to this group.', 'error');
      }
    }
  };

  if (loading) return <div className="flex-1 p-8 bg-[#F4F6F8] text-[#8C92AC] font-bold">Loading Settings...</div>;

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[0px]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0E0]">
        <h1 className="text-3xl font-bold text-[#11131F] flex items-center gap-3">
          <Settings size={32} /> Settings & Configurations
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ======================= MODULO: MARKET PRICES ======================= */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#EBEBEB] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#EBEBEB] flex justify-between items-center bg-[#F9FAFB]">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-[#11131F]">
                <Tag size={22} className="text-[#3498DB]" /> Market Prices
              </h2>
              <p className="text-xs text-[#8C92AC] mt-1">Manage animal categories and their price per kg.</p>
            </div>
            <button onClick={() => handleOpenCat()} className="bg-[#11131F] text-white p-2.5 rounded-xl hover:bg-black transition">
              <Plus size={18} />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-[#8C92AC] text-[10px] uppercase font-black tracking-widest border-b border-[#EBEBEB]">
                <tr>
                  <th className="pb-3">Category Name</th>
                  <th className="pb-3">Price / Kg</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="py-4 font-bold text-black">{cat.categoria}</td>
                    <td className="py-4 font-black text-green-600">C$ {parseFloat(cat.precio_kg).toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => handleOpenCat(cat)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg mr-2 transition"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && <p className="text-center text-[#8C92AC] text-sm mt-6">No categories defined.</p>}
          </div>
        </div>

        {/* ======================= MODULO: BATCHES ======================= */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#EBEBEB] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#EBEBEB] flex justify-between items-center bg-[#F9FAFB]">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-[#11131F]">
                <Users size={22} className="text-[#F39C12]" /> Livestock Groups (Batches)
              </h2>
              <p className="text-xs text-[#8C92AC] mt-1">Manage feeding groups or paddocks.</p>
            </div>
            <button onClick={() => handleOpenBatch()} className="bg-[#11131F] text-white p-2.5 rounded-xl hover:bg-black transition">
              <Plus size={18} />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-[#8C92AC] text-[10px] uppercase font-black tracking-widest border-b border-[#EBEBEB]">
                <tr>
                  <th className="pb-3">Group Name</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-[#F9FAFB] transition">
                    <td className="py-4 font-bold text-black">{batch.name}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => handleOpenBatch(batch)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg mr-2 transition"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeleteBatch(batch.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {batches.length === 0 && <p className="text-center text-[#8C92AC] text-sm mt-6">No groups defined.</p>}
          </div>
        </div>

      </div>

      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowCatModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={20}/></button>
            <h2 className="text-2xl font-black mb-6">{isEditingCat ? 'Edit Category' : 'New Category'}</h2>
            
            <form onSubmit={handleSaveCat} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#8C92AC] uppercase tracking-widest">Category Name</label>
                <input required placeholder="e.g. Ternero" className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none focus:border-black mt-1" 
                  value={catForm.categoria} onChange={e => setCatForm({...catForm, categoria: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#8C92AC] uppercase tracking-widest flex items-center gap-1">
                  <DollarSign size={12}/> Price per Kg (C$)
                </label>
                <input required type="number" step="0.01" min="0" placeholder="0.00" className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none focus:border-black mt-1 font-bold text-lg" 
                  value={catForm.precio_kg} onChange={e => setCatForm({...catForm, precio_kg: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3.5 bg-[#1dd35d] text-white rounded-xl font-bold shadow-md hover:bg-[#1bb851] transition mt-6">
                {isEditingCat ? 'Update Category' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setShowBatchModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={20}/></button>
            <h2 className="text-2xl font-black mb-6">{isEditingBatch ? 'Edit Group' : 'New Group'}</h2>
            
            <form onSubmit={handleSaveBatch} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#8C92AC] uppercase tracking-widest">Group / Batch Name</label>
                <input required placeholder="e.g. Lote Norte" className="w-full p-3 bg-[#F4F6F8] rounded-xl border border-[#E0E0E0] outline-none focus:border-black mt-1" 
                  value={batchForm.name} onChange={e => setBatchForm({...batchForm, name: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3.5 bg-[#1dd35d] text-white rounded-xl font-bold shadow-md hover:bg-[#1bb851] transition mt-6">
                {isEditingBatch ? 'Update Group' : 'Save Group'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}