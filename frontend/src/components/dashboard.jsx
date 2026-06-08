import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Droplets, Wallet, Beef, Package, Star } from 'lucide-react';
import ProductionPage from './Production';
import { GiphyFetch } from '@giphy/js-fetch-api';


export default function Dashboard() {
  const [data, setData] = useState({
    activeLivestock: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    milkToday: 0,
    milkGrowth: 0,
    mvpCow: null,
    lowStockAlerts: [],
    latestSale: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [prodRes, liveRes, salesRes, milkRes] = await Promise.all([
        apiClient.get('/products/'),
        apiClient.get('/livestock/?estado=1'),
        apiClient.get('/sales/'),
        apiClient.get('/milk-production/'),
      ]);

      const products = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [];
      const livestock = Array.isArray(liveRes.data) ? liveRes.data : liveRes.data.results || [];
      const sales = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.results || [];
      const milkings = Array.isArray(milkRes.data) ? milkRes.data : milkRes.data.results || [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

    
      const activeLivestock = livestock.length;

   
      const lowStockAlerts = products.filter(p => p.categoria === 'Alimento' && Number(p.stock) < 30);

      let monthlyRevenue = 0;
      let lastMonthRevenue = 0;
      let latestSale = null;

      sales.forEach(sale => {
        const rawDate = sale.sale_date || sale.fecha || sale.created_at;
        if (!rawDate) return; 

        const saleDate = new Date(rawDate);
        const total = Number(sale.total || sale.monto || 0);

        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          monthlyRevenue += total;
        } else if (saleDate.getMonth() === currentMonth - 1 && saleDate.getFullYear() === currentYear) {
          lastMonthRevenue += total;
        }

        if (!latestSale || saleDate > new Date(latestSale.sale_date || latestSale.fecha || latestSale.created_at)) {
          latestSale = sale;
        }
      });

      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      let milkToday = 0;
      let milkYesterday = 0;
      const cowStats = {};
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      milkings.forEach(record => {
        const rawDate = record.Fecha || record.date || record.created_at;
        if (!rawDate) return;

        const recordDateStr = rawDate.split('T')[0];
        const recordDate = new Date(rawDate);
        const litros = Number(record.liters_produced || record.Litros_Producidos || record.quantity || 0);

        if (recordDateStr === todayStr) milkToday += litros;
        if (recordDateStr === yesterdayStr) milkYesterday += litros;

        if (recordDate >= sevenDaysAgo) {
          const animalId = record.animal || record.animal_id;
          if (!cowStats[animalId]) cowStats[animalId] = { total: 0, nombre: record.animal_nombre || `ID #${animalId}` };
          cowStats[animalId].total += litros;
        }
      });

      const milkGrowth = milkYesterday > 0 ? ((milkToday - milkYesterday) / milkYesterday) * 100 : 0;

      let mvpCow = null;
      let maxLitros = 0;
      Object.keys(cowStats).forEach(id => {
        if (cowStats[id].total > maxLitros) {
          maxLitros = cowStats[id].total;
          mvpCow = { id, nombre: cowStats[id].nombre, litros: maxLitros };
        }
      });

      setData({
        activeLivestock,
        monthlyRevenue,
        revenueGrowth,
        milkToday,
        milkGrowth,
        mvpCow,
        lowStockAlerts,
        latestSale
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-[#8C92AC]">Loading Dashboard...</div>;

  const userRole = localStorage.getItem('rol');
  const isManager = userRole === 'Gerente';
  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[0px]">
      
      {/* 1. HERO BANNER */}
      <div className="bg-[#11131F] rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-[#8C92AC] font-bold tracking-widest text-sm uppercase mb-1">General Overview</p>
            <h1 className="text-3xl font-black">Finca Flor de María</h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            {/*Button to redirect to production page */}
           <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
         <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
          </div>
           <img 
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '70px', height: 'auto' }} />
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Droplets size={16} /> Today's Milk
          </p>
          <h3 className="text-4xl font-black text-[#11131F]">{data.milkToday.toFixed(1)} <span className="text-lg font-medium text-gray-500">Liters</span></h3>
          <p className={`text-[10px] font-bold mt-auto pt-4 flex items-center gap-1 ${data.milkGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.milkGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 
            {Math.abs(data.milkGrowth).toFixed(1)}% vs yesterday
          </p>
        </div>

        {isManager && (
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Wallet size={16} /> Monthly Revenue
          </p>
          <h3 className="text-4xl font-black text-[#11131F]"><span className="text-lg font-medium text-gray-500 mr-1">C$</span>{data.monthlyRevenue.toFixed(2)}</h3>
          <p className={`text-[10px] font-bold mt-auto pt-4 flex items-center gap-1 ${data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.revenueGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} 
            {Math.abs(data.revenueGrowth).toFixed(1)}% vs last month
          </p>
        </div>
        )}
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Beef size={16} /> Active Livestock
          </p>
          <h3 className="text-4xl font-black text-[#11131F]">{data.activeLivestock} <span className="text-lg font-medium text-gray-500">Heads</span></h3>
          <p className="text-[10px] font-bold text-[#8C92AC] mt-auto pt-4 flex items-center gap-1">
            <CheckCircle size={12} /> Currently producing
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-3xl border border-yellow-200 shadow-sm flex flex-col relative overflow-hidden">
          <Star className="absolute top-4 right-4 text-yellow-300 opacity-50" size={64} />
          <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-2 mb-2 relative z-10">
            MVP Cow (Last 7 Days)
          </p>
          {data.mvpCow ? (
            <>
              <h3 className="text-2xl font-black text-yellow-900 relative z-10 truncate">{data.mvpCow.nombre}</h3>
              <p className="text-[10px] font-black text-yellow-700 mt-auto pt-4 bg-yellow-200/50 w-fit px-2 py-1 rounded-lg relative z-10">
                🥇 Produced {data.mvpCow.litros.toFixed(1)} Liters
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-yellow-800 relative z-10 mt-2">No data available yet</p>
          )}
        </div>
      </div>

      {/* 3. LIVE ALERTS & STATS */}
      <h2 className="text-lg font-bold text-[#11131F] mb-4">Live System Alerts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {data.lowStockAlerts.length > 0 ? (
          <div className="bg-red-500 rounded-3xl p-6 text-white shadow-lg shadow-red-500/20 flex flex-col justify-between h-40 overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="bg-white/20 p-2 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-1 rounded-lg">Critical</span>
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight">Low Feed Stock</h4>
              <p className="text-xs text-red-100 mt-1 truncate">
                {data.lowStockAlerts[0].nombre} down to {data.lowStockAlerts[0].stock} {data.lowStockAlerts[0].unidad_medida}.
                {data.lowStockAlerts.length > 1 && ` (+${data.lowStockAlerts.length - 1} more)`}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-[#EBEBEB] flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <Package size={24} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[#11131F] text-lg leading-tight">Inventory OK</h4>
              <p className="text-xs text-[#8C92AC] mt-1">All feed products have sufficient stock.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-[#EBEBEB] flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
            <div className="bg-green-100 p-2 rounded-xl text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#11131F] text-lg leading-tight">Health Status OK</h4>
            <p className="text-xs text-[#8C92AC] mt-1">Pending health module integration.</p>
          </div>
        </div>
        {isManager && (
        <div className="bg-white rounded-3xl p-6 border border-[#EBEBEB] flex flex-col justify-between h-40">
           <div className="flex justify-between items-start">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Wallet size={24} />
            </div>
          </div>
          <div>
            <h4 className="font-bold text-[#11131F] text-lg leading-tight">Recent Sales</h4>
            <p className="text-xs text-[#8C92AC] mt-1">
              {data.latestSale ? `Last transaction: C$ ${Number(data.latestSale.total).toFixed(2)}` : 'No recent sales recorded.'}
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}