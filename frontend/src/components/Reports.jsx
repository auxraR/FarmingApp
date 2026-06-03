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
        confirmButtonColor: '#11131F'
      });
    }
  };

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 text-black relative overflow-hidden">
      
      {/* HEADER CONTROLS */}
      <div className="mb-8 pb-4 border-b border-[#E0E0E0]">
        <h1 className="text-3xl font-black text-[#11131F]">Reports Studio</h1>
        <p className="text-sm text-[#8C92AC] mt-1">Configure and generate official documentation dynamically.</p>
      </div>

      <div className="max-w-5xl space-y-6">
        
        {/* 1. SELECT PERIOD */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <h2 className="text-sm font-bold text-green-700 mb-4 uppercase tracking-widest">1. Select Period</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {['Today', 'Week', 'Month', 'Year', 'Custom'].map(opt => (
              <button 
                key={opt} onClick={() => setPeriod(opt)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  period === opt ? 'bg-green-700 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-8 bg-gray-50 p-4 rounded-xl border border-gray-100 w-fit">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500 uppercase">From:</label>
              <input type="date" value={dates.from} onChange={e => setDates({...dates, from: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold outline-none focus:border-green-700" />
            </div>
            <Calendar size={18} className="text-gray-400" />
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-500 uppercase">To:</label>
              <input type="date" value={dates.to} onChange={e => setDates({...dates, to: e.target.value})} className="bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold outline-none focus:border-green-700" />
            </div>
          </div>
        </div>

        {/* 2. REPORT TYPE */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <h2 className="text-sm font-bold text-green-700 mb-4 uppercase tracking-widest">2. Report Type</h2>
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
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all h-26 ${
                  reportType === type.id ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                }`}
              >
                <type.icon size={26} className={`mb-2 ${reportType === type.id ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-[11px] font-black text-center leading-tight">{type.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. CUSTOM REPORT */}
        <div className={`bg-white p-6 rounded-3xl shadow-sm border transition-all duration-300 ${
          reportType === 'Custom' ? 'border-green-400 shadow-md' : 'border-[#EBEBEB] opacity-75'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-green-700 uppercase tracking-widest">3. Module Configuration</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {reportType === 'Custom' ? '' : ``}
              </p>
            </div>
            <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full text-white ${reportType === 'Custom' ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`}>
              {reportType === 'Custom' ? 'Editable' : 'Predefined'}
            </span>
          </div>
          
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 mt-6 pl-2 ${reportType !== 'Custom' ? 'pointer-events-none select-none' : ''}`}>
            {Object.keys(sections).map((sec) => (
              <div 
                key={sec} 
                onClick={() => toggleSection(sec)} 
                className={`flex items-center gap-3 select-none ${reportType === 'Custom' ? 'cursor-pointer group' : 'cursor-not-allowed'}`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  sections[sec] ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 bg-white group-hover:border-green-500'
                } ${reportType !== 'Custom' && sections[sec] ? 'bg-gray-500 border-gray-500' : ''}`}>
                  {sections[sec] && <CheckSquare size={14} />}
                </div>
                <span className={`text-sm font-bold capitalize ${reportType === 'Custom' ? 'text-gray-700' : 'text-gray-400'}`}>
                  {sec.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. EXTRA DESIGN CONFIGURATION */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB] flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-green-700 mb-4 uppercase tracking-widest">4. Selected Sections Summary</h2>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
              <ul className="text-xs font-semibold text-gray-600 space-y-1.5 list-disc pl-4">
                {Object.keys(sections).filter(k => sections[k]).map(k => (
                  <li key={k} className="capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex-1 border-l border-gray-100 pl-8">
            <h2 className="text-sm font-bold text-green-700 mb-4 uppercase tracking-widest">Design</h2>
            <div className="flex gap-4 mb-4">
               {['Standard', 'Compact'].map(d => (
                 <button key={d} onClick={() => setDesign(d)} className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${design === d ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500'}`}>
                   <Layout size={20} />
                   <span className="text-[10px] font-bold mt-1">{d}</span>
                 </button>
               ))}
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-sm font-bold text-gray-700">Include signature and seal</span>
                <input type="checkbox" className="w-4 h-4 accent-green-700" checked={extraOptions.signatureSeal} onChange={() => setExtraOptions({...extraOptions, signatureSeal: !extraOptions.signatureSeal})} />
              </label>
            </div>
          </div>
        </div>

        {/* EXECUTE BUTTONS */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-4 pb-8 gap-4">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className={`w-full md:w-auto flex items-center justify-center gap-2 text-white px-8 py-4 rounded-xl font-black text-sm transition-colors shadow-lg ${
              isGenerating ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-green-700 hover:bg-green-800 shadow-green-700/30'
            }`}
          >
            <Download size={20} /> {isGenerating ? 'Querying Database & Generating...' : 'Download Official PDF'}
          </button>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none items-center justify-center gap-2 flex bg-white border border-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
              <Printer size={18} /> Print
            </button>
            <button className="flex-1 md:flex-none items-center justify-center gap-2 flex bg-white border border-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
              <FileSpreadsheet size={18} /> Export Excel
            </button>
          </div>
        </div>

      </div>

      <div style={{ position: 'absolute', top: '-20000px', left: '-20000px' }}>
        <div ref={reportRef} className="bg-gray-200 p-4 flex flex-col gap-6">

          {/* ---- SPECIFIC PAGE: EXECUTIVE SUMMARY ---- */}
          {sections.executiveSummary && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Figma Header */}
              <div className="flex justify-between items-center border-b-2 border-green-700 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🐄</span>
                  <h1 className="text-3xl font-black text-[#11131F] tracking-tight">Finca Baltodano's</h1>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black text-[#11131F] uppercase">General Report</h2>
                  <p className="text-sm font-bold text-green-700 uppercase tracking-widest">Finca Baltodano</p>
                </div>
              </div>

              {/* Technical Sheet */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-x-12 gap-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-gray-200"><User size={18} className="text-gray-600"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Owner</p>
                    <p className="text-sm font-black text-[#11131F]">Marvin Baltodano</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-gray-200"><MapPin size={18} className="text-gray-600"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Location</p>
                    <p className="text-sm font-black text-[#11131F]">Diriamba, Carazo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-gray-200"><Calendar size={18} className="text-gray-600"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Period</p>
                    <p className="text-sm font-black text-[#11131F]">{reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full border border-gray-200"><Hash size={18} className="text-gray-600"/></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Code</p>
                    <p className="text-sm font-black text-[#11131F]">REP-0110D</p>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-black text-green-700 mb-6">1. Executive Summary</h3>

              {/* DYNAMIC KPIS FROM DJANGO */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                  <DollarSign size={24} className="mx-auto text-green-600 mb-2" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Net Profit</p>
                  <p className="text-xl font-black text-green-600 my-1">
                    C$ {reportData.kpis.ganancia_neta.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] text-green-600 bg-green-50 rounded-full py-0.5">↑ Dynamic</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                  <Package size={24} className="mx-auto text-blue-500 mb-2" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Milk Prod.</p>
                  <p className="text-xl font-black text-[#11131F] my-1">{reportData.kpis.produccion_leche} L</p>
                  <p className="text-[9px] text-gray-500">Total in range</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                  <Activity size={24} className="mx-auto text-orange-500 mb-2" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Active Herd</p>
                  <p className="text-xl font-black text-[#11131F] my-1">{reportData.kpis.total_animales}</p>
                  <p className="text-[9px] text-gray-500">Heads of cattle</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 text-center bg-white">
                  <Activity size={24} className="mx-auto text-purple-500 mb-2" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Profitability</p>
                  <p className="text-xl font-black text-[#11131F] my-1">{reportData.kpis.rentabilidad} %</p>
                  <p className="text-[9px] text-gray-500">On sales</p>
                </div>
              </div>

              {/* FINANCIAL RESULT TABLE */}
              <h3 className="text-lg font-black text-green-700 mb-4">Operating Financial Summary</h3>
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead className="bg-gray-100 text-[10px] uppercase text-gray-600 font-bold">
                  <tr>
                    <th className="border border-gray-200 p-3">Concept</th>
                    <th className="border border-gray-200 p-3 text-right">Income (Sales)</th>
                    <th className="border border-gray-200 p-3 text-right">Expenses (Purchases)</th>
                    <th className="border border-gray-200 p-3 text-right">Operating Balance</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-gray-800 divide-y divide-gray-200">
                  <tr>
                    <td className="p-3 bg-gray-50">Consolidated flow for the period</td>
                    <td className="p-3 text-right text-green-600">C$ {reportData.kpis.ingresos_brutos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-red-500">C$ {reportData.kpis.gastos_operativos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-right ${reportData.kpis.ganancia_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      C$ {reportData.kpis.ganancia_neta.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* IMPORTANT ALERTS SECTION */}
              {sections.importantAlerts && (
                <div className="mt-8">
                  <h3 className="text-lg font-black text-green-700 mb-4">Alerts and Key Indicators</h3>
                  <div className="space-y-3">
                    {reportData.alertas.map((alerta, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        {alerta.tipo === 'peligro' && <XCircle className="text-red-500" size={20}/>}
                        {alerta.tipo === 'precaucion' && <AlertTriangle className="text-yellow-500" size={20}/>}
                        {alerta.tipo === 'exito' && <CheckCircle2 className="text-green-500" size={20}/>}
                        <p className="text-xs font-bold text-gray-700">{alerta.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Page Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-gray-200 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Finca Baltodano's Management System</span>
                <span>Summary Page</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: FINANCIAL STATUS ---- */}
          {sections.financialStatus && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Financial Header */}
              <div className="flex justify-between items-end border-b-2 border-green-700 pb-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-[#11131F] tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-green-700 uppercase tracking-widest">Financial Report</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Income Statement</p>
                </div>
              </div>

              {/* Financial KPIs (4 Blocks) */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border border-gray-200 bg-green-50/50 rounded-xl p-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Gross Income</p>
                  <p className="text-xl font-black text-green-700">C$ {reportData.kpis.ingresos_brutos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border border-gray-200 bg-red-50/50 rounded-xl p-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Operating Expenses</p>
                  <p className="text-xl font-black text-red-600">C$ {reportData.kpis.gastos_operativos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border border-gray-200 bg-blue-50/50 rounded-xl p-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Total Capital (Equity)</p>
                  <p className="text-xl font-black text-blue-600">C$ {reportData.kpis.capital_total.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="border border-gray-200 bg-orange-50/50 rounded-xl p-4">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Losses (Animals)</p>
                  <p className="text-xl font-black text-orange-600">C$ {reportData.kpis.perdidas_animales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[8px] text-gray-500 mt-1">{reportData.kpis.cantidad_perdidas} heads registered</p>
                </div>
              </div>

              {/* Detailed Tables (2 Columns) */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                
                {/* Income Table */}
                <div>
                  <h3 className="text-sm font-black text-green-700 uppercase tracking-widest mb-3">Income Detail</h3>
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-[10px] uppercase text-gray-600">
                      <tr>
                        <th className="border border-gray-200 p-2">Concept</th>
                        <th className="border border-gray-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-gray-800">
                      {reportData.tablas.ingresos.length > 0 ? (
                        reportData.tablas.ingresos.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border border-gray-200 p-2">{item.concepto}</td>
                            <td className="border border-gray-200 p-2 text-right">C$ {item.monto.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="border border-gray-200 p-2 text-center text-gray-400">No records</td></tr>
                      )}
                      <tr className="bg-green-50">
                        <td className="border border-gray-200 p-2 font-black text-green-800 uppercase text-[10px]">Total Income</td>
                        <td className="border border-gray-200 p-2 text-right font-black text-green-700">C$ {reportData.kpis.ingresos_brutos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Expenses Table */}
                <div>
                  <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-3">Expense Detail</h3>
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-[10px] uppercase text-gray-600">
                      <tr>
                        <th className="border border-gray-200 p-2">Concept</th>
                        <th className="border border-gray-200 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-gray-800">
                      {reportData.tablas.egresos.length > 0 ? (
                        reportData.tablas.egresos.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border border-gray-200 p-2">{item.concepto}</td>
                            <td className="border border-gray-200 p-2 text-right">C$ {item.monto.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="border border-gray-200 p-2 text-center text-gray-400">No records</td></tr>
                      )}
                      <tr className="bg-red-50">
                        <td className="border border-gray-200 p-2 font-black text-red-800 uppercase text-[10px]">Total Expenses</td>
                        <td className="border border-gray-200 p-2 text-right font-black text-red-600">C$ {reportData.kpis.gastos_operativos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Final Result */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center mt-auto">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Net Result for the Period</p>
                  <p className="text-xs text-gray-400">Income minus Expenses and Losses</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${reportData.kpis.ganancia_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    C$ {reportData.kpis.ganancia_neta.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-gray-200 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Finca Baltodano's Management System</span>
                <span>Financial Section</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: MILK PRODUCTION ---- */}
          {sections.production && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Production Header */}
              <div className="flex justify-between items-end border-b-2 border-green-700 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-[#11131F] tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-blue-600 uppercase tracking-widest">Dairy Production</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Performance and History</p>
                </div>
              </div>

              {/* Milk KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-gray-200 bg-blue-50/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Total Produced (Range)</p>
                    <p className="text-2xl font-black text-blue-700">{reportData.kpis.produccion_leche} Liters</p>
                  </div>
                  <Package size={32} className="text-blue-300" />
                </div>
                <div className="border border-gray-200 bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Weekly Average</p>
                    <p className="text-2xl font-black text-[#11131F]">{reportData.kpis.promedio_semanal_leche} L / Week</p>
                  </div>
                  <Activity size={32} className="text-green-500" />
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mb-8 border border-gray-200 rounded-xl p-4 bg-white">
                <h3 className="text-sm font-black text-green-700 uppercase tracking-widest mb-4">Performance Chart</h3>
                {/* Fixed width/height so PDF rendering doesn't fail */}
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.graficas.produccion_leche}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8C92AC' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8C92AC' }} axisLine={false} tickLine={false} />
                      {/* isAnimationActive=false IS CRITICAL FOR PDF */}
                      <Bar dataKey="litros" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="flex-1">
                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-3">Detailed Record (Sampling)</h3>
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-100 text-[10px] uppercase text-gray-600">
                    <tr>
                      <th className="border border-gray-200 p-2">Date</th>
                      <th className="border border-gray-200 p-2">Cow / Identification</th>
                      <th className="border border-gray-200 p-2 text-right">Milked Liters</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-gray-800">
                    {reportData.tablas.produccion_detalle.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2 text-gray-500">{item.fecha}</td>
                        <td className="border border-gray-200 p-2">{item.vaca}</td>
                        <td className="border border-gray-200 p-2 text-right text-blue-600">{item.litros} L</td>
                      </tr>
                    ))}
                    {reportData.tablas.produccion_detalle.length > 15 && (
                      <tr>
                        <td colSpan="3" className="border border-gray-200 p-2 text-center text-[10px] text-gray-400">
                          ... and {reportData.tablas.produccion_detalle.length - 15} more records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-gray-200 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Finca Baltodano's Management System</span>
                <span>Production Section</span>
              </div>
            </div>
          )}
            {sections.health && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Health Header */}
              <div className="flex justify-between items-end border-b-2 border-green-700 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-[#11131F] tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-orange-600 uppercase tracking-widest">Health and Development</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Weight and Health Control</p>
                </div>
              </div>

              {/* Health and Weight KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 bg-orange-50/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Applied Treatments</p>
                    <p className="text-2xl font-black text-orange-700">{reportData.kpis.tratamientos_aplicados}</p>
                  </div>
                  <Activity size={32} className="text-orange-300" />
                </div>
                <div className="border border-gray-200 bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Average Herd Evolution</p>
                    <p className={`text-2xl font-black ${reportData.kpis.crecimiento_peso_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.kpis.crecimiento_peso_pct >= 0 ? '↑' : '↓'} {Math.abs(reportData.kpis.crecimiento_peso_pct)} %
                    </p>
                  </div>
                  <Activity size={32} className={reportData.kpis.crecimiento_peso_pct >= 0 ? 'text-green-500' : 'text-red-500'} />
                </div>
              </div>

              {/* Line Chart (Weight) */}
              <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-white">
                <h3 className="text-sm font-black text-green-700 uppercase tracking-widest mb-4">Development Curve (Average Weight in KG)</h3>
                <div style={{ width: '100%', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.graficas.progreso_peso}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8C92AC' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8C92AC' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      {/* isAnimationActive=false so PDF comes out fine */}
                      <Line type="monotone" dataKey="peso" stroke="#16A34A" strokeWidth={3} dot={{ r: 4, fill: '#16A34A' }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-side Tables: Health and Weight */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                
                {/* Treatments Table */}
                <div>
                  <h3 className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-2">Health Record</h3>
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-[9px] uppercase text-gray-600">
                      <tr>
                        <th className="border border-gray-200 p-2">Date</th>
                        <th className="border border-gray-200 p-2">Identification</th>
                        <th className="border border-gray-200 p-2">Treatment</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-gray-800">
                      {reportData.tablas.sanidad_detalle.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-200 p-2 text-gray-500">{item.fecha}</td>
                          <td className="border border-gray-200 p-2">{item.vaca}</td>
                          <td className="border border-gray-200 p-2 text-orange-700">{item.evento} ({item.dosis})</td>
                        </tr>
                      ))}
                      {reportData.tablas.sanidad_detalle.length === 0 && (
                        <tr><td colSpan="3" className="border border-gray-200 p-2 text-center text-gray-400">No records in period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Weights Table */}
                <div>
                  <h3 className="text-[11px] font-black text-green-700 uppercase tracking-widest mb-2">Latest Weighings</h3>
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-[9px] uppercase text-gray-600">
                      <tr>
                        <th className="border border-gray-200 p-2">Date</th>
                        <th className="border border-gray-200 p-2">Identification</th>
                        <th className="border border-gray-200 p-2 text-right">Recorded Weight</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-gray-800">
                      {reportData.tablas.peso_detalle.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-200 p-2 text-gray-500">{item.fecha}</td>
                          <td className="border border-gray-200 p-2">{item.vaca}</td>
                          <td className="border border-gray-200 p-2 text-right text-green-700">{item.peso} KG</td>
                        </tr>
                      ))}
                      {reportData.tablas.peso_detalle.length === 0 && (
                        <tr><td colSpan="3" className="border border-gray-200 p-2 text-center text-gray-400">No records in period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-gray-200 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Finca Baltodano's Management System</span>
                <span>Animal Health Section</span>
              </div>
            </div>
          )}

          {/* ---- SPECIFIC PAGE: INVENTORY AND WAREHOUSE ---- */}
          {sections.inventory && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto mb-8">
              
              {/* Inventory Header */}
              <div className="flex justify-between items-end border-b-2 border-green-700 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐄</span>
                    <h1 className="text-2xl font-black text-[#11131F] tracking-tight">Finca Baltodano's</h1>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Period: {reportData.periodo.desde} to {reportData.periodo.hasta}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-teal-600 uppercase tracking-widest">Inventory and Warehouse</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Stock and Flow</p>
                </div>
              </div>

              {/* Inventory KPIs */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-200 bg-teal-50/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Warehouse Value</p>
                    <p className="text-xl font-black text-teal-700">C$ {reportData.kpis.capital_total.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <Package size={28} className="text-teal-400" />
                </div>
                <div className="border border-gray-200 bg-green-50/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Inflow Volume</p>
                    <p className="text-xl font-black text-green-600">{reportData.kpis.inventario_entradas}</p>
                  </div>
                  <Activity size={28} className="text-green-400" />
                </div>
                <div className="border border-gray-200 bg-red-50/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Outflow Volume</p>
                    <p className="text-xl font-black text-red-600">{reportData.kpis.inventario_salidas}</p>
                  </div>
                  <Activity size={28} className="text-red-400" />
                </div>
              </div>

              {/* Inflow vs Outflow Chart */}
              <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-white">
                <h3 className="text-sm font-black text-teal-700 uppercase tracking-widest mb-4">Inventory Flow (Inflow vs Outflow)</h3>
                <div style={{ width: '100%', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.graficas.flujo_inventario}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#8C92AC' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#8C92AC' }} axisLine={false} tickLine={false} />
                      {/* isAnimationActive=false for PDF rendering */}
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
                  <h3 className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-2">Products in Stock</h3>
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-[9px] uppercase text-gray-600">
                      <tr>
                        <th className="border border-gray-200 p-2">Product</th>
                        <th className="border border-gray-200 p-2">Category</th>
                        <th className="border border-gray-200 p-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-gray-800">
                      {reportData.tablas.productos_activos.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-200 p-2 text-gray-700">{item.nombre}</td>
                          <td className="border border-gray-200 p-2 text-gray-500">{item.categoria}</td>
                          <td className={`border border-gray-200 p-2 text-right ${item.stock <= 0 ? 'text-red-500' : 'text-teal-700'}`}>
                            {item.stock} {item.unidad}
                          </td>
                        </tr>
                      ))}
                      {reportData.tablas.productos_activos.length === 0 && (
                        <tr><td colSpan="3" className="border border-gray-200 p-2 text-center text-gray-400">No products registered</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Recent Movements Table */}
                <div>
                  <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest mb-2">Period Movements</h3>
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 text-[9px] uppercase text-gray-600">
                      <tr>
                        <th className="border border-gray-200 p-2">Date</th>
                        <th className="border border-gray-200 p-2">Movement</th>
                        <th className="border border-gray-200 p-2 text-right">Qty.</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-gray-800">
                      {reportData.tablas.movimientos_detalle.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-200 p-2 text-gray-500">{item.fecha}</td>
                          <td className="border border-gray-200 p-2">
                            <span className={item.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}>[{item.tipo}]</span> {item.producto}
                          </td>
                          <td className="border border-gray-200 p-2 text-right">{item.cantidad}</td>
                        </tr>
                      ))}
                      {reportData.tablas.movimientos_detalle.length === 0 && (
                        <tr><td colSpan="3" className="border border-gray-200 p-2 text-center text-gray-400">No movements in period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Footer */}
              <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-gray-200 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Finca Baltodano's Management System</span>
                <span>Inventory and Warehouse Section</span>
              </div>
            </div>
          )}
          {/* ---- SPECIFIC PAGE: SIGNATURES AND CLOSING ---- */}
          {extraOptions.signatureSeal && reportData && (
            <div className="pdf-page-container bg-white w-[210mm] h-[297mm] p-[15mm] flex flex-col relative box-border mx-auto">
               <h3 className="text-xl font-black text-green-700 mb-6">Notes / Observations for the Period</h3>
               <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-6 h-48 mb-12">
                 <div className="border-b border-gray-200 h-8 w-full"></div>
                 <div className="border-b border-gray-200 h-8 w-full"></div>
                 <div className="border-b border-gray-200 h-8 w-full"></div>
                 <div className="border-b border-gray-200 h-8 w-full"></div>
               </div>

               {/* Official Signatures Box */}
               <div className="border border-gray-200 rounded-3xl p-8 flex justify-between items-end mt-auto mb-16 bg-gray-50/30">
                 <div className="text-center w-48">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-12 tracking-widest">Prepared by:</p>
                    <div className="border-b border-gray-400 w-full mb-2"></div>
                    <p className="text-xs font-black text-[#11131F]">General Manager</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-2">Finca Baltodano's</p>
                 </div>
                 <div className="text-center">
                    <span className="text-4xl">🐄</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-800 mt-1">BaltoFarm</p>
                 </div>
                 <div className="text-center w-48">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-12 tracking-widest">Approved by:</p>
                    <div className="border-b border-gray-400 w-full mb-2"></div>
                    <p className="text-xs font-black text-[#11131F]">Eng. Marvin Baltodano</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-2">Owner</p>
                 </div>
               </div>

               <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-gray-200 pt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>Finca Baltodano's Management System</span>
                <span>Last Page</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default ReportsPage;