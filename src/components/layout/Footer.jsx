import React from "react";
import { Phone, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2A332C] text-white py-16 px-4 border-t-4 border-beige">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-beige" />
            <span className="font-serif text-2xl text-beige font-bold">
              Angels of Care
            </span>
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
              <Phone size={18} className="text-sage" /> (49) 99999-9999
            </li>
            <li className="flex gap-3 items-center">
              <Mail size={18} className="text-sage" /> contato@angels.com
            </li>
            <li className="flex gap-3 items-center">
              <MapPin size={18} className="text-sage" /> Chapecó - SC
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-beige font-serif">Legal</h4>
          <ul className="space-y-2 text-white/60">
            <li>
              <a href="#" className="hover:text-beige">
                Política de Privacidade
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-beige">
                Termos de Uso
              </a>
            </li>
          </ul>
          <p className="pt-4 text-xs text-white/40">© 2025 Angels of Care.</p>
        </div>
      </div>
    </footer>
  );
}
