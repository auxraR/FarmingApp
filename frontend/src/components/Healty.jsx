import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import Swal from 'sweetalert2';
import { Search, Activity, Syringe, Calendar as CalendarIcon, Scale, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HealthPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  // Health Data States
  const [weightHistory, setWeightHistory] = useState([]);
  const [vaccineHistory, setVaccineHistory] = useState([]);

  // Form States
  const [weightForm, setWeightForm] = useState({ peso: '', fecha: new Date().toISOString().split('T')[0] });
  const [healthForm, setHealthForm] = useState({ 
    tipo_evento: '', 
    dosis: '', 
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '' 
  });

  const [HealtProducts, setHealtProducts] = useState([]);

  // --- CALENDAR STATES ---
  const [currentDate, setCurrentDate] = useState(new Date()); 

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

  const fetchData = async () =>{
    try {
      const [MedicineRes] = await Promise.all([
        apiClient.get('/products/')
      ])
      const medicine = MedicineRes.data.filter(p => p.categoria === 'Salud');
      setHealtProducts(medicine);
    }
     catch (e) { 
      console.error(e); 
     }
    }
    useEffect(() => {
    fetchData();
  }, []);
  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    const pesoNum = Number(weightForm.peso);
    if (!Number.isFinite(pesoNum) || pesoNum < 0) {
      Swal.fire({
        title: 'Invalid Weight',
        text: 'Weight cannot be negative.',
        icon: 'error',
        background: '#ffffff',
        color: '#000000',
        confirmButtonText: 'OK',
      });
      return;
    }
    try {
      const payload = { animal: selectedAnimal.id, peso: pesoNum, fecha: weightForm.fecha };
      await apiClient.post('/weight-control/', payload); 
      
      setWeightHistory(prev => [{ id: Date.now(), ...payload }, ...prev]);
      setWeightForm({ ...weightForm, peso: '' });
      
      Swal.fire({ title: 'Updated!', text: 'Weight recorded successfully.', icon: 'success', background: '#ffffff', color: '#000000', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not save weight.', icon: 'error', background: '#ffffff', color: '#000000' });
    }
  };

  const handleHealthActionSubmit = async (e) => {
    e.preventDefault();
    const productoSeleccionado = HealtProducts.find(p => p.id === Number(healthForm.tipo_evento));
    const dosisLimpia = parseFloat(healthForm.dosis) || 0; 
    if (productoSeleccionado && dosisLimpia > productoSeleccionado.stock) {
      Swal.fire({
        title: 'Not enough stock!',
        text: `You only have ${productoSeleccionado.stock} ${productoSeleccionado.unidad_medida} of ${productoSeleccionado.nombre} available.`,
        icon: 'warning',
        background: '#ffffff', color: '#000000',
        confirmButtonColor: '#d33'
      });
      return;
      } 
    try {
      const payload = { animal: selectedAnimal.id, ...healthForm };
      await apiClient.post('/health-actions/', payload);
  
      setVaccineHistory(prev => [{ id: Date.now(), ...payload }, ...prev]);
      setHealthForm({ tipo_evento: '', dosis: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });
      
      Swal.fire({ title: 'Recorded!', text: 'Action saved to database.', icon: 'success', background: '#ffffff', color: '#000000', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not save record.', icon: 'error', background: '#ffffff', color: '#000000' });
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const setYear = (e) => {
    setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1));
  };

  const setMonth = (e) => {
    setCurrentDate(new Date(currentDate.getFullYear(), Number(e.target.value), 1));
  };

  const renderDynamicCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Obtener días del mes y el día de la semana en que empieza (0 = Domingo)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Espacios vacíos al principio del mes
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Generar los días reales
    for (let day = 1; day <= daysInMonth; day++) {
      // Formatear fecha a YYYY-MM-DD para comparar con DB
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const vaccinesOnDay = vaccineHistory.filter(v => v.fecha === dateStr);
      const hasVaccine = vaccinesOnDay.length > 0;

      // Saber si es el día de hoy
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div 
          key={day} 
          className={`relative flex flex-col items-center justify-center p-2 rounded-xl h-12 border transition-colors
            ${hasVaccine ? 'bg-red-700/20 border-red-700/50 cursor-pointer group hover:bg-red-700/30' : 'bg-black/5 border-black/10 hover:bg-black/10'}
            ${isToday && !hasVaccine ? 'border-blue-500/50 bg-blue-500/10' : ''}
          `}
        >
          <span className={`text-sm font-bold ${hasVaccine ? 'text-red-600' : isToday ? 'text-blue-600' : 'text-black'}`}>
            {day}
          </span>
          {hasVaccine && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>}
          
          {/* Tooltip for Vaccines */}
          {hasVaccine && (
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-[#11131F] text-white text-[10px] px-3 py-1 rounded-lg z-10 shadow-lg">
              {vaccinesOnDay.map((v, i) => <p key={i}>💉 {v.tipo_evento}</p>)}
            </div>
          )}
        </div>
      );
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 10}, (_, i) => currentYear - 5 + i); // 5 años atrás, 5 años adelante

    return (
      <div className="flex flex-col">
        {/* Controles del Calendario */}
        <div className="flex justify-between items-center mb-4 bg-black/5 p-2 rounded-xl">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-black/10 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-black" />
          </button>
          
          <div className="flex gap-2">
            <select value={month} onChange={setMonth} className="bg-transparent font-bold text-black outline-none cursor-pointer">
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={setYear} className="bg-transparent font-bold text-black outline-none cursor-pointer">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-black/10 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-black" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[10px] text-black/60 font-bold uppercase">{day}</div>
          ))}
          {/* Render del grid calculado */}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-black p-4">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-black"/> Health & Weight</h1>
          <p className="text-sm text-gray-500">Track vaccinations and weight progression.</p>
        </div>
        
        <div className="relative w-full md:w-96 z-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search animal by name or ID..." 
            className="w-full bg-[#B8C7D4] border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black transition-all shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              {searchResults.map(animal => (
                <div 
                  key={animal.id} 
                  onClick={() => loadAnimalHealthData(animal)}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-bold text-black">{animal.nombre}</p>
                    <p className="text-[10px] text-gray-500">ID: #{animal.id} • Breed: {animal.raza}</p>
                  </div>
                  <span className="font-mono text-sm font-bold">{animal.peso} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedAnimal ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-3xl bg-[#B8C7D4]/30">
          <Syringe size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">Search and select an animal to view health records</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-300">
          
          {/* LEFT PANEL: DATA ENTRY */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ANIMAL SUMMARY CARD */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/20 shadow-lg relative overflow-hidden">
              <p className="text-sm font-mono text-black/60 mb-1 relative z-10">ID: #{selectedAnimal.id}</p>
              <h2 className="text-3xl font-black text-black relative z-10">{selectedAnimal.nombre}</h2>
              <div className="flex gap-4 mt-4 relative z-10">
                <span className="bg-white/50 px-3 py-1 rounded-lg text-xs font-bold border border-white/50">{selectedAnimal.raza}</span>
                <span className="bg-white/50 px-3 py-1 rounded-lg text-xs font-bold border border-white/50">{selectedAnimal.sexo}</span>
              </div>
            </div>

            {/* WEIGHT CONTROL FORM */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/20 shadow-lg">
              <h3 className="font-bold flex items-center gap-2 mb-4"><Scale size={18} className="text-blue-600"/> Update Weight</h3>
              <form onSubmit={handleWeightSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-black/60 uppercase font-black">Weight (kg)</label>
                    <input required type="number" step="0.01" min="0"
                        className="w-full bg-white/50 border border-white/50 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-400"
                        value={weightForm.peso} 
                        onChange={(e) => setWeightForm({...weightForm, peso: e.target.value})} 
                        />
                  </div>
                  <div>
                    <label className="text-[10px] text-black/60 uppercase font-black">Date</label>
                    <input required type="date" className="w-full bg-white/50 border border-white/50 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-400"
                      value={weightForm.fecha} onChange={e => setWeightForm({...weightForm, fecha: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Plus size={16}/> Record Weight
                </button>
              </form>
            </div>

            {/* SANITARY ACTIONS FORM */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/20 shadow-lg">
              <h3 className="font-bold flex items-center gap-2 mb-4"><Syringe size={18} className="text-red-600"/> New Sanitary Action</h3>
              <form onSubmit={handleHealthActionSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-black/60 uppercase font-black">Event Type</label>
                    <select className="w-full bg-white/50 border border-white/50 rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-red-400"
                      value={healthForm.tipo_evento} onChange={e => setHealthForm({...healthForm, tipo_evento: e.target.value})}>
                     <option value="">-- Select vaccine --</option>
                        {HealtProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} (Stock: {p.stock} {p.unidad_medida})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-black/60 uppercase font-black">Dose</label>
                    <input required type="text" placeholder="e.g. 5ml" className="w-full bg-white/50 border border-white/50 rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-red-400"
                      value={healthForm.dosis} onChange={e => setHealthForm({...healthForm, dosis: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-black/60 uppercase font-black">Date</label>
                    <input required type="date" className="w-full bg-white/50 border border-white/50 rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-red-400"
                      value={healthForm.fecha} onChange={e => setHealthForm({...healthForm, fecha: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-black/60 uppercase font-black">Observations</label>
                    <input type="text" placeholder="Optional notes" className="w-full bg-white/50 border border-white/50 rounded-xl p-2.5 mt-1 outline-none focus:ring-2 focus:ring-red-400"
                      value={healthForm.observaciones} onChange={e => setHealthForm({...healthForm, observaciones: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className="w-full bg-red-600 text-white hover:bg-red-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-sm">
                  <Plus size={16}/> Record Action
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT PANEL: VISUALIZATIONS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CALENDAR */}
            <div className="bg-[#B8C7D4] p-6 rounded-3xl border border-white/20 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold flex items-center gap-2"><CalendarIcon size={18} className="text-black"/> Vaccination Schedule</h3>
              </div>
              <p className="text-xs text-black/60 mb-4 font-medium">Dates highlighted in red indicate administered vaccines. Today is outlined in blue.</p>
              
              <div className="bg-white/30 p-4 rounded-2xl border border-white/40">
                {renderDynamicCalendar()}
              </div>
            </div>

            {/* WEIGHT HISTORY TABLE */}
            <div className="bg-[#B8C7D4] rounded-3xl border border-white/20 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-white/40 bg-white/30">
                <h3 className="font-bold flex items-center gap-2 text-black"><Scale size={18} className="text-blue-600"/> Weight History Log</h3>
              </div>
              <table className="w-full text-left bg-white/10">
                <thead className="bg-black/5 text-black text-[10px] uppercase font-black tracking-widest border-b border-black/10">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Recorded Weight</th>
                    <th className="p-4">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {weightHistory.map((record, index) => {
                    const prevRecord = weightHistory[index + 1];
                    const difference = prevRecord ? (record.peso - prevRecord.peso).toFixed(2) : 0;
                    const isGain = difference > 0;
                    
                    return (
                      <tr key={record.id} className="hover:bg-white/30 transition-colors">
                        <td className="p-4 text-xs font-medium">{record.fecha}</td>
                        <td className="p-4 text-sm font-black text-black">{record.peso} kg</td>
                        <td className="p-4 text-xs font-bold">
                          {prevRecord ? (
                            <span className={isGain ? 'text-green-600' : 'text-red-600'}>
                              {isGain ? '▲' : '▼'} {Math.abs(difference)} kg
                            </span>
                          ) : (
                            <span className="text-black/50">- Initial -</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {weightHistory.length === 0 && (
                <div className="p-8 text-center text-black/50 font-medium italic text-sm bg-white/10">No weight records found.</div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}