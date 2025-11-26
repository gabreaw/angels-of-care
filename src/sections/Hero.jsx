import React from "react";
import { Star } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative bg-gradient-to-br from-sage/20 via-paper to-beige/30 py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-tight">
              Cuidado que conforta, <br />
              presença que acolhe.
            </h1>
            <p className="text-lg text-darkText/80 font-sans leading-relaxed">
              Conectamos sua família a cuidadores qualificados e apaixonados
              pelo que fazem. Assistência profissional para idosos,
              pós-operatório e gestantes com o carinho que eles merecem.
            </p>

            <div className="space-y-4 pt-4">
              <a
                href="https://wa.me/5549984220162"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary hover:bg-[#3A4A3E] text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-1"
              >
                Solicitar Orçamento Gratuito
              </a>
            </div>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
            <img
              src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1080&auto=format&fit=crop"
              alt="Cuidador com idoso em ambiente acolhedor"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
