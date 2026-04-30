import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Search, Plus, Trash2, Edit2, X, Camera, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

export default function LivestockPage() {
  const [animals, setAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // States for Modal and Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '', fecha_nacimiento: '', edad: '', peso: '', raza: '', sexo: 'Hembra',
    id_madre: '', id_padre: '', metodo_obtencion: '' 
  });

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/livestock/?search=${searchTerm}`);
      const data = Array.isArray(res.data) ? res.data : res.data.results;
      setAnimals(data.slice(0, 10)); // Keeping a nice limit
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnimals(); }, [searchTerm]);

  // --- ACTIONS ---

  const handleViewPreview = (animal) => {
    setSelectedAnimal(animal);
    setIsModalOpen(true);
  };

  const handleEdit = (e, animal) => {
    e.stopPropagation(); // Prevents the row click from opening the modal
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
      metodo_obtencion: animal.metodo_obtencion || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', fecha_nacimiento: '', edad: '', peso: '', raza: '', sexo: 'Hembra', id_madre: '', id_padre: '', metodo_obtencion: '' });
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();

    // Initial confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You are about to remove this animal from BaltodanoFarm. This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/livestock/${id}/`);
        
        // Success feedback
        Swal.fire({
          title: 'Deleted!',
          text: 'The animal has been removed from the records.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        fetchAnimals();
        if (editingId === id) cancelEdit();

      } catch (err) {
        console.error("Delete error:", err);

        // Error feedback if there are database constraints
        Swal.fire({
          title: 'Action Denied',
          text: 'Cannot delete this animal. It might be linked to feeding records or offspring.',
          icon: 'error',
          confirmButtonText: 'I understand'
        });
      }
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const cleanData = {
      ...formData,
      id_madre: formData.id_madre || null,
      id_padre: formData.id_padre || null,
      metodo_obtencion: formData.metodo_obtencion || null,
    };

    if (editingId) {
      await apiClient.put(`/livestock/${editingId}/`, cleanData);
    } else {
      await apiClient.post('/livestock/', cleanData);
    }


    Swal.fire({
      title: 'Success!',
      text: `Animal record has been ${editingId ? 'updated' : 'created'} successfully.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });

    fetchAnimals();
    cancelEdit();
  } catch (err) {
    console.error("Save error:", err);
    

    Swal.fire({
      title: 'Submission Failed',
      text: 'Error saving record. Please check the data or connection.',
      icon: 'error',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Try Again'
    });
  }
};

  return (
    <div className="space-y-6 text-white p-4">
      
      {/* HEADER & SEARCH */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Livestock Control</h1>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" placeholder="Search by name or ID..." 
            className="w-full bg-[#1a1c26] border border-white/10 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-ganadero-active transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-4">
          <div className={`bg-[#1a1c26] border ${editingId ? 'border-ganadero-active shadow-lg shadow-ganadero-active/10' : 'border-white/10'} rounded-2xl p-6 transition-all duration-300`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold flex items-center gap-2">
                {editingId ? <RefreshCw size={20} className="text-ganadero-active" /> : <Plus size={20} className="text-ganadero-active" />}
                {editingId ? 'Edit Record' : 'New Record'}
              </h2>
              {editingId && (
                <button onClick={cancelEdit} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30 transition-colors">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-black">Name *</label>
                <input required className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-ganadero-active"
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black">Breed *</label>
                  <input required className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-ganadero-active"
                    value={formData.raza} onChange={e => setFormData({...formData, raza: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black">Weight (kg) *</label>
                  <input required type="number" step="0.01" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-ganadero-active"
                    value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black">Age *</label>
                  <input required type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-ganadero-active"
                    value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black">Gender</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-ganadero-active"
                    value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                    <option value="Hembra">Female</option>
                    <option value="Macho">Male</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-black">Birth Date *</label>
                <input required type="date" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-ganadero-active"
                  value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
              </div>

              {/* OPTIONAL FIELDS */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <p className="text-[9px] text-ganadero-active/50 font-bold tracking-widest uppercase">Parental Data (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Mother ID" type="number" className="w-full bg-black/10 border border-white/5 rounded-lg p-2 text-xs outline-none"
                    value={formData.id_madre} onChange={e => setFormData({...formData, id_madre: e.target.value})} />
                  <input placeholder="Father ID" type="number" className="w-full bg-black/10 border border-white/5 rounded-lg p-2 text-xs outline-none"
                    value={formData.id_padre} onChange={e => setFormData({...formData, id_padre: e.target.value})} />
                </div>
                <input placeholder="Acquisition Method (Purchase, Birth...)" className="w-full bg-black/10 border border-white/5 rounded-lg p-2 text-xs outline-none"
                  value={formData.metodo_obtencion} onChange={e => setFormData({...formData, metodo_obtencion: e.target.value})} />
              </div>

              <button type="submit" className={`w-full text-black font-bold py-3 rounded-xl mt-4 transition-all ${editingId ? 'bg-blue-400 hover:bg-blue-500' : 'bg-ganadero-active hover:bg-ganadero-active/90'}`}>
                {editingId ? 'Update Record' : 'Add Record'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: TABLE */}
        <div className="lg:col-span-8">
          <div className="bg-[#1a1c26] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 text-gray-500 text-[10px] uppercase tracking-tighter font-black">
                  <th className="p-4">ID</th>
                  <th className="p-4">Animal</th>
                  <th className="p-4">Breed</th>
                  <th className="p-4">Weight</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {animals.map((animal) => (
                  <tr key={animal.id} onClick={() => handleViewPreview(animal)} className="hover:bg-white/[0.03] cursor-pointer transition-colors group">
                    <td className="p-4 text-xs font-mono text-ganadero-active">#{animal.id}</td>
                    <td className="p-4 font-bold text-white">
                      {animal.nombre}
                      <span className="block text-[10px] text-gray-500 font-normal">{animal.sexo}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{animal.raza}</td>
                    <td className="p-4 text-sm font-black text-white">{animal.peso} <span className="text-[10px] text-ganadero-active font-normal">KG</span></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        {/* Notice the stopPropagation inside these functions */}
                        <button onClick={(e) => handleEdit(e, animal)} className="p-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-all"><Edit2 size={14}/></button>
                        <button onClick={(e) => handleDelete(e, animal.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ANIMAL CV MODAL (Preview) */}
      {isModalOpen && selectedAnimal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1c26] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-200">
            
            {/* LEFT SIDE: PHOTO PLACEHOLDER */}
            <div className="w-full md:w-2/5 bg-black/40 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative">
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedAnimal.sexo === 'Hembra' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {selectedAnimal.sexo}
                </span>
              </div>
              <div className="w-32 h-32 rounded-full border-4 border-ganadero-active flex items-center justify-center bg-[#1a1c26] mb-4 shadow-xl shadow-ganadero-active/20">
                <Camera size={40} className="text-gray-600" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Upload Photo</p>
              <p className="text-xs text-gray-600 mt-2 italic text-center">Image functionality coming soon</p>
            </div>

            {/* RIGHT SIDE: DATABASE INFO */}
            <div className="w-full md:w-3/5 p-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
              
              <div className="mb-6">
                <p className="text-sm font-mono text-ganadero-active mb-1">ID: #{selectedAnimal.id}</p>
                <h2 className="text-3xl font-black text-white">{selectedAnimal.nombre}</h2>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Breed</p>
                  <p className="text-sm text-white font-medium mt-1">{selectedAnimal.raza}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Weight</p>
                  <p className="text-sm text-white font-medium mt-1">{selectedAnimal.peso} kg</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Age</p>
                  <p className="text-sm text-white font-medium mt-1">{selectedAnimal.edad} years</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Birth Date</p>
                  <p className="text-sm text-white font-medium mt-1">{selectedAnimal.fecha_nacimiento}</p>
                </div>
                <div className="col-span-2 bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-ganadero-active uppercase font-black mb-2">Lineage & Acquisition</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Mother ID</p>
                      <p className="text-xs text-gray-300">{selectedAnimal.id_madre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Father ID</p>
                      <p className="text-xs text-gray-300">{selectedAnimal.id_padre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase">Method</p>
                      <p className="text-xs text-gray-300">{selectedAnimal.metodo_obtencion || 'N/A'}</p>
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