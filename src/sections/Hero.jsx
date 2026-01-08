import React from "react";
import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import Header from "../assets/close-up-medico-segurando-paciente.jpg";
export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative bg-gradient-to-br from-sage/20 via-paper to-beige/30 py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm border border-beige">
              <Smartphone size={16} className="text-green-600" />
              Acompanhe tudo pelo nosso App exclusivo
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary leading-tight font-serif font-bold">
              Cuidado que conforta, presença que acolhe.
            </h1>
            <p className="text-lg text-darkText/80 font-sans leading-relaxed">
              Conectamos sua família a cuidadores qualificados e apaixonados.
              Tenha segurança total com nosso <strong>Portal da Família</strong>
              , onde você vê a evolução do paciente em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="https://wa.me/5549984220162"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary hover:bg-[#3A4A3E] text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:-translate-y-1 text-center"
              >
                Solicitar Orçamento
              </a>
              <Link
                to="/trabalhe-conosco"
                className="inline-block bg-white hover:bg-gray-50 text-primary border-2 border-primary/10 font-bold px-8 py-4 rounded-xl transition-all hover:shadow-md text-center"
              >
                Sou Cuidador(a)
              </Link>
            </div>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
            <img
              src={Header}
              alt="Cuidador com idoso em ambiente acolhedor"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
