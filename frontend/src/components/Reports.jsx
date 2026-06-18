import React, { useState, useRef } from 'react';
import apiClient from '../api/client';
import { 
  FileText, DollarSign, Activity, Package, CheckSquare, 
  Layout, Download, Printer, FileSpreadsheet, Calendar, MapPin, User, Hash, AlertTriangle, CheckCircle2, XCircle, Sliders
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import Swal from 'sweetalert2';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const REPORT_PRESETS = {
  'General Executive': {
    inventory: true, health: true, executiveSummary: true,
    production: true, reproduction: true, charts: true,
    financialStatus: true, importantAlerts: true, responsibleSignature: true
  },
  'Financial': {
    inventory: false, health: false, executiveSummary: false,
    production: false, reproduction: false, charts: true,
    financialStatus: true, importantAlerts: false, responsibleSignature: true
  },
  'Milk Production': {
    inventory: false, health: false, executiveSummary: false,
    production: true, reproduction: false, charts: true,
    financialStatus: false, importantAlerts: true, responsibleSignature: true
  },
  'Animal Health': {
    inventory: false, health: true, executiveSummary: false,
    production: false, reproduction: true, charts: false,
    financialStatus: false, importantAlerts: true, responsibleSignature: true
  },
  'Inventory': {
    inventory: true, health: false, executiveSummary: false,
    production: false, reproduction: false, charts: true,
    financialStatus: false, importantAlerts: true, responsibleSignature: true
  },
  'Custom': {
    inventory: false, health: false, executiveSummary: false,
    production: false, reproduction: false, charts: false,
    financialStatus: false, importantAlerts: false, responsibleSignature: true
  }
};

const ReportsPage = () => {
  const [period, setPeriod] = useState('Month');
  const [dates, setDates] = useState({ from: '2026-05-01', to: '2026-06-02' });
  const [reportType, setReportType] = useState('General Executive');
  const [sections, setSections] = useState(REPORT_PRESETS['General Executive']);
  const [design, setDesign] = useState('Standard');
  const [extraOptions, setExtraOptions] = useState({ cover: false, signatureSeal: true });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const reportRef = useRef(null);

  const handleReportTypeChange = (typeId) => {
    setReportType(typeId);
    setSections(REPORT_PRESETS[typeId]); 
  };

  const toggleSection = (sec) => {
    if (reportType !== 'Custom') return;
    setSections({ ...sections, [sec]: !sections[sec] });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.get('/reports/generate/', {
        params: { desde: dates.from, hasta: dates.to }
      });
      
      setReportData(response.data);

      setTimeout(async () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pages = document.querySelectorAll('.pdf-page-container');

        if (pages.length === 0) {
          throw new Error("No active pages to render.");
        }

        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          if (i > 0) doc.addPage();
          doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        
        doc.save(`Report_${reportType.replace(/ /g, '_')}_${dates.from}.pdf`);
        setIsGenerating(false);
      }, 600);

    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGenerating(false);
      Swal.fire({
        title: 'Generation Error',
        text: 'Could not retrieve records from the server for this date range.',
        icon: 'error',
        confirmButtonColor: '#2563EB'
      });
    }
  };

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-8 text-stone-800 relative overflow-hidden">
      
      {/* HEADER CONTROLS */}
      <div className="mb-8 pb-4 border-b border-stone-200">
        <h1 className="text-3xl font-black text-green-900">Reports Studio</h1>
        <p className="text-sm text-amber-900 font-semibold mt-1"> </p>
      </div>

      <div className="max-w-5xl space-y-6">
        
        {/* 1. SELECT PERIOD */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200">
          <h2 className="text-sm font-black text-green-900 mb-4 uppercase tracking-widest">1. Select Period</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {['Today', 'Week', 'Month', 'Year', 'Custom'].map(opt => (
              <button 
                key={opt} onClick={() => setPeriod(opt)}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  period === opt ? 'bg-green-800 text-white shadow-md' : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200 w-fit">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest">From:</label>
              <input type="date" value={dates.from} onChange={e => setDates({...dates, from: e.target.value})} className="bg-white border border-stone-200 p-2.5 rounded-xl text-sm font-bold text-stone-800 outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all" />
            </div>
            <Calendar size={18} className="text-stone-400 hidden md:block" />
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest">To:</label>
              <input type="date" value={dates.to} onChange={e => setDates({...dates, to: e.target.value})} className="bg-white border border-stone-200 p-2.5 rounded-xl text-sm font-bold text-stone-800 outline-none focus:border-green-800 focus:ring-4 focus:ring-green-800/10 transition-all" />
            </div>
          </div>
        </div>

        {/* 2. REPORT TYPE */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200">
          <h2 className="text-sm font-black text-green-900 mb-4 uppercase tracking-widest">2. Report Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { id: 'General Executive', icon: FileText },
              { id: 'Financial', icon: DollarSign },
              { id: 'Milk Production', icon: CheckSquare }, 
              { id: 'Animal Health', icon: Activity },
              { id: 'Inventory', icon: Package },
              { id: 'Custom', icon: Sliders }
            ].map(type => (
              <button 
                key={type.id} 
                onClick={() => handleReportTypeChange(type.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all h-28 ${
                  reportType === type.id ? 'border-green-800 bg-green-50 text-green-900 shadow-sm' : 'border-stone-100 bg-stone-50 text-stone-500 hover:border-green-800/40'
                }`}
              >
                <type.icon size={28} className={`mb-3 ${reportType === type.id ? 'text-green-700' : 'text-stone-400'}`} />
                <span className="text-[11px] font-black text-center leading-tight tracking-wide">{type.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. CUSTOM REPORT */}
        <div className={`bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border-2 transition-all duration-300 ${
          reportType === 'Custom' ? 'border-green-600 shadow-green-600/10' : 'border-stone-100 opacity-80'
        }`}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-sm font-black text-green-900 uppercase tracking-widest">3. Module Configuration</h2>
            </div>
            <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg text-white tracking-widest ${reportType === 'Custom' ? 'bg-green-700 animate-pulse' : 'bg-stone-400'}`}>
              {reportType === 'Custom' ? 'Editable Mode' : 'Locked Preset'}
            </span>
          </div>
          
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-8 mt-6 pl-2 ${reportType !== 'Custom' ? 'pointer-events-none select-none' : ''}`}>
            {Object.keys(sections).map((sec) => (
              <div 
                key={sec} 
                onClick={() => toggleSection(sec)} 
                className={`flex items-center gap-3 select-none ${reportType === 'Custom' ? 'cursor-pointer group' : 'cursor-not-allowed'}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  sections[sec] ? 'bg-green-700 border-green-700 text-white' : 'border-stone-300 bg-white group-hover:border-green-500'
                } ${reportType !== 'Custom' && sections[sec] ? 'bg-stone-500 border-stone-500' : ''}`}>
                  {sections[sec] && <CheckSquare size={14} strokeWidth={3} />}
                </div>
                <span className={`text-sm font-bold capitalize ${reportType === 'Custom' ? 'text-stone-800' : 'text-stone-400'}`}>
                  {sec.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. EXTRA DESIGN CONFIGURATION */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-sm font-black text-green-900 mb-4 uppercase tracking-widest">4. Selected Sections Summary</h2>
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200 h-full">
              <ul className="text-xs font-bold text-stone-600 space-y-2 list-disc pl-5">
                {Object.keys(sections).filter(k => sections[k]).map(k => (
                  <li key={k} className="capitalize tracking-wide">{k.replace(/([A-Z])/g, ' $1').trim()}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex-1 md:border-l border-stone-200 md:pl-8">
            <h2 className="text-sm font-black text-green-900 mb-4 uppercase tracking-widest">Design Options</h2>
            <div className="flex gap-4 mb-5">
               {['Standard', 'Compact'].map(d => (
                 <button key={d} onClick={() => setDesign(d)} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${design === d ? 'border-green-800 bg-green-50 text-green-900' : 'border-stone-200 text-stone-500 bg-stone-50 hover:bg-stone-100'}`}>
                   <Layout size={22} className="mb-1" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{d}</span>
                 </button>
               ))}
            </div>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-black text-stone-700 uppercase tracking-widest">Include signature & seal</span>
                <input type="checkbox" className="w-5 h-5 accent-green-800" checked={extraOptions.signatureSeal} onChange={() => setExtraOptions({...extraOptions, signatureSeal: !extraOptions.signatureSeal})} />
              </label>
            </div>
          </div>
        </div>

        {/* EXECUTE BUTTONS */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 pb-12 gap-4">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className={`w-full md:w-auto flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg ${
              isGenerating ? 'bg-stone-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02]'
            }`}
          >
            <Download size={20} strokeWidth={2.5} /> {isGenerating ? 'Querying Database & Generating...' : 'Generate Official PDF'}
          </button>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none items-center justify-center gap-2 flex bg-white border border-stone-200 text-stone-700 px-6 py-4 rounded-xl font-black text-sm hover:bg-stone-50 transition-colors shadow-sm">
              <Printer size={18} strokeWidth={2.5} /> Print
            </button>
            <button className="flex-1 md:flex-none items-center justify-center gap-2 flex bg-white border border-stone-200 text-stone-700 px-6 py-4 rounded-xl font-black text-sm hover:bg-stone-50 transition-colors shadow-sm">
              <FileSpreadsheet size={18} strokeWidth={2.5} /> Export Excel
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* THE DYNAMIC GHOST REPORT (HIDDEN IN NEGATIVE COORDINATES) */}
      {/* ========================================================= */}
      <div style={{ position: 'absolute', top: '-20000px', left: '-20000px' }}>
        <div ref={reportRef} className="bg-stone-200 p-4 flex flex-col gap-6">

          {/* ---- SPECIFIC PAGE: EXECUTIVE SUMMARY ---- */}
          {sections.executiveSummary && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Report Header */}
              <div className="flex justify-between items-center border-b-2 border-green-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🐄</span>
                  <h1 className="text-3xl font-black text-green-900 tracking-tight">Finca Baltodano's</h1>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black text-stone-800 uppercase">General Report</h2>
                  <p className="text-sm font-bold text-amber-900 uppercase tracking-widest">Finca Baltodano</p>
                </div>
              </div>

              {/* Technical Sheet */}
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4 flex flex-wrap gap-x-12 gap-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-stone-200"><User size={18} className="text-stone-500"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Owner</p>
                    <p className="text-sm font-black text-stone-800">Marvin Baltodano</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-stone-200"><MapPin size={18} className="text-stone-500"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-black text-stone-800">Diriamba, Carazo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-stone-200"><Calendar size={18} className="text-stone-500"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Period</p>
                    <p className="text-sm font-black text-stone-800">{reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-stone-200"><Hash size={18} className="text-stone-500"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Code</p>
                    <p className="text-sm font-black text-stone-800">REP-0110D</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-black text-green-900 mb-6">1. Executive Summary</h3>

              {/* DYNAMIC KPIS */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border border-stone-200 rounded-xl p-4 text-center bg-white shadow-sm">
                  <DollarSign size={24} className="mx-auto text-green-700 mb-2" />
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Net Profit</p>
                  <p className="text-xl font-black text-green-700 my-1">
                    C$ {reportData.kpis.ganancia_neta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] text-green-700 font-bold bg-green-50 rounded-full py-0.5 border border-green-100">↑ Dynamic</p>
                </div>
                <div className="border border-stone-200 rounded-xl p-4 text-center bg-white shadow-sm">
                  <Package size={24} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Milk Prod.</p>
                  <p className="text-xl font-black text-stone-800 my-1">{reportData.kpis.produccion_leche} L</p>
                  <p className="text-[9px] text-stone-400 font-bold">Total in range</p>
                </div>
                <div className="border border-stone-200 rounded-xl p-4 text-center bg-white shadow-sm">
                  <Activity size={24} className="mx-auto text-amber-600 mb-2" />
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Active Herd</p>
                  <p className="text-xl font-black text-stone-800 my-1">{reportData.kpis.total_animales}</p>
                  <p className="text-[9px] text-stone-400 font-bold">Heads of cattle</p>
                </div>
                <div className="border border-stone-200 rounded-xl p-4 text-center bg-white shadow-sm">
                  <Activity size={24} className="mx-auto text-purple-600 mb-2" />
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Profitability</p>
                  <p className="text-xl font-black text-stone-800 my-1">{reportData.kpis.rentabilidad} %</p>
                  <p className="text-[9px] text-stone-400 font-bold">On sales</p>
                </div>
              </div>

              {/* FINANCIAL RESULT TABLE */}
              <h3 className="text-lg font-black text-green-900 mb-4">Operating Financial Summary</h3>
              <table className="w-full text-left border-collapse border border-stone-200">
                <thead className="bg-[#FAF8F5] text-[10px] uppercase text-amber-900 font-black tracking-widest border-b border-stone-200">
                  <tr>
                    <th className="border-x border-stone-200 p-3">Concept</th>
                    <th className="border-x border-stone-200 p-3 text-right">Income (Sales)</th>
                    <th className="border-x border-stone-200 p-3 text-right">Expenses (Purchases)</th>
                    <th className="border-x border-stone-200 p-3 text-right">Operating Balance</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-stone-800 divide-y divide-stone-200">
                  <tr>
                    <td className="p-3 bg-[#FAF8F5] border-x border-stone-200 font-semibold text-stone-600">Consolidated flow for the period</td>
                    <td className="p-3 text-right text-green-700 border-x border-stone-200">C$ {reportData.kpis.ingresos_brutos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-red-600 border-x border-stone-200">C$ {reportData.kpis.gastos_operativos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-right font-black border-x border-stone-200 ${reportData.kpis.ganancia_neta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      C$ {reportData.kpis.ganancia_neta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* IMPORTANT ALERTS SECTION */}
              {sections.importantAlerts && (
                <div className="mt-8">
                  <h3 className="text-lg font-black text-green-900 mb-4">Alerts and Key Indicators</h3>
                  <div className="space-y-3">
                    {reportData.alertas.map((alerta, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-[#FAF8F5] border border-stone-200 rounded-xl">
                        {alerta.tipo === 'peligro' && <XCircle className="text-red-600" size={20}/>}
                        {alerta.tipo === 'precaucion' && <AlertTriangle className="text-amber-600" size={20}/>}
                        {alerta.tipo === 'exito' && <CheckCircle2 className="text-green-600" size={20}/>}
                        <p className="text-xs font-bold text-stone-700">{alerta.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Page Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-stone-200 pt-4 flex justify-between items-center text-[10px] text-stone-400 font-black uppercase tracking-widest">
                <span>Finca Baltodano's Management System</span>
                <span>Summary Page</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: FINANCIAL STATUS ---- */}
          {sections.financialStatus && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Financial Header */}
              <div className="flex justify-between items-end border-b-2 border-green-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-green-900 tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-green-800 uppercase tracking-widest">Financial Report</h2>
                  <p className="text-xs font-bold text-amber-900 uppercase mt-1">Cost-Benefit & Losses Analysis</p>
                </div>
              </div>

              {/* Financial KPIs */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="border border-green-200 bg-green-50 rounded-xl p-3">
                  <p className="text-[9px] font-black text-green-800 uppercase tracking-widest mb-1">Gross Income</p>
                  <p className="text-lg font-black text-green-700">C$ {reportData.kpis.ingresos_brutos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border border-red-200 bg-red-50 rounded-xl p-3">
                  <p className="text-[9px] font-black text-red-800 uppercase tracking-widest mb-1">Expenses</p>
                  <p className="text-lg font-black text-red-600">C$ {reportData.kpis.gastos_operativos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
                  <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">Lost Assets</p>
                  <p className="text-lg font-black text-amber-700">C$ {reportData.kpis.perdidas_animales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className={`border rounded-xl p-3 ${reportData.kpis.ganancia_neta >= 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${reportData.kpis.ganancia_neta >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Net Profit</p>
                  <p className={`text-lg font-black ${reportData.kpis.ganancia_neta >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    C$ {reportData.kpis.ganancia_neta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* CUADRO A: BAJAS Y PÉRDIDAS DE ANIMALES */}
              <div className="mb-6">
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} /> Registry of Losses and Outflows
                </h3>
                <table className="w-full text-left border-collapse border border-stone-200">
                  <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black">
                    <tr>
                      <th className="border border-stone-200 p-2">Identification</th>
                      <th className="border border-stone-200 p-2">Reason</th>
                      <th className="border border-stone-200 p-2">Date</th>
                      <th className="border border-stone-200 p-2 text-right">Financial Loss</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] font-bold text-stone-800">
                    {reportData.tablas.bajas_detalle && reportData.tablas.bajas_detalle.length > 0 ? (
                      reportData.tablas.bajas_detalle.map((item, idx) => (
                        <tr key={idx} className="bg-red-50/30">
                          <td className="border border-stone-200 p-2">{item.chapa_nombre}</td>
                          <td className="border border-stone-200 p-2 text-red-700 uppercase">{item.motivo}</td>
                          <td className="border border-stone-200 p-2 text-stone-500">{item.fecha}</td>
                          <td className="border border-stone-200 p-2 text-right text-red-600 font-black">- C$ {item.perdida.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="border border-stone-200 p-3 text-center text-stone-400">No animal losses registered in period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* CUADRO B Y C: COSTO BENEFICIO (Dos Columnas) */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                
                {/* Costo Beneficio: Queso/Derivados */}
                <div>
                  <h3 className="text-[11px] font-black text-blue-800 uppercase tracking-widest mb-2">ROI: Dairy Products</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black">
                      <tr>
                        <th className="border border-stone-200 p-2">Product</th>
                        <th className="border border-stone-200 p-2 text-center">Qty</th>
                        <th className="border border-stone-200 p-2 text-right">Cost</th>
                        <th className="border border-stone-200 p-2 text-right">Revenue</th>
                        <th className="border border-stone-200 p-2 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.roi_productos && reportData.tablas.roi_productos.length > 0 ? (
                        reportData.tablas.roi_productos.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td className="border border-stone-200 p-2 text-blue-900 font-black">{item.producto}</td>
                            <td className="border border-stone-200 p-2 text-center text-stone-500">{item.cantidad_vendida} <span className="text-[8px]">{item.unidad}</span></td>
                            <td className="border border-stone-200 p-2 text-right text-red-600">- C$ {item.costos.toLocaleString('en-US')}</td>
                            <td className="border border-stone-200 p-2 text-right text-green-700">C$ {item.ingresos.toLocaleString('en-US')}</td>
                            <td className="border border-stone-200 p-2 text-right">
                              <span className={`block font-black ${item.margen >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                C$ {item.margen.toLocaleString('en-US')}
                              </span>
                              <span className="text-[8px] uppercase text-stone-500">{item.rentabilidad}% ROI</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="border border-stone-200 p-3 text-center text-stone-400">No product sales recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Costo Beneficio: Ganado General */}
                <div>
                  <h3 className="text-[11px] font-black text-green-800 uppercase tracking-widest mb-2">ROI: Livestock Operations</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black">
                      <tr>
                        <th className="border border-stone-200 p-2">Concept</th>
                        <th className="border border-stone-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.roi_ganado && reportData.tablas.roi_ganado.length > 0 ? (
                        <>
                          <tr>
                            <td className="border border-stone-200 p-2">Livestock Sales</td>
                            <td className="border border-stone-200 p-2 text-right text-green-700">C$ {reportData.tablas.roi_ganado[0].ingresos.toLocaleString('en-US')}</td>
                          </tr>
                          <tr>
                            <td className="border border-stone-200 p-2">Operating Expenses (Feed/Health)</td>
                            <td className="border border-stone-200 p-2 text-right text-red-600">- C$ {reportData.tablas.roi_ganado[0].gastos.toLocaleString('en-US')}</td>
                          </tr>
                          <tr className={reportData.tablas.roi_ganado[0].margen >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                            <td className="border border-stone-200 p-2 font-black uppercase text-stone-800">Operating Balance</td>
                            <td className={`border border-stone-200 p-2 text-right font-black ${reportData.tablas.roi_ganado[0].margen >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              C$ {reportData.tablas.roi_ganado[0].margen.toLocaleString('en-US')}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="2" className="border border-stone-200 p-2 text-center text-stone-500 text-[9px] uppercase tracking-widest">
                              Status: <span className="font-black text-stone-800">{reportData.tablas.roi_ganado[0].estado}</span>
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr><td colSpan="2" className="border border-stone-200 p-3 text-center text-stone-400">No livestock operations recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* DESGLOSE DE INGRESOS Y EGRESOS */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                
                {/* Ingresos (Ventas + Leche) */}
                <div>
                  <h3 className="text-[11px] font-black text-green-800 uppercase tracking-widest mb-2">Income & Asset Detail</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black">
                      <tr>
                        <th className="border border-stone-200 p-2">Concept</th>
                        <th className="border border-stone-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.ingresos && reportData.tablas.ingresos.length > 0 ? (
                        reportData.tablas.ingresos.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border border-stone-200 p-2">
                                {item.concepto}
                                {item.concepto.includes('Leche') && <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">{reportData.kpis.produccion_leche} L</span>}
                            </td>
                            <td className="border border-stone-200 p-2 text-right text-green-700">C$ {item.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="border border-stone-200 p-2 text-center text-stone-400">No records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Egresos (Compras) */}
                <div>
                  <h3 className="text-[11px] font-black text-red-800 uppercase tracking-widest mb-2">Operating Expenses Detail</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black">
                      <tr>
                        <th className="border border-stone-200 p-2">Concept</th>
                        <th className="border border-stone-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.egresos && reportData.tablas.egresos.length > 0 ? (
                        reportData.tablas.egresos.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border border-stone-200 p-2">{item.concepto}</td>
                            <td className="border border-stone-200 p-2 text-right text-red-600">- C$ {item.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="border border-stone-200 p-2 text-center text-stone-400">No records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
              
              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-stone-200 pt-4 flex justify-between items-center text-[10px] text-stone-400 font-black uppercase tracking-widest">
                <span>Finca Baltodano's Management System</span>
                <span>Financial & Cost-Benefit Section</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: MILK PRODUCTION ---- */}
          {sections.production && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Production Header */}
              <div className="flex justify-between items-end border-b-2 border-green-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-green-900 tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-blue-700 uppercase tracking-widest">Dairy Production</h2>
                  <p className="text-xs font-bold text-amber-900 uppercase mt-1">Performance and History</p>
                </div>
              </div>

              {/* Milk KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Total Produced (Range)</p>
                    <p className="text-3xl font-black text-blue-700">{reportData.kpis.produccion_leche} <span className="text-lg">Liters</span></p>
                  </div>
                  <Package size={36} className="text-blue-300" />
                </div>
                <div className="border border-stone-200 bg-[#FAF8F5] rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Weekly Average</p>
                    <p className="text-3xl font-black text-stone-800">{reportData.kpis.promedio_semanal_leche} <span className="text-lg text-stone-500">L / Week</span></p>
                  </div>
                  <Activity size={36} className="text-green-600" />
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mb-8 border border-stone-200 rounded-xl p-5 bg-[#FAF8F5]">
                <h3 className="text-sm font-black text-green-900 uppercase tracking-widest mb-4">Performance Chart</h3>
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.graficas.produccion_leche}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      {/* isAnimationActive=false IS CRITICAL FOR PDF */}
                      <Bar dataKey="litros" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="flex-1">
                <h3 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-3">Detailed Record (Sampling)</h3>
                <table className="w-full text-left border-collapse border border-stone-200">
                  <thead className="bg-[#FAF8F5] text-[10px] uppercase text-stone-500 font-black border-b border-stone-200">
                    <tr>
                      <th className="border-x border-stone-200 p-2.5">Date</th>
                      <th className="border-x border-stone-200 p-2.5">Cow / Identification</th>
                      <th className="border-x border-stone-200 p-2.5 text-right">Milked Liters</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-stone-800">
                    {reportData.tablas.produccion_detalle.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="border-b border-stone-100">
                        <td className="border-x border-stone-200 p-2.5 text-stone-500">{item.fecha}</td>
                        <td className="border-x border-stone-200 p-2.5">{item.vaca}</td>
                        <td className="border-x border-stone-200 p-2.5 text-right text-blue-600 font-black">{item.litros} L</td>
                      </tr>
                    ))}
                    {reportData.tablas.produccion_detalle.length > 15 && (
                      <tr>
                        <td colSpan="3" className="border border-stone-200 p-3 text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                          ... and {reportData.tablas.produccion_detalle.length - 15} more records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-stone-200 pt-4 flex justify-between items-center text-[10px] text-stone-400 font-black uppercase tracking-widest">
                <span>Finca Baltodano's Management System</span>
                <span>Production Section</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: ANIMAL HEALTH ---- */}
          {sections.health && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Health Header */}
              <div className="flex justify-between items-end border-b-2 border-green-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-green-900 tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-amber-700 uppercase tracking-widest">Health & Development</h2>
                  <p className="text-xs font-bold text-stone-500 uppercase mt-1">Weight and Sanitary Control</p>
                </div>
              </div>

              {/* Health and Weight KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Applied Treatments</p>
                    <p className="text-3xl font-black text-amber-700">{reportData.kpis.tratamientos_aplicados}</p>
                  </div>
                  <Activity size={36} className="text-amber-300" />
                </div>
                <div className="border border-stone-200 bg-[#FAF8F5] rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Average Herd Evolution</p>
                    <p className={`text-3xl font-black ${reportData.kpis.crecimiento_peso_pct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {reportData.kpis.crecimiento_peso_pct >= 0 ? '↑' : '↓'} {Math.abs(reportData.kpis.crecimiento_peso_pct)} %
                    </p>
                  </div>
                  <Activity size={36} className={reportData.kpis.crecimiento_peso_pct >= 0 ? 'text-green-300' : 'text-red-300'} />
                </div>
              </div>

              {/* Line Chart (Weight) */}
              <div className="mb-6 border border-stone-200 rounded-xl p-5 bg-[#FAF8F5]">
                <h3 className="text-sm font-black text-green-900 uppercase tracking-widest mb-4">Development Curve (Avg. Weight in KG)</h3>
                <div style={{ width: '100%', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.graficas.progreso_peso}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Line type="monotone" dataKey="peso" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, fill: '#16A34A' }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-side Tables: Health and Weight */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                
                {/* Treatments Table */}
                <div>
                  <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-2">Sanitary Records</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black border-b border-stone-200">
                      <tr>
                        <th className="border-x border-stone-200 p-2">Date</th>
                        <th className="border-x border-stone-200 p-2">Identification</th>
                        <th className="border-x border-stone-200 p-2">Treatment</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.sanidad_detalle.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-b border-stone-100">
                          <td className="border-x border-stone-200 p-2 text-stone-500">{item.fecha}</td>
                          <td className="border-x border-stone-200 p-2">{item.vaca}</td>
                          <td className="border-x border-stone-200 p-2 text-amber-800">{item.evento} ({item.dosis})</td>
                        </tr>
                      ))}
                      {reportData.tablas.sanidad_detalle.length === 0 && (
                        <tr><td colSpan="3" className="border border-stone-200 p-3 text-center text-stone-400">No records in period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Weights Table */}
                <div>
                  <h3 className="text-[11px] font-black text-green-800 uppercase tracking-widest mb-2">Latest Weighings</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black border-b border-stone-200">
                      <tr>
                        <th className="border-x border-stone-200 p-2">Date</th>
                        <th className="border-x border-stone-200 p-2">Identification</th>
                        <th className="border-x border-stone-200 p-2 text-right">Recorded Weight</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.peso_detalle.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-b border-stone-100">
                          <td className="border-x border-stone-200 p-2 text-stone-500">{item.fecha}</td>
                          <td className="border-x border-stone-200 p-2">{item.vaca}</td>
                          <td className="border-x border-stone-200 p-2 text-right text-green-700 font-black">{item.peso} KG</td>
                        </tr>
                      ))}
                      {reportData.tablas.peso_detalle.length === 0 && (
                        <tr><td colSpan="3" className="border border-stone-200 p-3 text-center text-stone-400">No records in period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-stone-200 pt-4 flex justify-between items-center text-[10px] text-stone-400 font-black uppercase tracking-widest">
                <span>Finca Baltodano's Management System</span>
                <span>Animal Health Section</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: INVENTORY AND WAREHOUSE ---- */}
          {sections.inventory && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Inventory Header */}
              <div className="flex justify-between items-end border-b-2 border-green-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-green-900 tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-teal-700 uppercase tracking-widest">Inventory & Warehouse</h2>
                  <p className="text-xs font-bold text-stone-500 uppercase mt-1">Stock and Flow</p>
                </div>
              </div>

              {/* Inventory KPIs */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-teal-200 bg-teal-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-teal-800 uppercase tracking-widest mb-1">Warehouse Value</p>
                    <p className="text-xl font-black text-teal-700">C$ {reportData.kpis.capital_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <Package size={28} className="text-teal-400" />
                </div>
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-1">Inflow Volume</p>
                    <p className="text-xl font-black text-green-700">{reportData.kpis.inventario_entradas}</p>
                  </div>
                  <Activity size={28} className="text-green-400" />
                </div>
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-1">Outflow Volume</p>
                    <p className="text-xl font-black text-red-600">{reportData.kpis.inventario_salidas}</p>
                  </div>
                  <Activity size={28} className="text-red-400" />
                </div>
              </div>

              {/* Inflow vs Outflow Chart */}
              <div className="mb-6 border border-stone-200 rounded-xl p-5 bg-[#FAF8F5]">
                <h3 className="text-sm font-black text-green-900 uppercase tracking-widest mb-4">Inventory Flow (Inflow vs Outflow)</h3>
                <div style={{ width: '100%', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.graficas.flujo_inventario}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <Bar dataKey="Entradas" fill="#16A34A" radius={[2, 2, 0, 0]} isAnimationActive={false} barSize={20} />
                      <Bar dataKey="Salidas" fill="#DC2626" radius={[2, 2, 0, 0]} isAnimationActive={false} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-side Tables: Products vs Movements */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                
                {/* Active Products Table */}
                <div>
                  <h3 className="text-[11px] font-black text-teal-800 uppercase tracking-widest mb-2">Products in Stock</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black border-b border-stone-200">
                      <tr>
                        <th className="border-x border-stone-200 p-2">Product</th>
                        <th className="border-x border-stone-200 p-2">Category</th>
                        <th className="border-x border-stone-200 p-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.productos_activos.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-b border-stone-100">
                          <td className="border-x border-stone-200 p-2 text-green-900 font-black">{item.nombre}</td>
                          <td className="border-x border-stone-200 p-2 text-stone-500">{item.categoria}</td>
                          <td className={`border-x border-stone-200 p-2 text-right font-black ${item.stock <= 0 ? 'text-red-600' : 'text-teal-700'}`}>
                            {item.stock} {item.unidad}
                          </td>
                        </tr>
                      ))}
                      {reportData.tablas.productos_activos.length === 0 && (
                        <tr><td colSpan="3" className="border border-stone-200 p-3 text-center text-stone-400">No products registered</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Recent Movements Table */}
                <div>
                  <h3 className="text-[11px] font-black text-stone-700 uppercase tracking-widest mb-2">Period Movements</h3>
                  <table className="w-full text-left border-collapse border border-stone-200">
                    <thead className="bg-[#FAF8F5] text-[9px] uppercase text-stone-500 font-black border-b border-stone-200">
                      <tr>
                        <th className="border-x border-stone-200 p-2">Date</th>
                        <th className="border-x border-stone-200 p-2">Movement</th>
                        <th className="border-x border-stone-200 p-2 text-right">Qty.</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-stone-800">
                      {reportData.tablas.movimientos_detalle.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-b border-stone-100">
                          <td className="border-x border-stone-200 p-2 text-stone-500">{item.fecha}</td>
                          <td className="border-x border-stone-200 p-2">
                            <span className={item.tipo === 'Entrada' ? 'text-green-700 font-black' : 'text-red-600 font-black'}>[{item.tipo === 'Entrada' ? 'IN' : 'OUT'}]</span> {item.producto}
                          </td>
                          <td className="border-x border-stone-200 p-2 text-right font-black text-stone-700">{item.cantidad}</td>
                        </tr>
                      ))}
                      {reportData.tablas.movimientos_detalle.length === 0 && (
                        <tr><td colSpan="3" className="border border-stone-200 p-3 text-center text-stone-400">No movements in period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-stone-200 pt-4 flex justify-between items-center text-[10px] text-stone-400 font-black uppercase tracking-widest">
                <span>Finca Baltodano's Management System</span>
                <span>Inventory & Warehouse Section</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: SIGNATURES AND CLOSING ---- */}
          {extraOptions.signatureSeal && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto">
               <h3 className="text-xl font-black text-green-900 mb-6">Notes / Observations for the Period</h3>
               <div className="border border-stone-200 bg-[#FAF8F5] rounded-2xl p-6 h-48 mb-12 shadow-inner">
                 <div className="border-b border-stone-300 h-8 w-full"></div>
                 <div className="border-b border-stone-300 h-8 w-full"></div>
                 <div className="border-b border-stone-300 h-8 w-full"></div>
                 <div className="border-b border-stone-300 h-8 w-full"></div>
               </div>

               {/* Official Signatures Box */}
               <div className="border border-stone-200 rounded-3xl p-8 flex justify-between items-end mt-auto mb-16 bg-[#FAF8F5]">
                 <div className="text-center w-48">
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-12 tracking-widest">Prepared by:</p>
                    <div className="border-b border-stone-400 w-full mb-2"></div>
                    <p className="text-xs font-black text-stone-800">General Manager</p>
                    <p className="text-[9px] font-bold text-stone-500 mt-2">Finca Baltodano's</p>
                 </div>
                 <div className="text-center">
                    <span className="text-4xl opacity-80">🐄</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-900 mt-1">BaltoFarm</p>
                 </div>
                 <div className="text-center w-48">
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-12 tracking-widest">Approved by:</p>
                    <div className="border-b border-stone-400 w-full mb-2"></div>
                    <p className="text-xs font-black text-stone-800">Eng. Marvin Baltodano</p>
                    <p className="text-[9px] font-bold text-stone-500 mt-2">Owner</p>
                 </div>
               </div>

               <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-stone-200 pt-4 flex justify-between items-center text-[10px] text-stone-400 font-black uppercase tracking-widest">
                <span>Finca Baltodano's Management System</span>
                <span>Final Page</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default ReportsPage;