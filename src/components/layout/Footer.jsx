import React from "react";
import { Phone, Mail, MapPin, Heart } from "lucide-react";
import logoImg from "../../assets/logo2.png";

export default function Footer() {
  return (
    <footer className="bg-[#2A332C] text-white py-16 px-4 border-t-4 border-beige">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-sm">
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
      </div>
    </footer>
  );
}
