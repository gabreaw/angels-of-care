import React from 'react';
import { Heart, Stethoscope, Baby, Accessibility } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: Heart,
      title: "Cuidado com Idosos",
      desc: "Auxílio na rotina, higiene, medicação e, principalmente, companhia para combater a solidão."
    },
    {
      icon: Stethoscope,
      title: "Pós-Operatório",
      desc: "Suporte profissional na recuperação em casa. Segurança para o paciente e descanso para a família."
    },
    {
      icon: Baby,
      title: "Gestantes e Crianças",
      desc: "Apoio especializado para mães e bebês, garantindo noites tranquilas e auxílio nos primeiros cuidados."
    },
    {
      icon: Accessibility,
      title: "Cuidados Especiais (PCDs)",
      desc: "Atendimento adaptado para pessoas com limitações de mobilidade, com respeito e técnica apurada."
    }
  ];

  return (
    <section id="servicos" className="py-20 px-4 sm:px-6 lg:px-8 bg-paper">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-primary mb-4">Cuidamos de quem você ama</h2>
          <p className="text-darkText/70 max-w-2xl mx-auto">Soluções completas para cada fase da vida.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-beige/50 group">
              <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <service.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl text-primary mb-3 font-serif font-bold">{service.title}</h3>
              <p className="text-darkText/80 leading-relaxed font-sans">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}