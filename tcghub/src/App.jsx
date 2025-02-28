import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import CollectionManagement from "./pages/CollectionManagement";
import ShoppingPlatform from "./pages/ShoppingPlatform";
import UserProfile from "./pages/UserProfile";
import PriceTracking from "./pages/PriceTracking";

function App() {
  return (
    <Router>
      <Navbar />
      <main className="pt-20 px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<CollectionManagement />} />
          <Route path="/shopping" element={<ShoppingPlatform />} />
          <Route path="/pricing" element={<PriceTracking />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
