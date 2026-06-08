import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Search, Plus, Trash2, Edit2, X, Camera, RefreshCw, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
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

  // 🔥 Se añadió "imagen: null" y se puso "Nacido" como default en método de obtención
  const [formData, setFormData] = useState({
    nombre: '', fecha_nacimiento: '', edad: '', peso: '', raza: '', sexo: 'Hembra',
    id_madre: '', id_padre: '', metodo_obtencion: 'Nacido', batch: '',
    categoria: '', valor_manual: '', imagen: null 
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
      metodo_obtencion: animal.metodo_obtencion || 'Nacido',
      batch: animal.batch || '',
      categoria: animal.categoria || '', 
      valor_manual: animal.valor_manual || '',
      imagen: null // El input de tipo 'file' no se puede rellenar con un string, se deja en null
    });
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626', 
      cancelButtonColor: '#6B7280',  
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.patch(`/livestock/${id}/`, { estado: 0 }); 
          Swal.fire('Deleted!', 'The animal has been removed from the registry.', 'success');
          fetchData(); 
        } catch (err) {
          Swal.fire('Error', 'Could not delete the record.', 'error');
        }
      }
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ 
        nombre: '', fecha_nacimiento: '', edad: '', peso: '', raza: '', sexo: 'Hembra', 
        id_madre: '', id_padre: '', metodo_obtencion: 'Nacido', batch: '', categoria: '', valor_manual: '', imagen: null 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 🔥 CRÍTICO: Como enviamos imágenes, usamos FormData en vez de un JSON plano
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'imagen') {
          // Solo agregamos la imagen si el usuario seleccionó un archivo nuevo
          if (formData.imagen instanceof File) {
            formDataToSend.append('imagen', formData.imagen);
          }
        } else {
          // Agregamos el resto de los campos si no están vacíos
          if (formData[key] !== null && formData[key] !== '') {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (editingId) {
        await apiClient.put(`/livestock/${editingId}/`, formDataToSend, config);
      } else {
        await apiClient.post('/livestock/', formDataToSend, config);
      }

      Swal.fire({
        title: 'Success!',
        text: `Record ${editingId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchData();
      cancelEdit();
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Please check the provided data.', icon: 'error' });
    }
  };

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? batch.name : 'No Group';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.categoria : 'Unassigned';
  };

  return (
    <div className="space-y-6 text-stone-800 p-4 bg-[#F5F4F0] min-h-screen">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-2">
            🐄 Livestock Control
          </h1>
          <p className="text-sm text-amber-900 font-semibold mt-1">Comprehensive herd management</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" placeholder="Search by name, ID or breed..." 
            className="w-full bg-white border border-stone-300 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all text-sm font-semibold text-stone-800 placeholder-stone-400"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULARIO ESTILO FINCA */}
        <div className="lg:col-span-4">
          <div className={`bg-white border ${editingId ? 'border-blue-400 shadow-blue-500/10' : 'border-stone-200 shadow-stone-500/5'} rounded-2xl p-6 shadow-lg transition-all`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-green-900 flex items-center gap-2 text-lg">
                {editingId ? <RefreshCw size={22} className="text-blue-600" /> : <Plus size={22} className="text-green-800" />}
                {editingId ? 'Edit Record' : 'New Animal'}
              </h2>
              {editingId && (
                <button onClick={cancelEdit} className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full font-bold hover:bg-stone-200 transition-colors">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 🔥 NUEVO: Input para la imagengrafía */}
              <div className="bg-stone-50 p-3 rounded-xl border border-dashed border-stone-300 flex flex-col items-center justify-center relative group">
                <ImageIcon size={24} className="text-stone-400 mb-1" />
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest cursor-pointer group-hover:text-green-700 transition-colors">
                  {formData.imagen ? formData.imagen.name : 'Upload Animal Photo (JPG/PNG)'}
                  <input type="file" accept="image/jpeg, image/png" className="hidden" 
                    onChange={e => setFormData({...formData, imagen: e.target.files[0]})} />
                </label>
              </div>

              <div>
                <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest ml-1">General Information</label>
                <input required placeholder="Animal Name or Nickname" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select required className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})}>
                  <option value="">-- Batch --</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select required className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  <option value="">-- Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.categoria}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Breed" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.raza} onChange={e => setFormData({...formData, raza: e.target.value})} />
                <input required type="number" step="0.01" placeholder="Weight (kg)" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
                <label className="text-[9px] text-amber-800 uppercase font-black flex items-center gap-1 mb-1.5 tracking-widest">
                  <DollarSign size={12}/> Custom Value (Optional)
                </label>
                <input type="number" placeholder="Fixed Price (C$)" className="w-full bg-white border border-stone-200 rounded-lg p-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 font-bold text-amber-900"
                  value={formData.valor_manual} onChange={e => setFormData({...formData, valor_manual: e.target.value})} />
                <p className="text-[9px] text-stone-500 mt-2 font-semibold">* If empty, value is calculated: Weight x Market Price.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input required type="number" placeholder="Age (Months)" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                  value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                  <option value="Hembra">Female</option>
                  <option value="Macho">Male</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest ml-1">Birth Date</label>
                  <input required type="date" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                    value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
                </div>
                
                {/* 🔥 NUEVO: Selector de Método de Obtención */}
                <div>
                  <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest ml-1">Obtained Via</label>
                  <select required className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 mt-1 text-sm outline-none focus:border-green-800 focus:bg-white transition-colors font-semibold text-stone-900"
                    value={formData.metodo_obtencion} onChange={e => setFormData({...formData, metodo_obtencion: e.target.value})}>
                    <option value="Nacido">Born on Farm</option>
                    <option value="Comprado">Purchased</option>
                    <option value="Regalado">Gifted / Donated</option>
                  </select>
                </div>
              </div>

              <button type="submit" className={`w-full font-black py-4 rounded-xl mt-6 shadow-lg transition-all flex justify-center items-center gap-2 ${
                editingId 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30' 
              }`}>
                {editingId ? <RefreshCw size={18} strokeWidth={2.5}/> : <Plus size={18} strokeWidth={2.5}/>}
                {editingId ? 'Update Record' : 'Save Animal'}
              </button>
            </form>
          </div>
        </div>

        {/* TABLA DE INVENTARIO VIVO */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-lg shadow-stone-500/5">
            <table className="w-full text-left">
              <thead className="bg-[#FAF8F5] border-b border-stone-200 text-amber-900 text-[10px] uppercase tracking-widest font-black">
                <tr>
                  <th className="p-4 pl-6">Identification</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Origin</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4">Est. Value</th>
                  <th className="p-4 text-center pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {animals.map((animal) => (
                  <tr key={animal.id} onClick={() => handleViewPreview(animal)} className="hover:bg-stone-50 cursor-pointer transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {/* 🔥 Miniatura de la imagen en la tabla */}
                        {animal.imagen ? (
                           <img src={animal.imagen} alt={animal.nombre} className="w-10 h-10 rounded-full object-cover border-2 border-stone-200" />
                        ) : (
                           <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center border-2 border-stone-200">
                             <span className="text-lg">🐄</span>
                           </div>
                        )}
                        <div>
                          <p className="font-black text-green-900 group-hover:text-green-700 text-sm">{animal.nombre}</p>
                          <p className="text-[10px] font-bold text-stone-500 mt-0.5">Tag: #{animal.id} • {animal.sexo === 'Hembra' ? 'Female' : 'Male'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-amber-900 uppercase">{getBatchName(animal.batch)}</p>
                      <span className="inline-block mt-1 text-[9px] bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded-full font-black tracking-wider">
                        {getCategoryName(animal.categoria)}
                      </span>
                    </td>
                    <td className="p-4">
                      {/* 🔥 Se muestra el método de obtención */}
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border ${
                        animal.metodo_obtencion === 'Comprado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        animal.metodo_obtencion === 'Regalado' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {animal.metodo_obtencion === 'Comprado' ? 'Purchased' : animal.metodo_obtencion === 'Regalado' ? 'Gifted' : 'Born'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-stone-800">{animal.peso} <span className="text-[10px] font-bold text-stone-500">KG</span></p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-black text-green-800 bg-[#FAF8F5] px-3 py-1 rounded-lg inline-block border border-stone-200">
                        C$ {animal.valor_estimado}
                      </p>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={(e) => handleEdit(e, animal)} className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 transition-all shadow-sm">
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => handleDelete(e, animal.id)} className="p-2.5 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-red-600 transition-all shadow-sm">
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {animals.length === 0 && !loading && (
              <div className="p-12 text-center">
                <span className="text-5xl mb-4 block">🌾</span>
                <h3 className="text-lg font-black text-green-900">The pasture is empty</h3>
                <p className="text-sm font-semibold text-stone-500 mt-1">No animals found with these filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ANIMAL CV MODAL - ESTILO FINCA */}
      {isModalOpen && selectedAnimal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            
            {/* PANEL IZQUIERDO - imagen Y NOMBRE */}
            <div className="w-full md:w-2/5 bg-[#FAF8F5] p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-200 relative text-center">
              <span className={`absolute top-5 left-5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedAnimal.sexo === 'Hembra' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                {selectedAnimal.sexo === 'Hembra' ? 'Female' : 'Male'}
              </span>
              
              {/* 🔥 imagen DEL ANIMAL */}
              <div className="w-40 h-40 rounded-full border-4 border-white flex items-center justify-center bg-stone-200 mb-5 shadow-xl shadow-stone-600/10 overflow-hidden">
                {selectedAnimal.imagen ? (
                  <img src={selectedAnimal.imagen} alt={selectedAnimal.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Camera size={40} className="text-stone-400" />
                )}
              </div>

              <h2 className="text-2xl font-black text-green-900 mb-1">{selectedAnimal.nombre}</h2>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-stone-200 mt-2 shadow-sm">
                Tag #{selectedAnimal.id} • {selectedAnimal.raza}
              </p>
            </div>

            {/* PANEL DERECHO - DATOS */}
            <div className="w-full md:w-3/5 p-8 relative bg-white">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-stone-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                <X size={20} strokeWidth={2.5}/>
              </button>
              
              <h3 className="text-sm font-black text-green-900 border-b-2 border-stone-100 pb-2 mb-6">Animal Data Sheet</h3>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[9px] text-amber-800 uppercase font-black tracking-widest flex items-center gap-1.5 mb-1"><Tag size={12}/> Category</p>
                  <p className="text-sm text-stone-800 font-black">{getCategoryName(selectedAnimal.categoria)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-amber-800 uppercase font-black tracking-widest flex items-center gap-1.5 mb-1"><DollarSign size={12}/> Est. Value</p>
                  <p className="text-lg text-green-800 font-black">C$ {selectedAnimal.valor_estimado}</p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-1">Current Weight</p>
                  <p className="text-sm text-stone-800 font-black">{selectedAnimal.peso} kg</p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-1">Batch / Group</p>
                  <p className="text-sm text-stone-800 font-black">{getBatchName(selectedAnimal.batch)}</p>
                </div>
                
                <div className="col-span-2 bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200 mt-2">
                  <p className="text-[10px] text-green-900 uppercase font-black mb-3 tracking-widest">Lineage & History</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-stone-200 text-center shadow-sm">
                      <p className="text-[9px] text-stone-400 font-black uppercase tracking-wider mb-1">Mother</p>
                      <p className="text-xs font-black text-green-900">#{selectedAnimal.id_madre || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 text-center shadow-sm">
                      <p className="text-[9px] text-stone-400 font-black uppercase tracking-wider mb-1">Father</p>
                      <p className="text-xs font-black text-green-900">#{selectedAnimal.id_padre || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 text-center shadow-sm">
                      <p className="text-[9px] text-stone-400 font-black uppercase tracking-wider mb-1">Origin</p>
                      <p className="text-[10px] font-black text-amber-700">
                        {selectedAnimal.metodo_obtencion === 'Comprado' ? 'Purchased' : selectedAnimal.metodo_obtencion === 'Regalado' ? 'Gifted' : 'Born'}
                      </p>
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