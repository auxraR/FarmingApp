import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Droplets, Wallet, Beef, Package, Star } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8">
      
      {/* 1. HERO BANNER */}
      <div className="bg-[#11131F] rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
        {/* Un círculo decorativo de fondo */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-[#8C92AC] font-bold tracking-widest text-sm uppercase mb-1">General Overview</p>
            <h1 className="text-3xl font-black">Baltodano Farm Operations</h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2">
              <Package size={18} /> Quick Restock
            </button>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/30 flex items-center gap-2">
              <Droplets size={18} /> New Milking
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI CARDS (Las 4 Cartillas Blancas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Milk */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Droplets size={16} /> Today's Milk
          </p>
          <h3 className="text-4xl font-black text-[#11131F]">145 <span className="text-lg font-medium text-gray-500">Liters</span></h3>
          <p className="text-[10px] font-bold text-green-600 mt-auto pt-4 flex items-center gap-1">
            <TrendingUp size={12} /> 12% more than yesterday
          </p>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Wallet size={16} /> Monthly Revenue
          </p>
          <h3 className="text-4xl font-black text-[#11131F]"><span className="text-lg font-medium text-gray-500 mr-1">C$</span>42.5k</h3>
          <p className="text-[10px] font-bold text-green-600 mt-auto pt-4 flex items-center gap-1">
            <TrendingUp size={12} /> 5.2% market growth
          </p>
        </div>

        {/* Card 3: Active Livestock */}
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Beef size={16} /> Active Livestock
          </p>
          <h3 className="text-4xl font-black text-[#11131F]">38 <span className="text-lg font-medium text-gray-500">Heads</span></h3>
          <p className="text-[10px] font-bold text-[#8C92AC] mt-auto pt-4 flex items-center gap-1">
            <TrendingUp size={12} /> 2 calves born this month
          </p>
        </div>

        {/* Card 4: Fun Stat (MVP Cow) */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-3xl border border-yellow-200 shadow-sm flex flex-col relative overflow-hidden">
          <Star className="absolute top-4 right-4 text-yellow-300 opacity-50" size={64} />
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-2 mb-2 relative z-10">
            MVP Cow of the Week
          </p>
          <h3 className="text-3xl font-black text-yellow-900 relative z-10">"La Pinto"</h3>
          <p className="text-sm font-bold text-yellow-800 relative z-10">Tag #042</p>
          <p className="text-[10px] font-black text-yellow-700 mt-auto pt-4 bg-yellow-200/50 w-fit px-2 py-1 rounded-lg relative z-10">
            🥇 Produced 84 Liters
          </p>
        </div>
      </div>

      {/* 3. LIVE ALERTS & STATS */}
      <h2 className="text-lg font-bold text-[#11131F] mb-4">Live System Alerts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Alerta Crítica (Roja) */}
        <div className="bg-red-500 rounded-3xl p-6 text-white shadow-lg shadow-red-500/20 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-1 rounded-lg">Critical</span>
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight">Low Feed Stock</h4>
            <p className="text-xs text-red-100 mt-1">Concentrado 18% is down to 15 Kg.</p>
          </div>
        </div>

        {/* Estado Todo Bien (Blanco/Verde) */}
        <div className="bg-white rounded-3xl p-6 border border-[#EBEBEB] flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#11131F] text-lg leading-tight">Health Status OK</h4>
            <p className="text-xs text-[#8C92AC] mt-1">No pending vaccines for this week.</p>
          </div>
        </div>

        {/* Estado de Ventas (Blanco/Azul) */}
        <div className="bg-white rounded-3xl p-6 border border-[#EBEBEB] flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Wallet size={24} />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#11131F] text-lg leading-tight">Recent Sales</h4>
            <p className="text-xs text-[#8C92AC] mt-1">Last transaction: C$ 2,400 (3 hours ago).</p>
          </div>
        </div>

      </div>
    </div>
  );
}