import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar"; 
import LivestockDashboard from "./components/LivesStock";
import FeedingPage from "./components/Feeding";
import HealthPage from "./components/Healty";
import ProductionPage from "./components/Production";
import SalesPage from "./components/Sales";
import OutflowPage from "./components/OutFlow";
import InventoryPage from "./components/inventory";
import Dashboard from "./components/dashboard";
import Login from "./components/Login";


const PrivateRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('access');
  const rol = localStorage.getItem('rol');


  if (!token) return <Navigate to="/login" />;
  
  
  if (allowedRoles && !allowedRoles.includes(rol)) return <Navigate to="/" />;
  

  return (
    <div className="flex min-h-screen bg-[#fff] text-black-700">
      <Sidebar /> 
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute allowedRoles={['Gerente', 'Capataz']} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/livestock" element={<LivestockDashboard />} />
          <Route path="/feeding" element={<FeedingPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/outflow" element={<OutflowPage />} />
          <Route path="/inventory" element={<InventoryPage /> } />
          <Route path="*" element={<div className="p-6">Page not found</div>} />
        </Route>

        {/* RUTAS EXCLUSIVAS (Solo Gerente) */}
        {/* Descomenta y agrega tus componentes cuando los crees */}
        {/* <Route element={<PrivateRoute allowedRoles={['Gerente']} />}>
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/finances" element={<FinancesPage />} />
        </Route>
        */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;