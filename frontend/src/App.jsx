import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar"; 
import LivestockDashboard from "./components/LivesStock";
import FeedingPage from "./components/Feeding";
import HealthPage from "./components/Healty";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0f111a] text-white">
        <Sidebar /> 

        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<div className="p-6">Nothing for now</div>} />
            <Route path="/livestock" element={<LivestockDashboard />} />
            <Route path="/feeding" element={<FeedingPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<div className="p-6">page not found</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;