import React from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../sections/Hero";
import Services from "../sections/Services";
import Trust from "../sections/Trust";
import FloatingWhatsApp from "../components/ui/FloatingWhatsApp";
import { Link } from "react-router-dom"; // Importar Link
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper font-sans text-darkText">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Trust />

        {/* Seção de Contato para FAMÍLIAS */}
        <section className="py-20 px-4 text-center bg-white">
          <h2 className="text-3xl text-primary font-bold font-serif mb-6">
            Pronto para conversar?
          </h2>
          <p className="text-gray-500 mb-8">
            Nossa equipe está pronta para entender sua necessidade.
          </p>
          <a
            href="https://wa.me/5549984220162"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg hover:-translate-y-1"
          >
            Chamar no WhatsApp
          </a>
        </section>
        <section className="py-16 px-4 bg-sage/10 text-center border-t border-sage/20">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-3">
              Você é cuidador ou da área de saúde?
            </h3>
            <p className="text-gray-600 mb-6">
              Estamos sempre buscando pessoas especiais para nossa equipe.
            </p>
            <Link
              to="/trabalhe-conosco"
              className="inline-flex items-center gap-2 text-primary font-bold hover:text-green-700 hover:underline transition-all"
            >
              Cadastre seu currículo aqui <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
