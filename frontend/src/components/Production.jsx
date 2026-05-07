import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Target, BarChart3, TrendingUp, Calendar, Trash2, Edit2, Search } from 'lucide-react';

const ProductionPage = () => {
  const [productionRecords, setProductionRecords] = useState([]);
  const [availableAnimals, setAvailableAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ animal: '', liters_produced: '', date: new Date().toISOString().split('T')[0] });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const prodRes = await apiClient.get('/milk-production/');
      setProductionRecords(prodRes.data);

      const animalsRes = await apiClient.get('/livestock/?status=Activo&sexo=Hembra');
      setAvailableAnimals(animalsRes.data);

      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  const totalLitersToday = productionRecords
    .filter(rec => rec.date.startsWith(today))
    .reduce((sum, rec) => sum + parseFloat(rec.liters_produced), 0);

  const todayProduction = productionRecords.filter(rec => rec.date.startsWith(today));
  let bestCowToday = { name: 'None', liters: 0 };
  
  if (todayProduction.length > 0) {
    const cowTotals = {};
    todayProduction.forEach(rec => {
      const cowName = rec.animal_name || `#${rec.animal}`;
      cowTotals[cowName] = (cowTotals[cowName] || 0) + parseFloat(rec.liters_produced);
    });
    
    bestCowToday = Object.entries(cowTotals).reduce((a, b) => (a[1] > b[1] ? a : b), ['None', 0]);
    bestCowToday = { name: bestCowToday[0], liters: bestCowToday[1] };
  }

  const chartData = productionRecords.slice(0, 14).reverse().map(rec => ({
    date: new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Liters: parseFloat(rec.liters_produced)
  }));

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = async (e, record) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Are you sure you want to edit this record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, edit it',
      cancelButtonText: 'Cancel',
      background: '#FFFFFF',
      color: '#000000',
    });

    if (!result.isConfirmed) return;

    setEditingId(record.id);
    setForm({
      animal: record.animal ?? '',
      liters_produced: record.liters_produced ?? '',
      date: (record.date ? String(record.date).slice(0, 10) : new Date().toISOString().split('T')[0]),
    });
    setShowModal(true);
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
      cancelButtonText: 'Cancel',
      background: '#FFFFFF',
      color: '#000000',
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/milk-production/${id}/`);
      Swal.fire({
        title: 'Deleted!',
        text: 'The record has been deleted.',
        icon: 'success',
        background: '#FFFFFF',
        color: '#000000',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
      if (editingId === id) {
        setEditingId(null);
        setForm({ animal: '', liters_produced: '', date: new Date().toISOString().split('T')[0] });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not delete the record.', icon: 'error', background: '#FFFFFF', color: '#000000' });
    }
  };

  const handleSubmitMilking = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/milk-production/${editingId}/`, form);
      } else {
        await apiClient.post('/milk-production/', form);
      }
      Swal.fire({ title: 'Recorded!', text: `Milking session ${editingId ? 'updated' : 'saved'} successfully.`, icon: 'success', background: '#FFFFFF', color: '#000000', timer: 1500, showConfirmButton: false });
      setShowModal(false);
      setEditingId(null);
      setForm({ animal: '', liters_produced: '', date: new Date().toISOString().split('T')[0] });
      fetchData(); 
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not record milking.', icon: 'error', background: '#FFFFFF', color: '#000000' });
    }
  };

  const filteredRecords = productionRecords.filter((rec) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const name = (rec.animal_name || '').toString().toLowerCase();
    const id = (rec.animal ?? '').toString().toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  if (isLoading) return <div className="flex-1 p-8 bg-[#F4F6F8] text-center mt-20">Loading...</div>;

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-3 mt-[0px]">
      {/* 1. HEADER (B&W Style) */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0E0]">
        <h1 className="text-3xl font-bold text-[#11131F]">Daily Milk Production</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#11131F] text-white rounded-lg hover:bg-black transition-colors"
        >
          <Plus size={18} /> Record Milk Production
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <Target className="text-[#EF4444]" size={28} />
            <span className="text-xs font-bold text-[#2ECC71] px-2 py-1 bg-[#EAFBF3] rounded-full">Today</span>
          </div>
          <p className="text-sm font-semibold text-[#8C92AC] mb-1">Total Milk (Liters)</p>
          <p className="text-4xl font-extrabold text-[#EF4444]">{totalLitersToday.toFixed(2)}<span className="text-xl font-bold text-[#8C92AC] ml-1">L</span></p>
          <p className="text-xs text-[#8C92AC] mt-1.5">{productionRecords.filter(r=>r.date.startsWith(today)).length} Milking sessions</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-[#3498DB]" size={28} />
          </div>
          <p className="text-sm font-semibold text-[#8C92AC] mb-1">Most Productive Cow Today</p>
          <p className="text-3xl font-extrabold text-black">{bestCowToday.name}</p>
          <p className="text-lg font-bold text-[#3498DB]">{bestCowToday.liters.toFixed(2)} Liters</p>
        </div>

        {/* KPI: Meta Semanal sutil */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-[#11131F]" size={28} />
          </div>
          <p className="text-sm font-semibold text-[#8C92AC] mb-1">Weekly Average Performance</p>
          <p className="text-4xl font-extrabold text-[#11131F]">--<span className="text-xl font-bold ml-1">%</span></p>
          <p className="text-xs text-[#8C92AC] mt-1.5">Goal calculation active next update</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#EBEBEB] mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-[#EF4444]" size={24} />
          <h2 className="text-xl font-bold text-black">Milk Production Trend (Last 14 Milking Sessions)</h2>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
            <XAxis dataKey="date" tick={{ fill: '#8C92AC', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8C92AC', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #EBEBEB', borderRadius: '10px', color: '#000000' }} />
            <Area type="monotone" dataKey="Liters" stroke="#1dd35d" fillOpacity={0.1} fill="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#EBEBEB]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Recent Milking Sessions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-[#8C92AC]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by cow name or ID..."
              className="pl-10 pr-4 py-3 bg-[#F4F6F8] rounded-full text-sm border border-[#E0E0E0] focus:ring-1 focus:ring-[#11131F]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F4F6F8] rounded-xl text-[#8C92AC] text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-5 rounded-l-xl">Date / Time</th>
                <th className="p-5">Cow ID / Name</th>
                <th className="p-5">Liters Produced</th>
                <th className="p-5 rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {filteredRecords.slice(0, 10).map((record) => (
                <tr key={record.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="p-5 text-sm text-[#8C92AC]">{new Date(record.date).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-5 text-sm font-semibold text-black">{record.animal_name || `#${record.animal}`}</td>
                  <td className="p-5 text-base font-bold text-[#77F74A]">{parseFloat(record.liters_produced).toFixed(2)} L</td>
                  <td className="p-5 text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => handleEdit(e, record)} className="text-[#3498DB] hover:text-black p-1.5 rounded-full hover:bg-blue-50"><Edit2 size={16} /></button>
                      <button onClick={(e) => handleDelete(e, record.id)} className="text-[#EF4444] hover:text-black p-1.5 rounded-full hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-[#EBEBEB]">
            <h2 className="text-2xl font-bold text-black mb-6">{editingId ? 'Edit Milking Session' : 'Record Milking Session'}</h2>
            <form onSubmit={handleSubmitMilking} className="space-y-5">
              {/* Selector de Animal (B&W sutil) */}
              <div>
                <label className="block text-sm font-semibold text-[#8C92AC] mb-1.5">Select Cow *</label>
                <select name="animal" value={form.animal} onChange={handleInputChange} className="w-full p-3 py-3.5 bg-[#F4F6F8] rounded-xl text-black border border-[#E0E0E0] text-sm focus:ring-1 focus:ring-[#11131F]" required>
                  <option value="">-- Choose Cow --</option>
                  {availableAnimals.map(animal => (
                    <option key={animal.id} value={animal.id}>{animal.nombre || `#${animal.id}`} ({animal.raza})</option>
                  ))}
                </select>
              </div>
              {/* Input Litros (B&W sutil con Rojo) */}
              <div>
                <label className="block text-sm font-semibold text-[#8C92AC] mb-1.5">Liters Produced *</label>
                <input type="number" step="0.01" name="liters_produced" value={form.liters_produced} onChange={handleInputChange} className="w-full p-3 py-3.5 bg-[#F4F6F8] rounded-xl text-black border border-[#E0E0E0] text-lg font-bold focus:ring-1 focus:ring-[#11131F]" placeholder="0.00" required />
              </div>
              {/* Input Fecha (automática sutil) */}
              <div>
                <label className="block text-sm font-semibold text-[#8C92AC] mb-1.5">Date (Automatic Today)</label>
                <input type="date" name="date" value={form.date} onChange={handleInputChange} className="w-full p-3 bg-[#F4F6F8] rounded-xl text-[#8C92AC] border border-[#E0E0E0] text-sm" />
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm({ animal: '', liters_produced: '', date: new Date().toISOString().split('T')[0] });
                  }}
                  className="px-6 py-3 bg-[#F4F6F8] text-[#8C92AC] rounded-full hover:bg-[#EBEBEB] text-sm font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-[#77F74A] text-white rounded-full hover:bg-black text-sm font-bold shadow-sm">{editingId ? 'Update' : 'Save Recording'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPage;
