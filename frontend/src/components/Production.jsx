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
  const [editingId, setEditingId] = useState(null);

  // 🔥 SOLUCIÓN AL BUG DE ZONA HORARIA
  // Extrae la fecha local exacta (Nicaragua)
  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [form, setForm] = useState({ 
    animal: '', 
    liters_produced: '', 
    date: getLocalDate() 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Asume que Django ya filtra por estado=1 internamente con el .objects.filter(estado=1)
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

  const today = getLocalDate();
  
  const totalLitersToday = productionRecords
    .filter(rec => rec.date && rec.date.startsWith(today))
    .reduce((sum, rec) => sum + parseFloat(rec.liters_produced), 0);

  const todayProduction = productionRecords.filter(rec => rec.date && rec.date.startsWith(today));
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
      confirmButtonColor: '#2563EB', // Blue
      cancelButtonColor: '#6B7280',  // Gray
      confirmButtonText: 'Yes, edit it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setEditingId(record.id);
    setForm({
      animal: record.animal ?? '',
      liters_produced: record.liters_produced ?? '',
      date: (record.date ? String(record.date).slice(0, 10) : getLocalDate()),
    });
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Archive Record?',
      text: "This will remove the milking session from the active dashboard but keep it in the history.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626', // Red
      cancelButtonColor: '#6B7280',  // Gray
      confirmButtonText: 'Yes, archive it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      // 🔥 MAGIA DEL SOFT DELETE
      await apiClient.patch(`/milk-production/${id}/`, { estado: 0 });
      Swal.fire({
        title: 'Archived!',
        text: 'The milking record has been hidden.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
      if (editingId === id) {
        setEditingId(null);
        setForm({ animal: '', liters_produced: '', date: getLocalDate() });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not archive the record.', icon: 'error', confirmButtonColor: '#DC2626' });
    }
  };

  const handleSubmitMilking = async (e) => {
    e.preventDefault();
    const litersNum = Number(form.liters_produced);
    if (!Number.isFinite(litersNum) || litersNum < 0) {
      Swal.fire({
        title: 'Invalid Liters',
        text: 'Liters produced cannot be negative.',
        icon: 'error',
        confirmButtonColor: '#2563EB',
      });
      return;
    }
    try {
      const payload = { ...form, liters_produced: litersNum };
      if (editingId) {
        await apiClient.put(`/milk-production/${editingId}/`, payload);
      } else {
        await apiClient.post('/milk-production/', payload);
      }
      Swal.fire({ title: 'Recorded!', text: `Milking session ${editingId ? 'updated' : 'saved'} successfully.`, icon: 'success', timer: 1500, showConfirmButton: false });
      setShowModal(false);
      setEditingId(null);
      setForm({ animal: '', liters_produced: '', date: getLocalDate() });
      fetchData(); 
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not record milking.', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const filteredRecords = productionRecords
    .filter((rec) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      const name = (rec.animal_name || '').toString().toLowerCase();
      const id = (rec.animal ?? '').toString().toLowerCase();
      const dateStr = (rec.date || '').toString().toLowerCase(); 
      return name.includes(q) || id.includes(q) || dateStr.includes(q);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)) 
    .slice(0, 7); 

  if (isLoading) return <div className="flex-1 p-8 bg-[#F5F4F0] text-center mt-20 font-bold text-green-900 animate-pulse">Loading data...</div>;

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-4 text-stone-800">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-2">Daily Milk Production</h1>
          <p className="text-sm text-amber-900 font-semibold mt-1">Track milking sessions and herd yield</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setForm({ animal: '', liters_produced: '', date: getLocalDate() });
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all font-black"
        >
          <Plus size={18} strokeWidth={2.5} /> Record Milking
        </button>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* KPI: Today Total */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <Target className="text-amber-700" size={28} />
            <span className="text-[10px] font-black text-green-700 px-3 py-1 bg-green-50 rounded-full uppercase tracking-widest border border-green-100">Today</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Milk (Liters)</p>
          <p className="text-4xl font-black text-green-900">{totalLitersToday.toFixed(2)}<span className="text-lg font-bold text-stone-400 ml-1">L</span></p>
          <p className="text-xs font-bold text-amber-800 mt-2">{todayProduction.length} Milking sessions</p>
        </div>

        {/* KPI: Best Cow */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-green-600" size={28} />
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Most Productive Cow Today</p>
          <p className="text-3xl font-black text-amber-900">{bestCowToday.name}</p>
          <p className="text-sm font-bold text-green-700 bg-green-50 inline-block px-2 py-0.5 rounded-md mt-1 border border-green-100">{bestCowToday.liters.toFixed(2)} Liters</p>
        </div>

        {/* KPI: Weekly Goal */}
        <div className="bg-[#FAF8F5] p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-stone-400" size={28} />
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Weekly Average Yield</p>
          <p className="text-4xl font-black text-stone-700">--<span className="text-xl font-bold ml-1">%</span></p>
          <p className="text-xs font-semibold text-stone-500 mt-2">Goal calculation active next update</p>
        </div>
      </div>

      {/* 3. CHART SECTION */}
      <div className="bg-white p-8 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-amber-800" size={24} />
          <h2 className="text-xl font-black text-green-900">Production Trend (Last 14 Milking Sessions)</h2>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E7E5E4', borderRadius: '12px', color: '#1C1917', fontWeight: 'bold' }} />
            {/* Elegant Green Chart */}
            <Area type="monotone" dataKey="Liters" stroke="#166534" fillOpacity={0.2} fill="#86EFAC" strokeWidth={3} dot={{ fill: '#166534', strokeWidth: 2, r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4. TABLE SECTION */}
      <div className="bg-white p-8 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-black text-green-900">Recent Milking Sessions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by cow name, ID or date..."
              className="w-full md:w-80 pl-10 pr-4 py-2.5 bg-stone-50 rounded-xl text-sm border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 font-semibold text-stone-800 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F5] border-b border-stone-200 text-amber-900 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-5 pl-6">Date / Time</th>
                <th className="p-5">Cow ID / Name</th>
                <th className="p-5">Liters Produced</th>
                <th className="p-5 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-5 pl-6 text-xs font-bold text-stone-500">
                      {new Date(record.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5 text-sm font-black text-green-900">{record.animal_name || `#${record.animal}`}</td>
                    <td className="p-5 text-sm font-black text-stone-800">
                      {parseFloat(record.liters_produced).toFixed(2)} <span className="text-[10px] text-stone-400">L</span>
                    </td>
                    <td className="p-5 pr-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* Azul para Editar */}
                        <button onClick={(e) => handleEdit(e, record)} className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all shadow-sm">
                          <Edit2 size={16} strokeWidth={2.5}/>
                        </button>
                        {/* Rojo para Eliminar */}
                        <button onClick={(e) => handleDelete(e, record.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 transition-all shadow-sm">
                          <Trash2 size={16} strokeWidth={2.5}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center">
                    <span className="text-4xl mb-4 block">🥛</span>
                    <h3 className="text-lg font-black text-green-900">No sessions found</h3>
                    <p className="text-sm font-semibold text-stone-500 mt-1">There are no milking records matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-stone-200">
            <h2 className="text-2xl font-black text-green-900 mb-6 border-b border-stone-100 pb-4">
              {editingId ? 'Edit Milking Session' : 'Record Milking Session'}
            </h2>
            
            <form onSubmit={handleSubmitMilking} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Select Cow *</label>
                <select name="animal" value={form.animal} onChange={handleInputChange} className="w-full p-3.5 bg-stone-50 rounded-xl text-stone-800 font-semibold border border-stone-200 text-sm focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all" required>
                  <option value="">-- Choose Cow --</option>
                  {availableAnimals.map(animal => (
                    <option key={animal.id} value={animal.id}>{animal.nombre || `#${animal.id}`} ({animal.raza})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Liters Produced *</label>
                <input type="number" step="0.01" min="0" name="liters_produced" value={form.liters_produced} onChange={handleInputChange} className="w-full p-3.5 bg-stone-50 rounded-xl text-green-900 font-black border border-stone-200 text-lg focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all" placeholder="0.00" required />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleInputChange} className="w-full p-3.5 bg-stone-50 rounded-xl text-stone-600 font-bold border border-stone-200 text-sm focus:ring-4 focus:ring-green-800/10 focus:border-green-800 outline-none transition-all" />
              </div>
              
              <div className="flex gap-4 justify-end pt-4 mt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setForm({ animal: '', liters_produced: '', date: getLocalDate() });
                  }}
                  className="px-6 py-3.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 text-sm font-black transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-black shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
                  {editingId ? <Edit2 size={16}/> : <Plus size={16}/>}
                  {editingId ? 'Update' : 'Save Recording'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPage;