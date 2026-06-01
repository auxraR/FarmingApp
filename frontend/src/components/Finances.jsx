import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, ArrowDownRight, Calendar, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

const FinancesPage = () => {
  // 1. Estados para almacenar la data real del backend
  const [financeData, setFinanceData] = useState({
    kpi: { patrimonio: 0, ingresos: 0, gastos: 0, neto: 0 },
    cashFlowTrends: [],
    ranchValuationGrowth: [],
    generalLedger: []
  });
  const [loading, setLoading] = useState(true);

  // 2. Fetch de datos al montar el componente
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const response = await apiClient.get('/finances/');
        setFinanceData(response.data);
      } catch (error) {
        console.error("Error al cargar finanzas:", error);
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudieron cargar los datos financieros del servidor.',
          icon: 'error',
          confirmButtonColor: '#11131F'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  if (loading) {
    return <div className="flex-1 p-8 bg-[#F4F6F8] text-[#8C92AC] font-bold mt-20 text-center">Calculando estados financieros...</div>;
  }

  const { kpi, cashFlowTrends, ranchValuationGrowth, generalLedger } = financeData;

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[0px] text-black">
      
      {/* 1. HEADER */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0E0]">
        <div>
          <h1 className="text-3xl font-bold text-[#11131F] flex items-center gap-3">
            <Wallet size={32} className="text-[#11131F]" /> Financial Management
          </h1>
          <p className="text-sm text-[#8C92AC] mt-1">Real-time overview of ranch assets, cash flow, and profits.</p>
        </div>
        <button 
          onClick={() => alert('Próximamente: Exportación de reportes en PDF/Excel')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#11131F] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm"
        >
          <FileText size={18} /> Export Financial Statement
        </button>
      </div>

      {/* 2. TARJETAS KPI (DINÁMICAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Patrimonio Total */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <PieChart className="text-[#3498DB]" size={24} />
            <span className="text-[10px] font-black text-[#3498DB] px-2 py-1 bg-blue-50 rounded-md uppercase tracking-wider">Total Assets</span>
          </div>
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-widest">Patrimonio Estimado</p>
          <p className="text-3xl font-black text-[#11131F] mt-1">C$ {kpi.patrimonio.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">* Includes livestock market value + inventory</p>
        </div>

        {/* Ingresos del Mes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <ArrowUpRight className="text-[#2ECC71]" size={24} />
            <span className="text-[10px] font-black text-[#2ECC71] px-2 py-1 bg-green-50 rounded-md uppercase tracking-wider">Gross Income</span>
          </div>
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-widest">Ingresos Brutos</p>
          <p className="text-3xl font-black text-[#2ECC71] mt-1">C$ {kpi.ingresos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">From milk sales & cattle trade</p>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <ArrowDownRight className="text-[#E74C3C]" size={24} />
            <span className="text-[10px] font-black text-[#E74C3C] px-2 py-1 bg-red-50 rounded-md uppercase tracking-wider">Expenses</span>
          </div>
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-widest">Gastos Operativos</p>
          <p className="text-3xl font-black text-[#E74C3C] mt-1">C$ {kpi.gastos.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">From feed, health & logistics</p>
        </div>

        {/* Saldo en Caja / Liquidez */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-[#F39C12]" size={24} />
            <span className="text-[10px] font-black text-[#F39C12] px-2 py-1 bg-yellow-50 rounded-md uppercase tracking-wider">Available Cash</span>
          </div>
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-widest">Saldo en Caja</p>
          <p className={`text-3xl font-black mt-1 ${kpi.neto < 0 ? 'text-red-500' : 'text-[#11131F]'}`}>
            C$ {kpi.neto.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-[#2ECC71] font-bold mt-2 flex items-center gap-1">
            {kpi.neto >= 0 ? '▲ Positive liquidity' : '▼ Negative liquidity'}
          </p>
        </div>
      </div>

      {/* 3. SECCIÓN DE GRÁFICAS (DINÁMICAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Gráfico 1: Ingresos vs Gastos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <h2 className="text-lg font-bold text-[#11131F] mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#2ECC71]" /> Monthly Cash Flow Trends
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            {cashFlowTrends.length > 0 ? (
              <BarChart data={cashFlowTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fill: '#8C92AC', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8C92AC', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #EBEBEB' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Income" fill="#2ECC71" radius={[4, 4, 0, 0]} name="Ingresos (C$)" />
                <Bar dataKey="Expenses" fill="#E74C3C" radius={[4, 4, 0, 0]} name="Gastos (C$)" />
              </BarChart>
            ) : (
              <div className="flex h-full items-center justify-center text-[#8C92AC] text-sm">No data available for chart</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Gráfico 2: Crecimiento de Patrimonio */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#EBEBEB]">
          <h2 className="text-lg font-bold text-[#11131F] mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-[#3498DB]" /> Ranch Valuation Growth (Net Worth)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            {ranchValuationGrowth.length > 0 ? (
              <LineChart data={ranchValuationGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fill: '#8C92AC', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8C92AC', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #EBEBEB' }} />
                <Line type="monotone" dataKey="Value" stroke="#3498DB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Valor Total (C$)" />
              </LineChart>
            ) : (
               <div className="flex h-full items-center justify-center text-[#8C92AC] text-sm">No data available for chart</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CONSOLIDADO DE TRANSACCIONES (DINÁMICO) */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#EBEBEB] overflow-hidden">
        <div className="p-6 border-b border-[#EBEBEB]">
          <h2 className="text-xl font-bold text-[#11131F]">Consolidated General Ledger</h2>
          <p className="text-xs text-[#8C92AC] mt-1">Combined history of events with economic impact.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F4F6F8] text-[#8C92AC] text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">Impact type</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {generalLedger.length > 0 ? (
                generalLedger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F9FAFB] transition-colors bg-white">
                    <td className="p-4 text-xs font-medium text-[#8C92AC]">
                      {new Date(tx.date).toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-[#11131F]">{tx.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded-lg w-fit border ${
                        tx.type === 'Ingreso' ? 'bg-green-50 text-green-600 border-green-200' :
                        tx.type === 'Egreso' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                      }`}>
                        {tx.type}
                      </div>
                    </td>
                    <td className={`p-4 text-right font-black text-sm ${
                      tx.type === 'Ingreso' ? 'text-green-600' : tx.type === 'Egreso' ? 'text-red-600' : 'text-orange-500'
                    }`}>
                      {tx.type === 'Ingreso' ? '+' : '-'} C$ {tx.amount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                 <tr>
                    <td colSpan="5" className="p-8 text-center text-[#8C92AC] text-sm">
                      No financial transactions recorded yet.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FinancesPage;