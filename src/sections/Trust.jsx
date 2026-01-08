import React from "react";
import { Shield, UserCheck, Smartphone, MapPin } from "lucide-react"; // Troquei Clock por Smartphone

export default function Trust() {
  const items = [
    {
      icon: Shield,
      title: "Segurança e Qualificação",
      desc: "Nossos anjos são avaliados não apenas pelo currículo, mas pela empatia, antecedentes e vocação real para cuidar.",
    },
    {
      icon: Smartphone, // Ícone do App
      title: "Transparência Total",
      desc: "Acompanhe horários de chegada, evolução do paciente e relatórios diários direto pelo Portal da Família no seu celular.",
    },
    {
      icon: UserCheck,
      title: "Sintonia com a Família",
      desc: "Entendemos a personalidade de quem será cuidado para indicar um profissional que traga leveza à casa.",
    },
    {
      icon: MapPin,
      title: "Suporte Local 24h",
      desc: "Somos de Chapecó. Nossa proximidade garante agilidade e acompanhamento de perto sempre que você precisar.",
    },
  ];

  return (
    <section id="sobre" className="py-20 px-4 bg-primary text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-white mb-4 font-serif font-bold">
            Muito mais que uma agência
          </h2>
          <p className="text-sage text-lg">
            Tecnologia e humanização trabalhando juntas pelo seu bem-estar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <div key={index} className="text-center p-4 group">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all">
                <item.icon className="w-10 h-10 text-beige" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-beige">
                {item.title}
              </h3>
              <p className="text-white/80 leading-relaxed text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
