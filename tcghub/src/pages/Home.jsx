// src/pages/Home.jsx
import React from "react";

function Home() {
  return (
    <div className="text-center mt-8">
      <h1 className="text-4xl font-bold">Welcome to TCGHub</h1>
      <p className="mt-4 text-gray-700">
        Your ultimate trading card collection and management platform.
      </p>
      <div className="mt-6">
        <button className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">
          Explore Collections
        </button>
      </div>
    </div>
  );
}

export default Home;
