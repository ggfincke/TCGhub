import React from "react";
import { Link } from "react-router-dom";

const navigationLinks = [
  { path: "/collection", label: "Collection" },
  { path: "/shopping", label: "Shopping" },
  { path: "/pricing", label: "Pricing" },
  { path: "/profile", label: "Profile" }
];

function Navbar() {
  return (
    <>
      <nav className="bg-gray-800 text-white fixed top-0 w-full shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold">
                TCGHub
              </Link>
            </div>

            {/* Navigation Links */}
            <ul className="hidden md:flex space-x-8">
              {navigationLinks.map(({ path, label }) => (
                <li key={path}>
                  <Link to={path} className="hover:text-blue-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="hidden md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className="block px-3 py-2 rounded-md text-base font-medium hover:text-blue-400 hover:bg-gray-700"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {/* spacer div to prevent content from being hidden under navbar */}
      <div className="h"></div>
    </>
  );
}

export default Navbar;
