import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { 
  Beef, Scale, Activity, ShieldCheck, DollarSign, 
  Tag, Calendar, ArrowLeft, Printer, Clock,
  TrendingUp, TrendingDown, Syringe, Droplets
} from 'lucide-react';

export default function AnimalProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [animal, setAnimal] = useState(null);
  const [weights, setWeights] = useState([]);
  const [healthActions, setHealthActions] = useState([]);
  const [financialData, setFinancialData] = useState(null); // Nuevo estado para finanzas
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnimalCompleteProfile();
  }, [id]);

  const fetchAnimalCompleteProfile = async () => {
    setLoading(true);
    try {
      // Jalamos toda la info relacionada al animal en paralelo, incluyendo la trazabilidad
      const [animalRes, weightRes, healthRes, financeRes] = await Promise.all([
        apiClient.get(`/livestock/${id}/`),
        apiClient.get(`/weight-control/?animal_id=${id}&estado=1`), 
        apiClient.get(`/health-actions/?animal_id=${id}&estado=1`),
        apiClient.get(`/livestock/${id}/trazabilidad_financiera/`).catch(() => ({ data: null })) // Previene error fatal si falla el cálculo
      ]);

      setAnimal(animalRes.data);
      setWeights(Array.isArray(weightRes.data) ? weightRes.data : weightRes.data.results || []);
      setHealthActions(Array.isArray(healthRes.data) ? healthRes.data : healthRes.data.results || []);
      setFinancialData(financeRes.data);

    } catch (err) {
      console.error("Error fetching animal profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print(); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center font-black text-green-900">
        <Activity className="animate-spin mr-2 text-green-800" /> Loading Animal Sheet...
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h1 className="text-xl font-black text-stone-800">Animal Not Found</h1>
        <p className="text-sm text-stone-500 mt-1">The scanned QR code might be invalid or the record was removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-stone-800 p-4 md:p-8 print:bg-white print:p-0">
      
      {/* ACTION BAR */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button 
          onClick={handlePrint}
          className="bg-green-800 hover:bg-green-900 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-green-900/10 transition-all"
        >
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      {/* MAIN CARD PROFILE */}
      <div className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none">
        
        {/* TOP SECTION: FOTO & INFO GENERAL */}
        <div className="flex flex-col md:flex-row border-b border-stone-100 bg-white">
          
          <div className="w-full md:w-1/3 bg-[#FAF8F5] p-8 flex flex-col items-center justify-center relative text-center border-b md:border-b-0 md:border-r border-stone-200">
            <span className={`absolute top-5 left-5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${animal.sexo === 'Hembra' ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              {animal.sexo === 'Hembra' ? 'Female' : 'Male'}
            </span>
            
            <div className="w-44 h-44 rounded-full border-4 border-white flex items-center justify-center bg-stone-200 mb-4 shadow-xl overflow-hidden">
              {animal.imagen ? (
                <img src={animal.imagen} alt={animal.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🐄</span>
              )}
            </div>

            <h1 className="text-3xl font-black text-green-900 leading-tight">{animal.nombre}</h1>
            <p className="text-xs font-bold text-stone-500 mt-1">System ID: #{animal.id}</p>
            <span className="inline-block mt-3 text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              {animal.raza || 'Unknown Breed'}
            </span>
          </div>

          <div className="w-full md:w-2/3 p-8 flex flex-col justify-center">
            <h2 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-6 flex items-center gap-1.5 border-b border-stone-100 pb-2">
              <Beef size={14} className="text-green-800"/> General Specifications
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider flex items-center gap-1 mb-0.5"><Tag size={10}/> Classification</p>
                <p className="text-sm text-stone-800 font-black">{animal.categoria_nombre || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider flex items-center gap-1 mb-0.5"><Scale size={10}/> Last Weight</p>
                <p className="text-sm text-stone-800 font-black">{animal.peso} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider flex items-center gap-1 mb-0.5"><Clock size={10}/> Age</p>
                <p className="text-sm text-stone-800 font-black">{animal.edad} Months</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider flex items-center gap-1 mb-0.5"><Calendar size={10}/> Birth Date</p>
                <p className="text-sm text-stone-800 font-semibold">{animal.fecha_nacimiento || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider mb-0.5">Origin / Method</p>
                <p className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 w-fit uppercase">
                  {animal.metodo_obtencion || 'Born'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider flex items-center gap-1 mb-0.5"><DollarSign size={10}/> Current Value</p>
                <p className="text-base text-green-800 font-black bg-green-50/70 border border-green-100 px-2.5 py-0.5 rounded-lg w-fit">
                  C$ {animal.valor_estimado}
                </p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200 mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-stone-400 font-black uppercase tracking-wider mb-0.5">Dam (Mother ID)</p>
                <p className="text-xs font-black text-green-900">#{animal.id_madre || 'No Registry'}</p>
              </div>
              <div>
                <p className="text-[9px] text-stone-400 font-black uppercase tracking-wider mb-0.5">Sire (Father ID)</p>
                <p className="text-xs font-black text-green-900">#{animal.id_padre || 'No Registry'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: FINANCIAL TRACEABILITY & ROI */}
        {financialData && financialData.finanzas && (
          <div className="bg-stone-50 border-b border-stone-100 p-8">
            <h3 className="text-sm font-black text-green-900 flex items-center justify-between uppercase tracking-wider border-b border-stone-200 pb-2 mb-6">
              <span className="flex items-center gap-2"><DollarSign size={16} className="text-amber-600"/> Financial Traceability & Unit ROI</span>
              <span className="text-[10px] text-stone-500 bg-white px-3 py-1 rounded-full border border-stone-200">
                {financialData.finanzas.modelo}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Inversión Histórica */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">Investment Breakdown</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-bold text-stone-600">
                    <span>Initial Cost / Birth</span>
                    <span>C$ {financialData.inversion_desglose.inicial.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-stone-600">
                    <span className="flex items-center gap-1"><Syringe size={12} className="text-red-400"/> Health & Vax</span>
                    <span>C$ {financialData.inversion_desglose.salud.toLocaleString('en-US')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-end pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-black uppercase text-stone-400">Total Invested</span>
                  <span className="text-sm font-black text-red-600">- C$ {financialData.finanzas.inversion_total.toLocaleString('en-US')}</span>
                </div>
              </div>

              {/* 2. Rendimiento (Leche o Carne) */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">
                    Value {animal.sexo === 'Hembra' ? 'Generated' : 'Projected'}
                  </p>
                  <p className="text-2xl font-black text-stone-800">C$ {financialData.finanzas.ingreso_bruto.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 bg-[#FAF8F5] p-2 rounded-xl border border-stone-100">
                  {animal.sexo === 'Hembra' ? <Droplets size={16} className="text-blue-500"/> : <Activity size={16} className="text-amber-500"/>}
                  <p className="text-xs font-bold text-stone-700">{financialData.finanzas.metrica_clave}</p>
                </div>
              </div>

              {/* 3. Margen y ROI */}
              <div className={`p-5 rounded-2xl border-2 flex flex-col justify-center ${financialData.finanzas.margen_neto >= 0 ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${financialData.finanzas.margen_neto >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Net Profit
                </p>
                <p className={`text-2xl font-black flex items-center gap-1 mb-3 ${financialData.finanzas.margen_neto >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {financialData.finanzas.margen_neto >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                  C$ {financialData.finanzas.margen_neto.toLocaleString('en-US')}
                </p>
                <div className={`w-fit px-3 py-1 rounded-lg text-xs font-black ${financialData.finanzas.margen_neto >= 0 ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                  {financialData.finanzas.rentabilidad}% ROI
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: HISTORIAL DE PESOS & VACUNAS */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
          
          <div className="space-y-3">
            <h3 className="text-sm font-black text-green-900 flex items-center gap-2 uppercase tracking-wider border-b border-stone-200 pb-2">
              <Scale size={16} className="text-blue-600"/> Weight Control History
            </h3>
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF8F5] border-b border-stone-200 text-[9px] font-black uppercase text-stone-500 tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3 text-right pr-4">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {weights.map((w, index) => (
                    <tr key={w.id || index} className="hover:bg-stone-50">
                      <td className="p-3 pl-4 font-semibold text-stone-600">{w.fecha || w.date}</td>
                      <td className="p-3 text-right pr-4 font-black text-stone-900">{w.peso_registrado || w.weight || w.peso} kg</td>
                    </tr>
                  ))}
                  {weights.length === 0 && (
                    <tr>
                      <td colSpan="2" className="p-6 text-center font-bold text-stone-400">No weight entries recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-green-900 flex items-center gap-2 uppercase tracking-wider border-b border-stone-200 pb-2">
              <ShieldCheck size={16} className="text-green-700"/> Health & Veterinary Actions
            </h3>
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF8F5] border-b border-stone-200 text-[9px] font-black uppercase text-stone-500 tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Treatment / Vaccine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {healthActions.map((h, index) => (
                    <tr key={h.id || index} className="hover:bg-stone-50">
                      <td className="p-3 pl-4 font-semibold text-stone-600">{h.fecha || h.date}</td>
                      <td className="p-3 font-black text-stone-900">{h.accion || h.tratamiento || h.description || h.action}</td>
                    </tr>
                  ))}
                  {healthActions.length === 0 && (
                    <tr>
                      <td colSpan="2" className="p-6 text-center font-bold text-stone-400">No medical records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* PIE DE TARJETA EXCLUSIVO PARA IMPRESIÓN */}
        <div className="hidden print:block text-center text-[10px] text-stone-400 font-bold border-t border-stone-200 p-6 bg-white">
          Official Livestock Sheet • Finca Flor de María • System Generated Report
        </div>

      </div>
    </div>
  );
}