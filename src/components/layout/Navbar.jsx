import React, { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "../../assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Início", path: "/" },
    { name: "Serviços", path: "/#servicos" }, 
    { name: "Sobre Nós", path: "/#sobre" },
    { name: "Trabalhe Conosco", path: "/trabalhe-conosco" }, 
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-paper border-b border-beige/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            to="/"
            className="flex items-center gap-3 flex-shrink-0 cursor-pointer"
          >
            <img
              src={logoImg}
              alt="Angels of Care Logo"
              className="h-24 w-auto object-contain"
            />
            <span className="font-serif text-primary font-bold text-xl whitespace-nowrap hidden sm:block">
              Angels of Care
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`font-medium transition-colors font-sans text-sm tracking-wide ${
                  item.name === "Trabalhe Conosco"
                    ? "text-primary font-bold bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20"
                    : "text-darkText hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex flex-shrink-0">
            <a
              href="https://wa.me/5549984220162"
              target="_blank"
              rel="noreferrer"
              className="bg-primary hover:bg-[#3A4A3E] text-white px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
            >
              <Phone size={18} />
              <span>Fale Conosco</span>
            </a>
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary p-2 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-paper border-t border-beige absolute w-full left-0 shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                  item.name === "Trabalhe Conosco"
                    ? "text-primary bg-primary/10 font-bold"
                    : "text-darkText hover:text-primary hover:bg-sage/10"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://wa.me/5549984220162"
              target="_blank"
              rel="noreferrer"
              className="w-full mt-4 bg-primary text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              Fale Conosco
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
