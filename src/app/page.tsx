'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import BookingWizard from '@/components/client/BookingWizard';
import ServiceCatalogModal from '@/components/client/ServiceCatalogModal';
import LookupAppointmentModal from '@/components/client/LookupAppointmentModal';
import { useSalon } from '@/context/SalonContext';
import {
  Sparkles,
  ShieldCheck,
  Clock,
  Heart,
  MapPin,
  Phone,
  Lock,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { configuracion } = useSalon();
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [consultaAbierta, setConsultaAbierta] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      {/* Navegación */}
      <Navbar
        onOpenCatalog={() => setCatalogoAbierto(true)}
        onOpenLookup={() => setConsultaAbierta(true)}
      />

      {/* Hero Section Elegante */}
      <section className="relative overflow-hidden border-b border-[#E8DCCF] bg-radial from-[#FFF5F0] via-[#FAF6F0] to-[#F5ECE2] py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* Logo Agrandado */}
          <div className="mb-5 flex justify-center">
            <img
              src={configuracion.logoUrl || '/logo-pierina.png'}
              alt="Logo Pierina Salón"
              className="h-32 w-32 sm:h-44 sm:w-44 object-contain drop-shadow-2xl hover:scale-105 transition-transform"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1 text-xs font-bold text-[#B85D75] shadow-xs border border-[#ECD9CE] mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#E07A5F]" />
            Agenda tu cita en menos de 1 minuto
          </div>

          <h1 className="text-3xl font-serif font-extrabold tracking-tight text-[#2D2424] sm:text-5xl">
            {configuracion.nombreSalon}
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-base sm:text-lg text-[#6B5E59] leading-relaxed font-medium">
            {configuracion.eslogan}
          </p>

          {/* Insignias de confianza estilo Doctoralia */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[#5A4D48]">
            <span className="flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-1.5 border border-[#E6D7CB]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Disponibilidad en tiempo real
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-1.5 border border-[#E6D7CB]">
              <ShieldCheck className="h-4 w-4 text-[#B85D75]" />
              Sin registro ni contraseñas
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-1.5 border border-[#E6D7CB]">
              <Heart className="h-4 w-4 text-rose-500" />
              Atención 100% personalizada
            </span>
          </div>
        </div>
      </section>

      {/* Asistente de Reserva Principal */}
      <main className="flex-1 py-4 sm:py-8">
        <BookingWizard />
      </main>

      {/* Modales de Soporte */}
      <ServiceCatalogModal
        isOpen={catalogoAbierto}
        onClose={() => setCatalogoAbierto(false)}
      />

      <LookupAppointmentModal
        isOpen={consultaAbierta}
        onClose={() => setConsultaAbierta(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#E8DCCF] bg-white py-8 text-xs text-[#7A6B65]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-gold-gradient text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-[#2D2424]">
              {configuracion.nombreSalon}
            </span>
            <span>• © {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[#5A4D48]">
            <button
              onClick={() => setCatalogoAbierto(true)}
              className="hover:text-[#B85D75] transition"
            >
              Servicios y Tarifas
            </button>
            <button
              onClick={() => setConsultaAbierta(true)}
              className="hover:text-[#B85D75] transition"
            >
              Buscar mi Cita
            </button>
            <Link
              href="/admin"
              className="flex items-center gap-1 font-semibold text-[#B85D75] hover:underline"
            >
              <Lock className="h-3 w-3" />
              Acceso Colaboradoras
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
