import React from "react";
// 1. Adicionei Instagram e Facebook nas importações
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import logoImg from "../../assets/logo2.png";

export default function Footer() {
  return (
    <footer className="bg-[#2A332C] text-white py-16 px-4 border-t-4 border-beige">
      {/* Grid de 3 colunas */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-sm">
        {/* COLUNA 1: Logo e Sobre */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="Angels of Care Logo"
              className="h-32 object-contain"
            />
          </div>
          <p className="text-white/70 max-w-xs">
            Referência em Homecare no Oeste Catarinense, unindo tecnologia e
            humanização.
          </p>
        </div>

        {/* COLUNA 2: Contato */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-beige font-serif">Contato</h4>
          <ul className="space-y-3 text-white/80">
            <li className="flex gap-3 items-center">
              <Phone size={18} className="text-sage" /> (49) 98422-0162
            </li>
            <li className="flex gap-3 items-center">
              <Mail size={18} className="text-sage" />{" "}
              atendimento@angelsofcare.com.br
            </li>
            <li className="flex gap-3 items-center">
              <MapPin size={18} className="text-sage" /> Chapecó - SC
            </li>
          </ul>
        </div>

        {/* COLUNA 3: Redes Sociais (NOVA) */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-beige font-serif">Siga-nos</h4>
          <ul className="space-y-3 text-white/80">
            <li>
              <a
                href="https://www.instagram.com/angelsofcarexap/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 items-center hover:text-sage transition-colors"
              >
                <Instagram size={18} className="text-sage" /> Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/angelsofcarexap/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 items-center hover:text-sage transition-colors"
              >
                <Facebook size={18} className="text-sage" /> Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-xs">
        © {new Date().getFullYear()} Angels of Care. Todos os direitos
        reservados.
      </div>
    </footer>
  );
}
