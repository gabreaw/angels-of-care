import React from "react";
import { Shield, UserCheck, Clock, MapPin } from "lucide-react";

export default function Trust() {
  const items = [
    {
      icon: Shield,
      title: "Excelência Técnica e Humana",
      desc: "Nossos anjos são avaliados não apenas pelo currículo, mas pela empatia, paciência e verdadeira vocação para cuidar.",
    },
    {
      icon: UserCheck,
      title: "Sintonia com a Família",
      desc: "Entendemos a personalidade de quem será cuidado para indicar um profissional que traga leveza e se adapte à rotina da casa.",
    },
    {
      icon: Clock,
      title: "Qualidade de Vida para Vocês",
      desc: "Nós cuidamos da rotina difícil para que vocês voltem a ter tempo de qualidade apenas para amar e dar carinho.",
    },
    {
      icon: MapPin,
      title: "Suporte Local e Presencial",
      desc: "Somos de Chapecó. Nossa proximidade garante agilidade e acompanhamento de perto sempre que você precisar.",
    },
  ];

  return (
    <section id="sobre" className="py-20 px-4 bg-primary text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-white mb-4">
            Muito mais que uma agência
          </h2>
          <p className="text-sage text-lg">
            Somos uma extensão da sua família.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <div key={index} className="text-center p-4">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
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
