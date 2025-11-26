import React from "react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Hero from "./sections/Hero";
import Services from "./sections/Services";
import Trust from "./sections/Trust";
import { MessageCircle } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-sans text-darkText">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Trust />
        <section className="py-20 px-4 text-center bg-white">
          <h2 className="text-3xl text-primary mb-6">Pronto para conversar?</h2>
          <a
            href="https://wa.me/5549999999999"
            target="_blank"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
