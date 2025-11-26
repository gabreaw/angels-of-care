import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '../../utils/whatsapp'; 

const FloatingWhatsApp = () => {
  const link = getWhatsAppLink("Olá! Preciso de atendimento para minha família.");

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 group"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={32} fill="white" className="text-white" />
      <span className="font-bold text-sm hidden md:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
        Fale Conosco
      </span>
      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
      </span>
    </a>
  );
};

export default FloatingWhatsApp;