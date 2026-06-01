import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Search, Plus, Trash2, Edit2, X, Camera, RefreshCw, DollarSign, Tag } from 'lucide-react';
import Swal from 'sweetalert2';

export default function LivestockPage() {
  const [animals, setAnimals] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', fecha_nacimiento: '', edad: '', peso: '', raza: '', sexo: 'Hembra',
    id_madre: '', id_padre: '', metodo_obtencion: '', batch: '',
    categoria: '', valor_manual: '' // ✅ Nuevos campos financieros
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [animalRes, batchRes, priceRes] = await Promise.all([
        apiClient.get(`/livestock/?search=${searchTerm}&estado=1`),
        apiClient.get('/batches/'),
        apiClient.get('/precios-mercado/')
      ]);
      
      setAnimals(Array.isArray(animalRes.data) ? animalRes.data : animalRes.data.results);
      setBatches(Array.isArray(batchRes.data) ? batchRes.data : batchRes.data.results);
      setCategories(Array.isArray(priceRes.data) ? priceRes.data : priceRes.data.results);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [searchTerm]);

  const handleViewPreview = (animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  const handleEdit = (e, animal) => {
    e.stopPropagation(); 
    setEditingId(animal.id);
    setFormData({
      nombre: animal.nombre || '',
      fecha_nacimiento: animal.fecha_nacimiento || '',
      edad: animal.edad || '',
      peso: animal.peso || '',
      raza: animal.raza || '',
      sexo: animal.sexo || 'Hembra',
      id_madre: animal.id_madre || '',
      id_padre: animal.id_padre || '',
      metodo_obtencion: animal.metodo_obtencion || '',
      batch: animal.batch || '',
      categoria: animal.categoria || '', // ID de la categoría
      valor_manual: animal.valor_manual || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ 
        nombre: '', fecha_nacimiento: '', edad: '', peso: '', raza: '', sexo: 'Hembra', 
        id_madre: '', id_padre: '', metodo_obtencion: '', batch: '', categoria: '', valor_manual: '' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanData = {
        ...formData,
        id_madre: formData.id_madre || null,
        id_padre: formData.id_padre || null,
        metodo_obtencion: formData.metodo_obtencion || null,
        batch: formData.batch || null,
        categoria: formData.categoria || null,
        valor_manual: formData.valor_manual || null
      };

      if (editingId) {
        await apiClient.put(`/livestock/${editingId}/`, cleanData);
      } else {
        await apiClient.post('/livestock/', cleanData);
      }

      Swal.fire({
        title: 'Success!',
        text: `Animal record ${editingId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchData();
      cancelEdit();
    } catch (err) {
      Swal.fire({ title: 'Submission Failed', text: 'Check connection or data.', icon: 'error' });
    }
  };

  return (
    <div className="space-y-6 text-black p-4">
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Livestock Control</h1>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Search by name, ID or breed..." 
            className="w-full bg-white border border-black/10 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-ganadero-active transition-all text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULARIO CLARO */}
        <div className="lg:col-span-4">
          <div className={`bg-white border ${editingId ? 'border-blue-400' : 'border-black/10'} rounded-2xl p-6 shadow-sm transition-all`}>
            <h2 className="font-bold flex items-center gap-2 mb-6 text-[#11131F]">
              {editingId ? <RefreshCw size={20} className="text-blue-500" /> : <Plus size={20} className="text-ganadero-active" />}
              {editingId ? 'Edit Animal' : 'Register Animal'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">General Information</label>
                <input required placeholder="Animal Name" className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 mt-1 text-sm outline-none focus:border-ganadero-active"
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select required className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                  value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                  <option value="">-- Batch --</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select required className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                  value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  <option value="">-- Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.categoria}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Breed" className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                  value={formData.raza} onChange={e => setFormData({...formData, raza: e.target.value})} />
                <input required type="number" step="0.01" placeholder="Weight (kg)" className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                  value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
              </div>

              {/* ✅ CAMPO DE VALOR MANUAL (OPCIONAL) */}
              <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                <label className="text-[9px] text-yellow-700 uppercase font-black flex items-center gap-1 mb-1">
                  <DollarSign size={10}/> Custom Value (Optional)
                </label>
                <input type="number" placeholder="Fixed Price (C$)" className="w-full bg-white border border-yellow-200 rounded-lg p-2 text-sm outline-none focus:border-yellow-400"
                  value={formData.valor_manual} onChange={e => setFormData({...formData, valor_manual: e.target.value})} />
                <p className="text-[8px] text-yellow-600 mt-1">* If empty, value is calculated by weight.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Age" className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                  value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                <select className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                  value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                  <option value="Hembra">Female</option>
                  <option value="Macho">Male</option>
                </select>
              </div>

              <input required type="date" className="w-full bg-[#f8f9fa] border border-black/10 rounded-xl p-3 text-sm outline-none focus:border-ganadero-active"
                value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />

              <button type="submit" className={`w-full font-bold py-3.5 rounded-xl mt-4 shadow-lg transition-all ${editingId ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20' : 'bg-ganadero-active text-black hover:bg-ganadero-active/90 shadow-ganadero-active/20'}`}>
                {editingId ? 'Update Records' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>

        {/* TABLA REFORZADA CON PRECIOS */}
        <div className="lg:col-span-8">
          <div className="bg-[#f8f9fa] border border-black/10 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/5 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                  <th className="p-4">Animal</th>
                  <th className="p-4">Group / Type</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Est. Value</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {animals.map((animal) => (
                  <tr key={animal.id} onClick={() => handleViewPreview(animal)} className="hover:bg-black/5 cursor-pointer transition-colors bg-white">
                    <td className="p-4">
                      <p className="font-bold text-[#11131F] group-hover:text-green-600">{animal.nombre}</p>
                      <p className="text-[10px] text-gray-400">ID: #{animal.id} • {animal.sexo}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-gray-600 uppercase">{animal.batch_name || 'No Group'}</p>
                      <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">{animal.categoria_nombre}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-[#11131F]">{animal.peso} <span className="text-[9px] text-gray-400">KG</span></p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-green-600">C$ {animal.valor_estimado}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={(e) => handleEdit(e, animal)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-all"><Edit2 size={16}/></button>
                        <button onClick={(e) => handleDelete(e, animal.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ANIMAL CV MODAL - VERSIÓN CLARA Y PROFESIONAL */}
      {isModalOpen && selectedAnimal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            <div className="w-full md:w-2/5 bg-[#f8f9fa] p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/10 relative text-center">
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedAnimal.sexo === 'Hembra' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                {selectedAnimal.sexo}
              </span>
              <div className="w-32 h-32 rounded-full border-4 border-ganadero-active flex items-center justify-center bg-white mb-4 shadow-lg shadow-ganadero-active/10">
                <Camera size={40} className="text-gray-300" />
              </div>
              <h2 className="text-2xl font-black text-[#11131F] mb-1">{selectedAnimal.nombre}</h2>
              <p className="text-xs font-bold text-ganadero-active uppercase tracking-tighter">#{selectedAnimal.id} • {selectedAnimal.raza}</p>
            </div>

            <div className="w-full md:w-3/5 p-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X size={20}/></button>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1"><Tag size={10}/> Category</p>
                  <p className="text-sm text-[#11131F] font-bold mt-1">{selectedAnimal.categoria_nombre}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1"><DollarSign size={10}/> Market Value</p>
                  <p className="text-lg text-green-600 font-black mt-1">C$ {selectedAnimal.valor_estimado}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Current Weight</p>
                  <p className="text-sm text-[#11131F] font-bold mt-1">{selectedAnimal.peso} kg</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Batch / Group</p>
                  <p className="text-sm text-[#11131F] font-bold mt-1">{selectedAnimal.batch_name || 'Unassigned'}</p>
                </div>
                
                <div className="col-span-2 bg-[#f8f9fa] p-4 rounded-2xl border border-black/5 mt-2">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-3 tracking-widest">Lineage & History</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded-xl text-center">
                      <p className="text-[8px] text-gray-400 uppercase">Mother</p>
                      <p className="text-xs font-bold text-[#11131F]">#{selectedAnimal.id_madre || '-'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl text-center">
                      <p className="text-[8px] text-gray-400 uppercase">Father</p>
                      <p className="text-xs font-bold text-[#11131F]">#{selectedAnimal.id_padre || '-'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl text-center">
                      <p className="text-[8px] text-gray-400 uppercase">Obtained</p>
                      <p className="text-[10px] font-bold text-[#11131F]">{selectedAnimal.metodo_obtencion || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}