import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Swal from 'sweetalert2';
import logo from '../assets/logo2.png'

import {
  LayoutDashboard,
  Beef,
  Sprout,
  Stethoscope,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChartSpline,
  Boxes,
  DoorOpen,
  LogOut
} from "lucide-react";

import { cn } from "./ui/utils";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Livestock", path: "/livestock", icon: Beef },
  { name: "Feeding", path: "/feeding", icon: Sprout },
  { name: "Health", path: "/health", icon: Stethoscope },
  { name: "Production", path: "/production", icon: TrendingUp },
  { name: "Sales", path: "/sales", icon: DollarSign },
  { name: "Finances", path: "/finances", icon: ChartSpline, restrictTo: "Gerente" },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "OutFlow", path: "/outflow", icon: DoorOpen },
  { name: "Reports", path: "/reports", icon: BarChart3, restrictTo: "Gerente" },
  { name: "Settings", path: "/settings", icon: Settings, restrictTo: "Gerente" },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  const userRole = localStorage.getItem('rol') || 'Capataz';
  console.log("Rol actual:", userRole);
  
  const isManager = userRole === 'Gerente';

  const filteredMenuItems = menuItems.filter(item => {
    if (item.restrictTo) {
      return item.restrictTo === userRole;
    }
    return true; 
  });

  const handleLogout = () => {
    Swal.fire({
      title: '¿Log out?',
      text: "You will need to re-enter your credentials.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        // 🔥 CORRECCIÓN 2: Limpiar todo el localStorage correctamente
        localStorage.removeItem('access'); 
        localStorage.removeItem('rol');
        sessionStorage.clear(); // Por si quedó basura vieja
        window.location.href = '/login'; 
      }
    });
  };

  return (
    <aside
      className={cn(
        "bg-ganadero-sidebar h-screen sticky top-0 flex-shrink-0 z-50 flex flex-col text-gray-400 transition-all duration-300 ease-in-out border-r border-white/5",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "pt-10 pb-6 px-4 flex items-center justify-between text-white border-b border-white/5",
          isCollapsed && "justify-center px-0 pt-8",
        )}
      >
        {!isCollapsed && (
          <img src={logo} alt="Finca Baltodano" className="w-45 h-auto object-contain" />
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-ganadero-active transition-colors flex-shrink-0"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : ""}
              className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-ganadero-active text-black font-bold"
                  : "hover:bg-white/5 hover:text-white",
                isCollapsed && "justify-center space-x-0",
              )}
            >
              <Icon
                size={22}
                className={cn(
                  isActive
                    ? "text-black"
                    : "text-gray-400 group-hover:text-white",
                )}
              />

              {!isCollapsed && (
                <span className="text-sm overflow-hidden whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col gap-4">
        
        {/* Profile Info */}
        <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-ganadero-active flex-shrink-0 flex items-center justify-center text-black font-black">
            {isManager ? 'GE' : 'CA'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {isManager ? 'Management' : 'Farm foreman'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                {userRole}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar Sesión" : ""}
          className={cn(
            "w-full flex items-center gap-3 p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl font-bold transition-all",
            isCollapsed ? "justify-center" : "justify-start px-3"
          )}
        >
          <LogOut size={20} className={isCollapsed ? "" : "min-w-[20px]"} />
          {!isCollapsed && <span className="text-sm">Log out</span>}
        </button>

      </div>
    </aside>
  );
}