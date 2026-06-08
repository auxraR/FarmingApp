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

  // 🔥 FIX DE ZONA HORARIA: Función para obtener la fecha local exacta (Nicaragua)
  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form States
  const [weightForm, setWeightForm] = useState({ 
    peso: '', 
    fecha: getLocalDate() 
  });
  
  const [healthForm, setHealthForm] = useState({ 
    tipo_evento: '', 
    dosis: '', 
    fecha: getLocalDate(),
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
        // Asegúrate de que el backend ya esté filtrando estado=1 si agregas soft-delete a estas tablas luego
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
        confirmButtonColor: '#2563EB',
      });
      return;
    }
    try {
      const payload = { animal: selectedAnimal.id, peso: pesoNum, fecha: weightForm.fecha };
      await apiClient.post('/weight-control/', payload); 
      
      setWeightHistory(prev => [{ id: Date.now(), ...payload }, ...prev]);
      setWeightForm({ peso: '', fecha: getLocalDate() });
      
      Swal.fire({ title: 'Updated!', text: 'Weight recorded successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire({ title: 'Error', text: 'Could not save weight.', icon: 'error', confirmButtonColor: '#2563EB' });
    }
  };

  const handleHealthActionSubmit = async (e) => {
    e.preventDefault();
    const productoSeleccionado = HealtProducts.find(p => p.id === Number(healthForm.tipo_evento));
    
    if (!productoSeleccionado) {
      Swal.fire({ title: 'Error', text: 'Please select a valid product.', icon: 'error', confirmButtonColor: '#2563EB' });
      return;
    }

    const dosisLimpia = parseFloat(healthForm.dosis) || 0; 
    
    // 1. Stock Validation
    if (dosisLimpia > productoSeleccionado.stock) {
      Swal.fire({
        title: 'Not enough stock!',
        text: `You only have ${productoSeleccionado.stock} ${productoSeleccionado.unidad_medida} of ${productoSeleccionado.nombre} available.`,
        icon: 'warning',
        confirmButtonColor: '#DC2626'
      });
      return;
    } 

    // 2. Nicaraguan Climatic Vaccination Logic (Strong Vaccines)
    const RESTRICTED_VACCINES = ['antrax', 'ántrax', 'pierna negra', 'dvb', 'ibr', 'brucelosis', 'tuberculosis'];
    const prodNameLower = productoSeleccionado.nombre.toLowerCase();
    const isRestricted = RESTRICTED_VACCINES.some(v => prodNameLower.includes(v));

    if (isRestricted) {
      // Buscar si el animal ya recibió esta vacuna antes
      const previousApps = vaccineHistory.filter(v => 
        String(v.tipo_evento) === String(productoSeleccionado.id) || 
        (v.tipo_evento && v.tipo_evento.toLowerCase() === prodNameLower)
      );

      if (previousApps.length > 0) {
        // Ordenar de más reciente a más antigua
        previousApps.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const lastApp = previousApps[0];
        
        const lastDate = new Date(lastApp.fecha);
        const newDate = new Date(healthForm.fecha);
        const diffTime = Math.abs(newDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Validación de ~6 meses (180 días)
        if (diffDays < 180) {
          Swal.fire({
            title: 'Too Soon for this Vaccine!',
            html: `In Nicaragua, strong vaccines like <b>${productoSeleccionado.nombre}</b> are given twice a year (start and end of the rainy season).<br><br>The last dose was given only <b>${diffDays} days ago</b>. You must wait at least 180 days.`,
            icon: 'warning',
            confirmButtonColor: '#DC2626'
          });
          return;
        }
      }
    }

    try {
      const payload = { animal: selectedAnimal.id, ...healthForm };
      await apiClient.post('/health-actions/', payload);
  
      // Guardamos en el historial con el nombre del producto para que se vea bien en la tabla y calendario
      setVaccineHistory(prev => [{ id: Date.now(), ...payload, tipo_evento: productoSeleccionado.nombre }, ...prev]);
      
      // Reset form usando la fecha local
      setHealthForm({ tipo_evento: '', dosis: '', fecha: getLocalDate(), observaciones: '' });
      
      Swal.fire({ title: 'Recorded!', text: 'Action saved to database.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not save record.', icon: 'error', confirmButtonColor: '#2563EB' });
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
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const vaccinesOnDay = vaccineHistory.filter(v => v.fecha === dateStr);
      const hasVaccine = vaccinesOnDay.length > 0;
      
      // Validamos contra la fecha local real
      const isToday = getLocalDate() === dateStr;

      days.push(
        <div 
          key={day} 
          className={`relative flex flex-col items-center justify-center p-2 rounded-xl h-12 border transition-colors
            ${hasVaccine ? 'bg-red-50 border-red-200 cursor-pointer group hover:bg-red-100' : 'bg-white border-stone-100 hover:bg-stone-50'}
            ${isToday && !hasVaccine ? 'border-blue-300 bg-blue-50' : ''}
          `}
        >
          <span className={`text-sm font-bold ${hasVaccine ? 'text-red-700' : isToday ? 'text-blue-700' : 'text-stone-700'}`}>
            {day}
          </span>
          {hasVaccine && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shadow-sm"></div>}
          
          {hasVaccine && (
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-stone-800 text-white text-[10px] px-3 py-1.5 rounded-lg z-10 shadow-lg">
              {vaccinesOnDay.map((v, i) => <p key={i}>💉 {v.tipo_evento} ({v.dosis})</p>)}
            </div>
          )}
        </div>
      );
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 10}, (_, i) => currentYear - 5 + i); 

    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4 bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-200">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-stone-700" />
          </button>
          
          <div className="flex gap-2">
            <select value={month} onChange={setMonth} className="bg-transparent font-black text-green-900 outline-none cursor-pointer">
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={setYear} className="bg-transparent font-black text-green-900 outline-none cursor-pointer">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-stone-700" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[10px] text-stone-400 font-black uppercase tracking-wider">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-stone-800 p-4 bg-[#F5F4F0] min-h-screen">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 text-green-900"><Activity className="text-green-700"/> Health & Weight</h1>
          <p className="text-sm text-amber-900 font-semibold mt-1">Track vaccinations and weight progression.</p>
        </div>
        
        <div className="relative w-full md:w-96 z-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Search animal by name or ID..." 
            className="w-full bg-white border border-stone-300 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all shadow-sm font-semibold text-stone-800 placeholder-stone-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              {searchResults.map(animal => (
                <div 
                  key={animal.id} 
                  onClick={() => loadAnimalHealthData(animal)}
                  className="p-4 hover:bg-stone-50 cursor-pointer flex justify-between items-center border-b border-stone-100 last:border-0"
                >
                  <div>
                    <p className="font-black text-green-900">{animal.nombre}</p>
                    <p className="text-[10px] text-stone-500 font-bold">Tag: #{animal.id} • Breed: {animal.raza}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-stone-700">{animal.peso} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedAnimal ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-300 rounded-3xl bg-white shadow-sm">
          <Syringe size={48} className="text-stone-300 mb-4" />
          <p className="text-stone-500 text-lg font-bold">Search and select an animal to view health records</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-300">
          
          {/* LEFT PANEL: DATA ENTRY */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ANIMAL SUMMARY CARD */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-lg shadow-stone-500/5 relative overflow-hidden">
              <p className="text-sm font-black text-amber-800 mb-1 relative z-10 uppercase tracking-widest">Tag: #{selectedAnimal.id}</p>
              <h2 className="text-3xl font-black text-green-900 relative z-10">{selectedAnimal.nombre}</h2>
              <div className="flex gap-3 mt-4 relative z-10">
                <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-lg text-xs font-black border border-stone-200">{selectedAnimal.raza}</span>
                <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-lg text-xs font-black border border-stone-200">{selectedAnimal.sexo === 'Hembra' ? 'Female' : 'Male'}</span>
              </div>
            </div>

            {/* WEIGHT CONTROL FORM */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-lg shadow-stone-500/5">
              <h3 className="font-black flex items-center gap-2 mb-4 text-green-900"><Scale size={18} className="text-blue-600"/> Update Weight</h3>
              <form onSubmit={handleWeightSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Weight (kg)</label>
                    <input required type="number" step="0.01" min="0"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 mt-1 outline-none focus:border-green-800 text-sm font-bold text-stone-800"
                        value={weightForm.peso} 
                        onChange={(e) => setWeightForm({...weightForm, peso: e.target.value})} 
                        />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Date</label>
                    <input required type="date" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 mt-1 outline-none focus:border-green-800 text-sm font-bold text-stone-800"
                      value={weightForm.fecha} onChange={e => setWeightForm({...weightForm, fecha: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Plus size={18}/> Record Weight
                </button>
              </form>
            </div>

            {/* SANITARY ACTIONS FORM */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-lg shadow-stone-500/5">
              <h3 className="font-black flex items-center gap-2 mb-4 text-green-900"><Syringe size={18} className="text-red-500"/> New Sanitary Action</h3>
              <form onSubmit={handleHealthActionSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Event Type</label>
                    <select className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 mt-1 outline-none focus:border-green-800 text-sm font-bold text-stone-800"
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
                    <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Dose</label>
                    <input required type="text" placeholder="e.g. 5ml" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 mt-1 outline-none focus:border-green-800 text-sm font-bold text-stone-800"
                      value={healthForm.dosis} onChange={e => setHealthForm({...healthForm, dosis: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Date</label>
                    <input required type="date" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 mt-1 outline-none focus:border-green-800 text-sm font-bold text-stone-800"
                      value={healthForm.fecha} onChange={e => setHealthForm({...healthForm, fecha: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-900 uppercase font-black tracking-widest">Observations</label>
                    <input type="text" placeholder="Optional notes" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 mt-1 outline-none focus:border-green-800 text-sm font-bold text-stone-800"
                      value={healthForm.observaciones} onChange={e => setHealthForm({...healthForm, observaciones: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
                  <Plus size={18}/> Record Action
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT PANEL: VISUALIZATIONS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CALENDAR */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-lg shadow-stone-500/5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black flex items-center gap-2 text-green-900"><CalendarIcon size={18} className="text-amber-800"/> Vaccination Schedule</h3>
              </div>
              <p className="text-xs text-stone-500 mb-5 font-semibold">Dates highlighted in red indicate administered vaccines. Today is outlined in blue. Hover over red dates to see details.</p>
              
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200">
                {renderDynamicCalendar()}
              </div>
            </div>

            {/* WEIGHT HISTORY TABLE */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-lg shadow-stone-500/5 overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-[#FAF8F5]">
                <h3 className="font-black flex items-center gap-2 text-green-900"><Scale size={18} className="text-amber-800"/> Weight History Log</h3>
              </div>
              <table className="w-full text-left bg-white">
                <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
                  <tr>
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Recorded Weight</th>
                    <th className="p-4 pr-6">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {weightHistory.map((record, index) => {
                    const prevRecord = weightHistory[index + 1];
                    const difference = prevRecord ? (record.peso - prevRecord.peso).toFixed(2) : 0;
                    const isGain = difference > 0;
                    
                    return (
                      <tr key={record.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4 pl-6 text-xs font-bold text-stone-500">{record.fecha}</td>
                        <td className="p-4 text-sm font-black text-stone-800">{record.peso} <span className="text-[10px] text-stone-400">KG</span></td>
                        <td className="p-4 pr-6 text-xs font-black">
                          {prevRecord ? (
                            <span className={isGain ? 'text-green-600 bg-green-50 px-2 py-1 rounded-md' : 'text-red-600 bg-red-50 px-2 py-1 rounded-md'}>
                              {isGain ? '▲' : '▼'} {Math.abs(difference)} kg
                            </span>
                          ) : (
                            <span className="text-stone-400 bg-stone-100 px-2 py-1 rounded-md">- Initial -</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {weightHistory.length === 0 && (
                <div className="p-8 text-center text-stone-400 font-bold text-sm bg-white">No weight records found.</div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}