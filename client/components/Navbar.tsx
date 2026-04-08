import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "home", path: "/" },
    { label: "about", path: "/about" },
    { label: "accessibility", path: "/accessibility" },
  ];

  return (
    <nav className="w-full px-6 md:px-16 py-8 flex items-center justify-between relative">
      {/* Logo */}
      <Link
        to="/"
        className="font-outfit font-bold text-3xl md:text-4xl uppercase tracking-wide text-black z-10"
      >
        detectify
      </Link>

      {/* Desktop Nav Pill */}
      <div className="hidden md:flex items-center border border-forest rounded-full px-1 py-1 gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`font-inter text-lg px-5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-forest text-white"
                  : "text-forest hover:bg-forest/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 z-10"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span
          className={`block w-6 h-0.5 bg-forest transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
        />
        <span
          className={`block w-6 h-0.5 bg-forest transition-opacity ${menuOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`block w-6 h-0.5 bg-forest transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
        />
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl mx-4 mt-2 p-4 flex flex-col gap-2 z-20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`font-inter text-lg px-4 py-2 rounded-full transition-colors ${
                  isActive
                    ? "bg-forest text-white"
                    : "text-forest hover:bg-forest/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
