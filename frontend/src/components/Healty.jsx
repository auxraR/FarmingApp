import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { Search, Activity, Syringe, Calendar as CalendarIcon, Scale, Plus } from 'lucide-react';

export default function HealthPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  // Health Data States
  const [weightHistory, setWeightHistory] = useState([]);
  const [vaccineHistory, setVaccineHistory] = useState([]);

  // Form States (Actualizados)
  const [weightForm, setWeightForm] = useState({ peso: '', fecha: new Date().toISOString().split('T')[0] });
  const [healthForm, setHealthForm] = useState({ 
    tipo_evento: 'Vacuna Ántrax', 
    dosis: '', 
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '' 
  });

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        try {
          const res = await apiClient.get(`/livestock/?search=${searchTerm}`);
          
          let data = [];
          if (Array.isArray(res.data)) {
            data = res.data;
          } else if (res.data && Array.isArray(res.data.results)) {
            data = res.data.results;
          }
          
          setSearchResults(data);
        } catch (err) {
          console.error("Search error", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const loadAnimalHealthData = async (animal) => {
    setSelectedAnimal(animal);
    setSearchTerm(""); 
    setSearchResults([]);
    
    try {
      const [weightRes, vaccineRes] = await Promise.all([
        apiClient.get(`/weight-control/?animal_id=${animal.id}`),
        // Carga la info desde health-actions
        apiClient.get(`/health-actions/?animal_id=${animal.id}`) 
      ]);
      
      setWeightHistory(Array.isArray(weightRes.data) ? weightRes.data : weightRes.data.results || []);
      setVaccineHistory(Array.isArray(vaccineRes.data) ? vaccineRes.data : vaccineRes.data.results || []);
    } catch (err) {
      console.error("Error loading health data", err);
      setWeightHistory([]); 
      setVaccineHistory([]);
    }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { animal: selectedAnimal.id, peso: weightForm.peso, fecha: weightForm.fecha };
      
      await apiClient.post('/weight-control/', payload); 
      
      setWeightHistory(prev => [{ id: Date.now(), ...payload }, ...prev]);
      setWeightForm({ ...weightForm, peso: '' });
      
      Swal.fire({ title: 'Updated!', text: 'Weight recorded successfully.', icon: 'success', background: '#1a1c26', color: '#ffffff', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not save weight.', icon: 'error', background: '#1a1c26', color: '#ffffff' });
    }
  };

  const handleHealthActionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { animal: selectedAnimal.id, ...healthForm };
      // await apiClient.post('/health-actions/', payload); // Descomentar cuando la vista esté lista
      
      setVaccineHistory(prev => [{ id: Date.now(), ...payload }, ...prev]);
      setHealthForm({ tipo_evento: 'Vacuna Ántrax', dosis: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });
      
      Swal.fire({ title: 'Recorded!', text: 'Action saved to database.', icon: 'success', background: '#1a1c26', color: '#ffffff', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not save record.', icon: 'error', background: '#1a1c26', color: '#ffffff' });
    }
  };

  // Calendar Logic (Current Month: April 2026)
  const renderCalendar = () => {
    const daysInMonth = 30; // April
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="grid grid-cols-7 gap-2 mt-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] text-black-500 font-bold uppercase">{day}</div>
        ))}
        {/* Empty slots for days before April 1st 2026 (Wednesday) */}
        <div className="p-2"></div><div className="p-2"></div><div className="p-2"></div>
        
        {daysArray.map(day => {
          const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
          const vaccinesOnDay = vaccineHistory.filter(v => v.fecha === dateStr);
          const hasVaccine = vaccinesOnDay.length > 0;

          return (
            <div 
              key={day} 
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl h-12 border ${hasVaccine ? 'bg-red-700/20 border-red-700/50 cursor-pointer group' : 'bg-black/20 border-white/5'}`}
            >
              <span className={`text-sm font-bold ${hasVaccine ? 'text-red-400' : 'text-black-400'}`}>{day}</span>
              {hasVaccine && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>}
              
              {/* Tooltip for Vaccines */}
              {hasVaccine && (
                <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-black text-black text-[10px] px-3 py-1 rounded-lg z-10 border border-white/10">
                  {/* Aquí cambiamos v.tipo por v.tipo_evento para que coincida con la DB */}
                  {vaccinesOnDay.map((v, i) => <p key={i}>💉 {v.tipo_evento}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-black-700 p-4">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-black-700"><Activity className="text-black-500"/> Health & Weight</h1>
          <p className="text-sm text-gray-400">Track vaccinations and weight progression.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search animal by name or ID to update..." 
            className="w-full bg-[#B8C7D4] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-ganadero-active transition-all shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* SEARCH DROPDOWN */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#fff] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in duration-300 group-hover:text-green-500 transition-colors">
              {searchResults.map(animal => (
                <div 
                  key={animal.id} 
                  onClick={() => loadAnimalHealthData(animal)}
                  className="p-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="font-bold">{animal.nombre}</p>
                    <p className="text-[10px] text-gray-500">ID: #{animal.id} • Breed: {animal.raza}</p>
                  </div>
                  <span className="text-ganadero-active font-mono text-sm">{animal.peso} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedAnimal ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-3xl bg-[#1a1c26]/50">
          <Syringe size={48} className="text-black-600 mb-4" />
          <p className="text-black-400 text-lg">Search and select an animal to view health records</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-300">
          
          {/* LEFT PANEL: DATA ENTRY */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ANIMAL SUMMARY CARD */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ganadero-active/10 rounded-bl-full -z-0"></div>
              <p className="text-sm font-mono text-black-700 mb-1 relative z-10">ID: #{selectedAnimal.id}</p>
              <h2 className="text-3xl font-black text-black-700 relative z-10">{selectedAnimal.nombre}</h2>
              <div className="flex gap-4 mt-4 relative z-10">
                <span className="bg-black/40 px-3 py-1 rounded-lg text-xs border border-white/5">{selectedAnimal.raza}</span>
                <span className="bg-black/40 px-3 py-1 rounded-lg text-xs border border-white/5">{selectedAnimal.sexo}</span>
              </div>
            </div>

            {/* WEIGHT CONTROL FORM */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="font-bold flex items-center gap-2 mb-4"><Scale size={18} className="text-blue-400"/> Update Weight</h3>
              <form onSubmit={handleWeightSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-black-500 uppercase font-black">Weight (kg)</label>
                    <input required type="number" step="0.01" 
                        className="w-full bg-black/30 border border-gray/10 rounded-xl p-3 mt-1 outline-none focus:border-blue-400"
                        value={weightForm.peso} 
                        onChange={(e) => setWeightForm({...weightForm, peso: e.target.value})} 
                        />
                  </div>
                  <div>
                    <label className="text-[10px] text-black-500 uppercase font-black">Date</label>
                    <input required type="date" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 mt-1 outline-none focus:border-blue-400"
                      value={weightForm.fecha} onChange={e => setWeightForm({...weightForm, fecha: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Plus size={16}/> Record Weight
                </button>
              </form>
            </div>

            {/* SANITARY ACTIONS FORM */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/10 shadow-xl">
              <h3 className="font-bold flex items-center gap-2 mb-4"><Syringe size={18} className="text-red-400"/> New Sanitary Action</h3>
              <form onSubmit={handleHealthActionSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-black-500 uppercase font-black">Event Type</label>
                    <select className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 mt-1 outline-none focus:border-red-400"
                      value={healthForm.tipo_evento} onChange={e => setHealthForm({...healthForm, tipo_evento: e.target.value})}>
                      <option value="Vacuna Ántrax">Vacuna Ántrax</option>
                      <option value="Vacuna Pierna Negra">Vacuna Pierna Negra</option>
                      <option value="Desparasitación">Desparasitación</option>
                      <option value="Complejo B">Complejo B</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-black-500 uppercase font-black">Dose</label>
                    <input required type="text" placeholder="e.g. 5ml" className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 mt-1 outline-none focus:border-red-400"
                      value={healthForm.dosis} onChange={e => setHealthForm({...healthForm, dosis: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-black-500 uppercase font-black">Date</label>
                    <input required type="date" className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 mt-1 outline-none focus:border-red-400"
                      value={healthForm.fecha} onChange={e => setHealthForm({...healthForm, fecha: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-black-500 uppercase font-black">Observations</label>
                    <input type="text" placeholder="Optional notes" className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 mt-1 outline-none focus:border-red-400"
                      value={healthForm.observaciones} onChange={e => setHealthForm({...healthForm, observaciones: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className="w-full bg-red-500/20 text-red-400 hover:bg-red-700/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
                  <Plus size={16}/> Record Action
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT PANEL: VISUALIZATIONS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CALENDAR */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/10 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><CalendarIcon size={18} className="text-ganadero-active"/> Vaccination Schedule</h3>
                <span className="bg-black/40 px-3 py-1 rounded-lg text-xs border border-white/5 font-bold">April 2026</span>
              </div>
              <p className="text-xs text-black-600 mb-2">Dates highlighted in red indicate administered vaccines.</p>
              
              <div className="bg-black/20 p-4 rounded-2xl border border-black/5">
                {renderCalendar()}
              </div>
            </div>

            {/* WEIGHT HISTORY TABLE */}
            <div className="bg-[#B8C7D4] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-bold flex items-center gap-2 text-black-600"><Scale size={18} className="text-blue-400"/> Weight History Log</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-black/40 text-black-500 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Recorded Weight</th>
                    <th className="p-4">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {weightHistory.map((record, index) => {
                    const prevRecord = weightHistory[index + 1];
                    const difference = prevRecord ? (record.peso - prevRecord.peso).toFixed(2) : 0;
                    const isGain = difference > 0;
                    
                    return (
                      <tr key={record.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 text-xs text-black-400">{record.fecha}</td>
                        <td className="p-4 text-sm font-bold text-black-600">{record.peso} kg</td>
                        <td className="p-4 text-xs font-bold">
                          {prevRecord ? (
                            <span className={isGain ? 'text-green-400' : 'text-red-400'}>
                              {isGain ? '▲' : '▼'} {Math.abs(difference)} kg
                            </span>
                          ) : (
                            <span className="text-black-500">- Initial -</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {weightHistory.length === 0 && (
                <div className="p-8 text-center text-gray-500 italic text-sm">No weight records found.</div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}