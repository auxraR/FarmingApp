import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { 
  TrendingUp, TrendingDown, CheckCircle, Droplets, Wallet, Beef, 
  Package, Star, Bell, BellRing, Sprout, MoreHorizontal, Check, Trash2 
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({
    activeLivestock: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    milkToday: 0,
    milkGrowth: 0,
    mvpCow: null,
    latestSale: null
  });
  
  const [alerts, setAlerts] = useState([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [prodRes, liveRes, salesRes, milkRes, feedRes, alertsRes] = await Promise.all([
        apiClient.get('/products/'),
        apiClient.get('/livestock/?estado=1'),
        apiClient.get('/sales/'),
        apiClient.get('/milk-production/'),
        apiClient.get('/feeding/'),
        apiClient.get('/alerts/') 
      ]);

      const products = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [];
      const livestock = Array.isArray(liveRes.data) ? liveRes.data : liveRes.data.results || [];
      const sales = Array.isArray(salesRes.data) ? salesRes.data : salesRes.data.results || [];
      const milkings = Array.isArray(milkRes.data) ? milkRes.data : milkRes.data.results || [];
      const feedings = Array.isArray(feedRes.data) ? feedRes.data : feedRes.data.results || [];
      let dbAlerts = Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data.results || [];
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const activeLivestock = livestock.length;

      // ================= CÁLCULOS (Ventas y Leche) =================
      let monthlyRevenue = 0, lastMonthRevenue = 0, latestSale = null;
      sales.forEach(sale => {
        const saleDate = new Date(sale.sale_date || sale.fecha || sale.created_at);
        const total = Number(sale.total || sale.monto || 0);
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) monthlyRevenue += total;
        else if (saleDate.getMonth() === currentMonth - 1 && saleDate.getFullYear() === currentYear) lastMonthRevenue += total;
        if (!latestSale || saleDate > new Date(latestSale.sale_date || latestSale.fecha || latestSale.created_at)) latestSale = sale;
      });
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      let milkToday = 0, milkYesterday = 0;
      const cowStats = {};
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      milkings.forEach(record => {
        const recordDateStr = (record.Fecha || record.date || record.created_at).split('T')[0];
        const litros = Number(record.liters_produced || record.Litros_Producidos || record.quantity || 0);
        if (recordDateStr === todayStr) milkToday += litros;
        if (recordDateStr === yesterdayStr) milkYesterday += litros;

        const recordDate = new Date(record.Fecha || record.date || record.created_at);
        if (recordDate >= sevenDaysAgo) {
          const animalId = record.animal || record.animal_id;
          if (!cowStats[animalId]) cowStats[animalId] = { total: 0, nombre: record.animal_nombre || `ID #${animalId}` };
          cowStats[animalId].total += litros;
        }
      });

      const milkGrowth = milkYesterday > 0 ? ((milkToday - milkYesterday) / milkYesterday) * 100 : 0;
      let mvpCow = null, maxLitros = 0;
      Object.keys(cowStats).forEach(id => {
        if (cowStats[id].total > maxLitros) {
          maxLitros = cowStats[id].total;
          mvpCow = { id, nombre: cowStats[id].nombre, litros: maxLitros };
        }
      });

      // ================= LÓGICA DE SINCRONIZACIÓN DE ALERTAS =================
      const createAlertIfMissing = async (uniqueId, type, text) => {
        if (!dbAlerts.some(a => a.identificador_unico === uniqueId)) {
          try {
            const res = await apiClient.post('/alerts/', {
              identificador_unico: uniqueId,
              tipo: type,
              texto: text,
              leida: false
            });
            dbAlerts = [res.data, ...dbAlerts]; // Agregamos al inicio del historial local
          } catch (e) {
            console.error("No se pudo crear la alerta", e);
          }
        }
      };

      // 1. Alerta de Leche
      if (milkToday === 0 && activeLivestock > 0) {
        await createAlertIfMissing(`milk-${todayStr}`, 'warning', "Today's milk production has not been registered yet.");
      }

      // 2. Alerta de Alimentación
      const fedToday = feedings.some(f => (f.Date || f.date || f.created_at || f.Fecha).split('T')[0] === todayStr);
      if (!fedToday) {
        await createAlertIfMissing(`feed-${todayStr}`, 'warning', "No feeding records found for the herds today.");
      }

      // 3. Alertas de Inventario
      const lowStockProducts = products.filter(p => p.categoria === 'Alimento' && Number(p.stock) < 30);
      for (const item of lowStockProducts) {
        // Usamos el ID del item y la fecha para avisar 1 vez por día si sigue bajo
        await createAlertIfMissing(`inv-${item.id}-${todayStr}`, 'error', `Low stock alert: ${item.nombre} (Only ${item.stock} ${item.unidad_medida} left).`);
      }

      setAlerts(dbAlerts);
      setData({ activeLivestock, monthlyRevenue, revenueGrowth, milkToday, milkGrowth, mvpCow, latestSale });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= ACCIONES DE LA BASE DE DATOS =================
  const unreadCount = alerts.filter(a => !a.leida).length;

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/alerts/${id}/`, { leida: true });
      setAlerts(alerts.map(a => a.id === id ? { ...a, leida: true } : a));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error marcando como leída", err);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await apiClient.patch(`/alerts/${id}/`, { estado: 0 }); // Borrado Lógico
      setAlerts(alerts.filter(a => a.id !== id));
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error borrando alerta", err);
    }
  };

  // Asignamos el ícono basado en el ID único
  const getAlertIcon = (idUnico) => {
    if (idUnico.startsWith('milk')) return Droplets;
    if (idUnico.startsWith('feed')) return Sprout;
    if (idUnico.startsWith('inv')) return Package;
    return Bell;
  };

  if (loading) return <div className="p-8 font-bold text-[#8C92AC]">Loading Dashboard...</div>;

  const userRole = sessionStorage.getItem('rol') || localStorage.getItem('rol');
  const isManager = userRole === 'Gerente';

  return (
    <div className="flex-1 bg-[#F4F6F8] min-h-screen p-8 mt-[0px] relative">
      
      <div className="absolute top-0 right-0 z-50">
        <button 
          onClick={() => {
            setIsAlertOpen(!isAlertOpen);
            if (isAlertOpen) setOpenMenuId(null); 
          }} 
          className="relative p-3 bg-white rounded-full shadow-lg hover:bg-stone-50 transition-all focus:outline-none"
        >
          <Bell size={30} className="text-stone-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {isAlertOpen && (
          <div className="absolute top-14 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden transform origin-top-right transition-all">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
              <h3 className="font-black text-stone-800 flex items-center gap-2 text-base">
                 <img 
        src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWdtYmpvMXFiZmx5cWlkZ3c2cmdiMXJiMmswd3N3ZTlyZXg2b2hyNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/FsnxuzuumxhBwX61bW/giphy.gif" 
        alt="Cool Sticker" 
        style={{ width: '50px', height: 'auto' }} 
      />Notifications
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                {unreadCount} New
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {alerts.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center text-stone-400">
                  <CheckCircle size={36} className="mb-3 opacity-50 text-green-500" />
                  <p className="text-base font-bold text-stone-600">You're all caught up!</p>
                  <p className="text-xs font-medium mt-1">No new alerts to show.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {alerts.map(alert => {
                    const Icono = getAlertIcon(alert.identificador_unico);
                    return (
                    <div 
                      key={alert.id} 
                      className={`p-4 flex gap-4 transition-colors relative ${alert.leida ? 'bg-white hover:bg-stone-50' : 'bg-blue-50/40 hover:bg-blue-50/70'}`}
                    >
                      <div className={`p-3 rounded-full h-fit flex-shrink-0 ${alert.tipo === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <Icono size={20} strokeWidth={2.5} />
                      </div>
                      
                      <div className="flex-1 pr-6">
                        <p className={`text-sm leading-snug ${alert.leida ? 'text-stone-500 font-medium' : 'text-stone-900 font-black'}`}>
                          {alert.texto}
                        </p>
                        <p className={`text-[10px] font-bold mt-1 ${alert.leida ? 'text-stone-400' : 'text-blue-500'}`}>
                          {new Date(alert.fecha_creacion).toLocaleDateString()}
                        </p>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === alert.id ? null : alert.id);
                        }} 
                        className={`absolute right-4 top-4 p-1.5 rounded-full transition-colors ${openMenuId === alert.id ? 'bg-stone-200 text-stone-800' : 'hover:bg-stone-200 text-stone-400'}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === alert.id && (
                        <div className="absolute right-8 top-10 w-40 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden z-50">
                          {!alert.leida && (
                            <button 
                              onClick={() => handleMarkAsRead(alert.id)} 
                              className="w-full text-left px-4 py-3 text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-2 border-b border-stone-100"
                            >
                              <Check size={14}/> Mark as read
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteAlert(alert.id)} 
                            className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14}/> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. HERO BANNER */}
      <div className="bg-[#11131F] rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl mt-4">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-[#8C92AC] font-bold tracking-widest text-sm uppercase mb-1">General Overview</p>
            <h1 className="text-3xl font-black">Finca Flor de María</h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            {[...Array(10)].map((_, i) => (
               <img 
                 key={i}
                 src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2hyenN6YXlybTV5eWhwbGw0dXJzaGRkOXQ5MmlmaHZhNmZmbG0waiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/d7qKEzn4pokvIZoNq9/giphy.gif" 
                 alt="Cool Sticker" 
                 style={{ width: '70px', height: 'auto' }} 
               />
            ))}
          </div>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col hover:shadow-md transition-shadow">
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
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col hover:shadow-md transition-shadow">
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
        
        <div className="bg-white p-6 rounded-3xl border border-[#EBEBEB] shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-[#8C92AC] uppercase tracking-wider flex items-center gap-2 mb-2">
            <Beef size={16} /> Active Livestock
          </p>
          <h3 className="text-4xl font-black text-[#11131F]">{data.activeLivestock} <span className="text-lg font-medium text-gray-500">Heads</span></h3>
          <p className="text-[10px] font-bold text-[#8C92AC] mt-auto pt-4 flex items-center gap-1">
            <CheckCircle size={12} /> Currently producing
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-3xl border border-yellow-200 shadow-sm flex flex-col relative overflow-hidden hover:shadow-md transition-shadow">
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

    </div>
  );
}