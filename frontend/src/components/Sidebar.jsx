import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "./ui/utils";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Livestock", path: "/livestock", icon: Beef },
  { name: "Feeding", path: "/feeding", icon: Sprout },
  { name: "Health", path: "/health", icon: Stethoscope },
  { name: "Production", path: "/production", icon: TrendingUp },
  { name: "Finances", path: "/finances", icon: DollarSign },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "bg-ganadero-sidebar h-screen flex flex-col text-gray-400 transition-all duration-300 ease-in-out border-r border-white/5",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "p-6 flex items-center justify-between text-white",
          isCollapsed && "justify-center px-0",
        )}
      >
        {!isCollapsed && (
          <h1 className="text-xl font-bold tracking-tight">BaltoFarm</h1>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-ganadero-active transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 mt-4">
        {menuItems.map((item) => {
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

      {/* User Profile Section */}
      <div
        className={cn(
          "p-4 border-t border-white/5 bg-black/20",
          isCollapsed && "flex justify-center",
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-ganadero-active flex-shrink-0 flex items-center justify-center text-black font-black">
            CB
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Carles B.</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Admin
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
