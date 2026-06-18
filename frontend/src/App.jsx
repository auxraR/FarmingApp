import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
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
import SettingsPage from "./components/Settings";
import FinancesPage from "./components/Finances";
import ReportsPage from "./components/Reports";
import { ChatBotFinca } from "./components/ChatBot";
import ChatBubble from "./components/chat";
import AnimalProfilePage from "./components/Qrprofile";

const PrivateRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('access');
  const rol = localStorage.getItem('rol');
  const location = useLocation(); 

  // Si no hay token, lo mandamos al login
  if (!token) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(rol)) return <Navigate to="/" />;
  
  const isProfilePage = location.pathname.startsWith('/animal-ficha');

  return (
    <div className="flex min-h-screen bg-[#fff] text-black-700">
      {!isProfilePage && <Sidebar />}
      {!isProfilePage && <ChatBubble/>}
      
      <main className={`flex-1 overflow-y-auto ${isProfilePage ? '' : 'p-8'}`}>
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
          <Route path="/settings" element= {<SettingsPage />} />
          <Route path="/finances" element= {<FinancesPage />} />
          <Route path="/reports" element= {<ReportsPage />} />
          <Route path="/chat" element= {<ChatBotFinca />} />
          
          {/* Tu ruta de la ficha (Protegida para que no entre cualquier persona de afuera) */}
          <Route path="/animal-ficha/:id" element={<AnimalProfilePage />} />
        </Route>

        {/* RUTAS EXCLUSIVAS (Solo Gerente) */}
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