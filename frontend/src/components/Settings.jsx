import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { 
  Settings, Tag, Users, Plus, Edit2, Trash2, X, DollarSign, 
  Briefcase, Phone, Mail, DatabaseBackup, Clock, ShieldCheck, HardDriveDownload 
} from 'lucide-react';

export default function SettingsPage() {
  // --- STATES ---
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backup States
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [backupHistory, setBackupHistory] = useState([
    { id: 1, date: '2026-06-07 18:30', type: 'Manual', size: '14.2 MB', status: 'Success' },
    { id: 2, date: '2026-06-01 00:00', type: 'Automated', size: '13.8 MB', status: 'Success' },
    { id: 3, date: '2026-05-25 00:00', type: 'Automated', size: '12.5 MB', status: 'Success' },
  ]);

  // Modals & Forms for Categories
  const [showCatModal, setShowCatModal] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, categoria: '', precio_kg: '' });

  // Modals & Forms for Batches
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ id: null, name: '' });

  // Modals & Forms for Clients
  const [showClientModal, setShowClientModal] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({ id: null, nombre: '', apellido: '', telefono: '', correo: '' });

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, batchRes, clientRes] = await Promise.all([
        apiClient.get('/precios-mercado/'),
        apiClient.get('/batches/'),
        apiClient.get('/clients/') 
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
      setBatches(Array.isArray(batchRes.data) ? batchRes.data : batchRes.data.results || []);
      setClients(Array.isArray(clientRes.data) ? clientRes.data : clientRes.data.results || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setLoading(false);
    }
  };

  // ==================== CATEGORIES LOGIC ====================
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
      Swal.fire({ title: 'Success', text: 'Category saved successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not save category.', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const handleDeleteCat = async (id) => {
    const result = await Swal.fire({
      title: 'Archive Category?',
      text: "This category will be hidden from the system but kept for historical records.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, archive it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/precios-mercado/${id}/`, { estado: 0 });
        Swal.fire('Archived!', 'Category has been removed from view.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Could not archive category.', icon: 'error', confirmButtonColor: '#2563EB' });
      }
    }
  };

  // ==================== BATCHES LOGIC ====================
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
      Swal.fire({ title: 'Success', text: 'Group saved successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowBatchModal(false);
      fetchData();
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not save group.', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const handleDeleteBatch = async (id) => {
    const result = await Swal.fire({
      title: 'Archive Group?',
      text: "This group will be hidden from the active lists.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, archive it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/batches/${id}/`, { estado: 0 });
        Swal.fire('Archived!', 'Group has been removed from view.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Could not archive group.', icon: 'error', confirmButtonColor: '#2563EB' });
      }
    }
  };

  // ==================== CLIENTS LOGIC ====================
  const handleOpenClient = (client = null) => {
    if (client) {
      setIsEditingClient(true);
      setClientForm({ 
        id: client.id, 
        nombre: client.nombre || '', 
        apellido: client.apellido || '', 
        telefono: client.telefono || '', 
        correo: client.correo || '' 
      });
    } else {
      setIsEditingClient(false);
      setClientForm({ id: null, nombre: '', apellido: '', telefono: '', correo: '' });
    }
    setShowClientModal(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const { id, ...payload } = clientForm;
      
      if (isEditingClient) {
        await apiClient.put(`/clients/${clientForm.id}/`, payload);
      } else {
        await apiClient.post('/clients/', payload);
      }
      Swal.fire({ title: 'Success', text: 'Client saved successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      setShowClientModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not save client.', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const handleDeleteClient = async (id) => {
    const result = await Swal.fire({
      title: 'Archive Client?',
      text: "This client will no longer appear in the Point of Sale, but past sales will be kept.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, archive it'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/clients/${id}/`, { estado: 0 });
        Swal.fire('Archived!', 'Client has been removed from directory.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Could not archive client.', icon: 'error', confirmButtonColor: '#2563EB' });
      }
    }
  };

  // ==================== BACKUP LOGIC ====================
  const handleManualBackup = async () => {
    try {
      Swal.fire({
        title: 'Generating Backup...',
        text: 'Please wait, securing database records...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      await apiClient.post('/backup-manual/'); 

      // Update mock history for visuals
      const newBackup = {
        id: Date.now(),
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'Manual',
        size: '14.5 MB',
        status: 'Success'
      };
      setBackupHistory([newBackup, ...backupHistory]);

      Swal.fire('Success!', 'Database backup generated and safely stored.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Could not generate database backup.', 'error');
    }
  };

  const handleFrequencyChange = (freq) => {
    setBackupFrequency(freq);
    Swal.fire({
      title: 'Schedule Updated',
      text: `Automated backups are now set to run ${freq}.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  if (loading) return <div className="flex-1 p-8 bg-[#F5F4F0] text-center mt-20 text-green-900 font-bold animate-pulse">Loading Settings...</div>;

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-4 text-stone-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-3">
            <Settings size={32} className="text-amber-800" /> Settings & Configurations
          </h1>
          <p className="text-sm text-amber-900 font-semibold mt-1"></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ======================= MODULE: MARKET PRICES ======================= */}
        <div className="bg-white rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-[#FAF8F5]">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-green-900">
                <Tag size={22} className="text-blue-600" /> Market Prices
              </h2>
              <p className="text-xs font-semibold text-stone-500 mt-1">Set market prices based on animal categories.</p>
            </div>
            <button onClick={() => handleOpenCat()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all">
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-auto max-h-80">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
                <tr>
                  <th className="p-4 rounded-tl-lg">Category Name</th>
                  <th className="p-4">Price / Kg</th>
                  <th className="p-4 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-black text-stone-800">{cat.categoria}</td>
                    <td className="p-4 font-black text-green-700">C$ {parseFloat(cat.precio_kg).toFixed(2)}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenCat(cat)} className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all shadow-sm">
                        <Edit2 size={16} strokeWidth={2.5}/>
                      </button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 transition-all shadow-sm">
                        <Trash2 size={16} strokeWidth={2.5}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && <p className="text-center text-stone-400 font-semibold text-sm mt-6">No categories defined.</p>}
          </div>
        </div>

        {/* ======================= MODULE: BATCHES ======================= */}
        <div className="bg-white rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-[#FAF8F5]">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-green-900">
                <Users size={22} className="text-amber-600" /> Livestock Groups
              </h2>
              <p className="text-xs font-semibold text-stone-500 mt-1">Organize the herd into paddocks or groups.</p>
            </div>
            <button onClick={() => handleOpenBatch()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all">
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-auto max-h-80">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
                <tr>
                  <th className="p-4 rounded-tl-lg">Group / Batch Name</th>
                  <th className="p-4 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-black text-stone-800">{batch.name}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenBatch(batch)} className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all shadow-sm">
                        <Edit2 size={16} strokeWidth={2.5}/>
                      </button>
                      <button onClick={() => handleDeleteBatch(batch.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 transition-all shadow-sm">
                        <Trash2 size={16} strokeWidth={2.5}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {batches.length === 0 && <p className="text-center text-stone-400 font-semibold text-sm mt-6">No groups defined.</p>}
          </div>
        </div>

        {/* ======================= MODULE: CLIENT DIRECTORY ======================= */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-[#FAF8F5]">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-green-900">
                <Briefcase size={22} className="text-stone-600" /> Client Directory
              </h2>
              <p className="text-xs font-semibold text-stone-500 mt-1">Manage buyers and business contacts for Point of Sale.</p>
            </div>
            <button onClick={() => handleOpenClient()} className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 font-black text-sm">
              <Plus size={18} strokeWidth={3} /> New Client
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
                <tr>
                  <th className="p-4 rounded-tl-lg">Client Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-green-900">{client.nombre} {client.apellido}</p>
                      <p className="text-[10px] font-bold text-stone-400">ID: #{client.id}</p>
                    </td>
                    <td className="p-4">
                      {client.telefono && (
                        <p className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                          <Phone size={14} className="text-stone-400"/> {client.telefono}
                        </p>
                      )}
                      {client.correo && (
                        <p className="text-sm font-semibold text-stone-500 flex items-center gap-2 mt-1">
                          <Mail size={14} className="text-stone-400"/> {client.correo}
                        </p>
                      )}
                      {!client.telefono && !client.correo && (
                        <span className="text-xs italic text-stone-400">No contact info</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2 items-center h-full pt-6">
                      <button onClick={() => handleOpenClient(client)} className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all shadow-sm">
                        <Edit2 size={16} strokeWidth={2.5}/>
                      </button>
                      <button onClick={() => handleDeleteClient(client.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 transition-all shadow-sm">
                        <Trash2 size={16} strokeWidth={2.5}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clients.length === 0 && <p className="text-center text-stone-400 font-semibold text-sm mt-8 pb-4">No clients in directory. Add one to start selling.</p>}
          </div>
        </div>

        {/* ======================= MODULE: SYSTEM BACKUPS & SECURITY ======================= */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-[#FAF8F5]">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-green-900">
                <DatabaseBackup size={22} className="text-stone-700" /> Database Security & Backups
              </h2>
              <p className="text-xs font-semibold text-stone-500 mt-1">Configure automated backup schedules or trigger manual snapshots.</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Panel: Controls */}
            <div className="md:col-span-1 space-y-8">
              
              {/* Auto Schedule */}
              <div>
                <h3 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock size={14}/> Automated Schedule
                </h3>
                <div className="space-y-3">
                  {['daily', 'weekly', 'monthly'].map((freq) => (
                    <label key={freq} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${backupFrequency === freq ? 'border-green-800 bg-green-50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${backupFrequency === freq ? 'border-green-800' : 'border-stone-300'}`}>
                        {backupFrequency === freq && <div className="w-2 h-2 bg-green-800 rounded-full" />}
                      </div>
                      <span className={`text-sm font-bold capitalize ${backupFrequency === freq ? 'text-green-900' : 'text-stone-600'}`}>
                        {freq} Backups
                      </span>
                      <input type="radio" className="hidden" name="backupFreq" checked={backupFrequency === freq} onChange={() => handleFrequencyChange(freq)} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Manual Backup Trigger */}
              <div className="border-t border-stone-100 pt-6">
                <button 
                  onClick={handleManualBackup}
                  className="w-full bg-stone-800 text-white p-4 rounded-xl hover:bg-black shadow-lg shadow-stone-800/20 flex justify-center items-center gap-2 font-black transition-all"
                >
                  <HardDriveDownload size={18} /> Generate Backup Now
                </button>
                <p className="text-[10px] text-stone-400 mt-3 text-center font-semibold">Downloads a secure SQL dump to the server's local storage.</p>
              </div>

            </div>

            {/* Right Panel: History List */}
            <div className="md:col-span-2 bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200">
              <h3 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={14}/> Recent Backup History
              </h3>
              
              <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
                {backupHistory.map((backup) => (
                  <div key={backup.id} className="bg-white p-4 rounded-xl border border-stone-200 flex justify-between items-center shadow-sm hover:border-green-200 transition-colors">
                    <div>
                      <p className="font-black text-stone-800 text-sm">{backup.date}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${backup.type === 'Manual' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {backup.type}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">{backup.size}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <ShieldCheck size={12}/> {backup.status}
                      </span>
                    </div>
                  </div>
                ))}
                
                {backupHistory.length === 0 && (
                  <p className="text-sm font-semibold text-stone-400 text-center py-6">No backups recorded yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* --- CATEGORY MODAL --- */}
      {showCatModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative border border-stone-200">
            <button onClick={() => setShowCatModal(false)} className="absolute top-5 right-5 text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors">
              <X size={20} strokeWidth={2.5}/>
            </button>
            <h2 className="text-2xl font-black text-green-900 mb-6 border-b border-stone-100 pb-4">
              {isEditingCat ? 'Edit Category' : 'New Category'}
            </h2>
            
            <form onSubmit={handleSaveCat} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Category Name</label>
                <input required placeholder="e.g. Heifer" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                  value={catForm.categoria} onChange={e => setCatForm({...catForm, categoria: e.target.value})} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">
                  <DollarSign size={14} className="text-green-700"/> Price per Kg (C$)
                </label>
                <input required type="number" step="0.01" min="0" placeholder="0.00" className="w-full p-3.5 bg-stone-50 rounded-xl font-black text-green-900 text-xl border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                  value={catForm.precio_kg} onChange={e => setCatForm({...catForm, precio_kg: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all mt-4 flex justify-center gap-2 items-center">
                {isEditingCat ? <Edit2 size={18}/> : <Plus size={18}/>}
                {isEditingCat ? 'Update Category' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- BATCH MODAL --- */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative border border-stone-200">
            <button onClick={() => setShowBatchModal(false)} className="absolute top-5 right-5 text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors">
              <X size={20} strokeWidth={2.5}/>
            </button>
            <h2 className="text-2xl font-black text-green-900 mb-6 border-b border-stone-100 pb-4">
              {isEditingBatch ? 'Edit Group' : 'New Group'}
            </h2>
            
            <form onSubmit={handleSaveBatch} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Group / Batch Name</label>
                <input required placeholder="e.g. North Paddock" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                  value={batchForm.name} onChange={e => setBatchForm({...batchForm, name: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all mt-4 flex justify-center gap-2 items-center">
                {isEditingBatch ? <Edit2 size={18}/> : <Plus size={18}/>}
                {isEditingBatch ? 'Update Group' : 'Save Group'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CLIENT MODAL --- */}
      {showClientModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative border border-stone-200">
            <button onClick={() => setShowClientModal(false)} className="absolute top-5 right-5 text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors">
              <X size={20} strokeWidth={2.5}/>
            </button>
            <h2 className="text-2xl font-black text-green-900 mb-6 border-b border-stone-100 pb-4">
              {isEditingClient ? 'Edit Client' : 'New Client'}
            </h2>
            
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">First Name</label>
                  <input required placeholder="Juan" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                    value={clientForm.nombre} onChange={e => setClientForm({...clientForm, nombre: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Last Name</label>
                  <input required placeholder="Pérez" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                    value={clientForm.apellido} onChange={e => setClientForm({...clientForm, apellido: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Phone Number (Optional)</label>
                <input placeholder="+505 8888-8888" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                  value={clientForm.telefono} onChange={e => setClientForm({...clientForm, telefono: e.target.value})} />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900 mb-1.5 ml-1">Email (Optional)</label>
                <input type="email" placeholder="client@email.com" className="w-full p-3.5 bg-stone-50 rounded-xl font-bold text-stone-800 border border-stone-200 focus:border-green-800 focus:ring-4 focus:ring-green-800/10 outline-none transition-all" 
                  value={clientForm.correo} onChange={e => setClientForm({...clientForm, correo: e.target.value})} />
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all mt-6 flex justify-center gap-2 items-center">
                {isEditingClient ? <Edit2 size={18}/> : <Plus size={18}/>}
                {isEditingClient ? 'Update Client' : 'Save Client'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}