import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Wallet, PieChart, ArrowUpRight, ArrowDownRight, Calendar, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

const FinancesPage = () => {
  const [financeData, setFinanceData] = useState({
    kpi: { patrimonio: 0, ingresos: 0, gastos: 0, neto: 0 },
    cashFlowTrends: [],
    ranchValuationGrowth: [],
    generalLedger: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const response = await apiClient.get('/finances/');
        setFinanceData(response.data);
      } catch (error) {
        console.error("Error loading finances:", error);
        Swal.fire({
          title: 'Connection Error',
          text: 'Could not load financial data from the server.',
          icon: 'error',
          confirmButtonColor: '#2563EB'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-[#F5F4F0] min-h-screen p-8 text-center mt-20">
        <p className="text-green-900 font-black animate-pulse text-lg">Calculating financial statements...</p>
      </div>
    );
  }

  const { kpi, cashFlowTrends, ranchValuationGrowth, generalLedger } = financeData;

  return (
    <div className="flex-1 bg-[#F5F4F0] min-h-screen p-4 text-stone-800">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 flex items-center gap-3">
          Financial Management
          </h1>
          <p className="text-sm text-amber-900 font-semibold mt-1"></p>
        </div>
        <button 
          onClick={() => Swal.fire({title: 'Coming Soon!', text: 'Export to PDF/Excel will be available in the next update.', icon: 'info', confirmButtonColor: '#2563EB'})}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
        >
          <FileText size={18} strokeWidth={2.5} /> Export Statement
        </button>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Assets */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <PieChart className="text-blue-600" size={24} />
            <span className="text-[10px] font-black text-blue-700 px-3 py-1 bg-blue-50 rounded-lg uppercase tracking-widest border border-blue-100">Total Assets</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Estimated Net Worth</p>
          <p className="text-3xl font-black text-stone-800 mt-1">C$ {kpi.patrimonio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-stone-400 mt-2 font-bold">* Includes livestock market value & inventory</p>
        </div>

        {/* Gross Income */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <ArrowUpRight className="text-green-600" size={24} />
            <span className="text-[10px] font-black text-green-700 px-3 py-1 bg-green-50 rounded-lg uppercase tracking-widest border border-green-100">Gross Income</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Period Revenue</p>
          <p className="text-3xl font-black text-green-600 mt-1">C$ {kpi.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-stone-400 mt-2 font-bold">From milk sales & cattle trade</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <ArrowDownRight className="text-red-500" size={24} />
            <span className="text-[10px] font-black text-red-700 px-3 py-1 bg-red-50 rounded-lg uppercase tracking-widest border border-red-100">Expenses</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Operating Costs</p>
          <p className="text-3xl font-black text-red-500 mt-1">C$ {kpi.gastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-stone-400 mt-2 font-bold">From feed, health & logistics</p>
        </div>

        {/* Available Cash / Liquidity */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="text-amber-600" size={24} />
            <span className="text-[10px] font-black text-amber-700 px-3 py-1 bg-amber-50 rounded-lg uppercase tracking-widest border border-amber-100">Available Cash</span>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Cash Balance</p>
          <p className={`text-3xl font-black mt-1 ${kpi.neto < 0 ? 'text-red-600' : 'text-stone-800'}`}>
            C$ {kpi.neto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-[10px] font-black mt-2 flex items-center gap-1 ${kpi.neto >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {kpi.neto >= 0 ? '▲ Positive liquidity' : '▼ Negative liquidity'}
          </p>
        </div>
      </div>

      {/* 3. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Chart 1: Income vs Expenses */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200">
          <h2 className="text-xl font-black text-green-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" /> Monthly Cash Flow Trends
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            {cashFlowTrends.length > 0 ? (
              <BarChart data={cashFlowTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="month" tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E7E5E4', fontWeight: 'bold' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1C1917' }} />
                <Bar dataKey="Income" fill="#16A34A" radius={[4, 4, 0, 0]} name="Income (C$)" />
                <Bar dataKey="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} name="Expenses (C$)" />
              </BarChart>
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400 font-bold text-sm">No data available for chart</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Net Worth Growth */}
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200">
          <h2 className="text-xl font-black text-green-900 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" /> Ranch Valuation Growth
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            {ranchValuationGrowth.length > 0 ? (
              <LineChart data={ranchValuationGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="month" tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#78716C', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E7E5E4', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="Value" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#2563EB' }} name="Total Value (C$)" />
              </LineChart>
            ) : (
               <div className="flex h-full items-center justify-center text-stone-400 font-bold text-sm">No data available for chart</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. CONSOLIDATED LEDGER */}
      <div className="bg-white rounded-3xl shadow-lg shadow-stone-500/5 border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 bg-[#FAF8F5]">
          <h2 className="text-2xl font-black text-green-900">Consolidated General Ledger</h2>
          <p className="text-sm font-semibold text-stone-500 mt-1">Combined history of events with economic impact.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F5] text-amber-900 text-[10px] uppercase font-black tracking-widest border-b border-stone-200">
              <tr>
                <th className="p-5 pl-6">Date</th>
                <th className="p-5">Description</th>
                <th className="p-5">Category</th>
                <th className="p-5">Impact Type</th>
                <th className="p-5 text-right pr-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {generalLedger.length > 0 ? (
                generalLedger.map((tx) => {
                  // Translation mapping for UI
                  const impactTypeStr = tx.type === 'Ingreso' ? 'Income' : tx.type === 'Egreso' ? 'Expense' : tx.type;

                  return (
                    <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-5 pl-6 text-xs font-bold text-stone-500">
                        {new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-5">
                        <p className="text-sm font-black text-stone-800">{tx.description}</p>
                      </td>
                      <td className="p-5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className={`flex items-center justify-center gap-1 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg w-fit border ${
                          tx.type === 'Ingreso' ? 'bg-green-50 text-green-700 border-green-200' :
                          tx.type === 'Egreso' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {impactTypeStr}
                        </div>
                      </td>
                      <td className={`p-5 pr-6 text-right font-black text-sm ${
                        tx.type === 'Ingreso' ? 'text-green-700' : tx.type === 'Egreso' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {tx.type === 'Ingreso' ? '+' : '-'} C$ {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                 <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <span className="text-4xl mb-4 block">🧾</span>
                      <h3 className="text-lg font-black text-green-900">No transactions yet</h3>
                      <p className="text-sm font-semibold text-stone-500 mt-1">Financial records will appear here automatically.</p>
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