'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Cita } from '@/types/salon';
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  CalendarPlus,
  ArrowLeft,
  X,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { getWhatsAppClientToSalonLink } from '@/lib/whatsapp';

interface AppointmentTrackerProps {
  citaId: string;
}

export default function AppointmentTracker({ citaId }: AppointmentTrackerProps) {
  const { citas, servicios, colaboradores, configuracion, actualizarEstadoCita } = useSalon();
  const [modalCancelar, setModalCancelar] = useState(false);
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  const cita = citas.find((c) => c.id === citaId);
  const colab = cita ? colaboradores.find((c) => c.id === (cita.colaboradorId || cita.terapeutaId)) : null;
  const serviciosCita = cita
    ? cita.servicioIds.map((id) => servicios.find((s) => s.id === id)).filter(Boolean)
    : [];

  if (!cita) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-3xl border border-[#E6D7CB] bg-white p-8 shadow-md">
          <AlertCircle className="mx-auto h-12 w-12 text-[#B85D75]" />
          <h2 className="mt-4 text-xl font-serif font-bold text-[#2D2424]">
            Cita no encontrada
          </h2>
          <p className="mt-2 text-xs text-[#7A6B65]">
            No pudimos encontrar una cita con este identificador. Por favor verifica el enlace o busca por tu código de reserva.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-6 py-2.5 text-xs font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const getGoogleCalendarUrl = () => {
    const [year, month, day] = cita.fecha.split('-');
    const [startH, startM] = cita.horaInicio.split(':');
    const [endH, endM] = cita.horaFin.split(':');

    const startDate = `${year}${month}${day}T${startH}${startM}00`;
    const endDate = `${year}${month}${day}T${endH}${endM}00`;

    const title = encodeURIComponent(`Cita en ${configuracion.nombreSalon}`);
    const details = encodeURIComponent(
      `Cita de belleza en ${configuracion.nombreSalon}.\nCódigo: ${cita.codigo}\nColaboradora: ${colab?.nombre || 'General'}`
    );
    const location = encodeURIComponent(configuracion.direccion);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = () => {
    const [year, month, day] = cita.fecha.split('-');
    const [startH, startM] = cita.horaInicio.split(':');
    const [endH, endM] = cita.horaFin.split(':');

    const startDate = `${year}${month}${day}T${startH}${startM}00`;
    const endDate = `${year}${month}${day}T${endH}${endM}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lumina Esthetique//Beauty App//ES',
      'BEGIN:VEVENT',
      `UID:${cita.id}@lumina.app`,
      `DTSTAMP:${startDate}Z`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:Cita - ${configuracion.nombreSalon}`,
      `DESCRIPTION:Cita confirmada. Código: ${cita.codigo}`,
      `LOCATION:${configuracion.direccion}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `cita-${cita.codigo}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelarCita = async () => {
    await actualizarEstadoCita(cita.id, 'Rechazada');
    setModalCancelar(false);
  };

  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7A70] hover:text-[#B85D75] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>

      <div className="rounded-3xl border-2 border-[#E6D7CB] bg-white p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EDE4] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C7A70]">
              Seguimiento en Vivo
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl font-serif font-bold text-[#2D2424]">
                Cita {cita.codigo}
              </h1>
              <span className="rounded-full bg-[#FAF0E6] px-2.5 py-0.5 text-xs font-bold text-[#8C5845]">
                {cita.clienteNombre}
              </span>
            </div>
          </div>

          <div>
            {cita.estado === 'Pendiente' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 animate-soft-pulse">
                <Clock className="h-3.5 w-3.5" />
                Pendiente de Aprobación
              </span>
            )}
            {cita.estado === 'Confirmada' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Confirmada con Éxito
              </span>
            )}
            {cita.estado === 'Rechazada' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300">
                <AlertCircle className="h-3.5 w-3.5" />
                Cancelada / No disponible
              </span>
            )}
            {cita.estado === 'Completada' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-800 border border-stone-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Servicio Completado
              </span>
            )}
          </div>
        </div>

        {/* Datos Detallados */}
        <div className="grid gap-4 sm:grid-cols-2 rounded-2xl bg-[#FAF6F0] p-5 border border-[#EFE7DE] text-xs">
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-[#B85D75] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#8C7A70] block">Fecha de la cita:</span>
                <span className="font-bold text-sm text-[#2D2424]">{cita.fecha}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-[#B85D75] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#8C7A70] block">Horario asignado:</span>
                <span className="font-bold text-sm text-[#2D2424]">
                  {cita.horaInicio} - {cita.horaFin} hrs ({cita.duracionTotalMin} min)
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-[#B85D75] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#8C7A70] block">Ubicación del salón:</span>
                <span className="font-medium text-[#2D2424]">{configuracion.direccion}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-[#E8DCCF] sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0">
            {colab && (
              <div className="flex items-center gap-3">
                {colab.foto ? (
                  <img
                    src={colab.foto}
                    alt={colab.nombre}
                    className="h-10 w-10 rounded-xl object-cover border border-[#E8DCCF]"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-gold-gradient text-white font-bold text-xs">
                    {obtenerIniciales(colab.nombre)}
                  </div>
                )}
                <div>
                  <span className="text-[#8C7A70] block">Colaboradora:</span>
                  <span className="font-bold text-[#2D2424]">{colab.nombre}</span>
                </div>
              </div>
            )}

            <div>
              <span className="text-[#8C7A70] block">Tratamientos:</span>
              <ul className="mt-1 space-y-1">
                {serviciosCita.map((s: any) => (
                  <li key={s.id} className="flex justify-between font-medium text-[#3D322E]">
                    <span>• {s.nombre}</span>
                    <span>{configuracion.moneda}{s.precio}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#E8DCCF] pt-2 flex justify-between font-bold text-[#2D2424] text-sm">
              <span>Total a pagar:</span>
              <span className="text-[#B85D75]">{configuracion.moneda}{cita.precioTotal}</span>
            </div>
          </div>
        </div>

        {/* Foto de Referencia de la Clienta */}
        {cita.fotoReferencia && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#FAF6F0] p-3 border border-[#EFE7DE]">
            <img
              src={cita.fotoReferencia}
              alt="Foto de referencia"
              onClick={() => setFotoModal(cita.fotoReferencia || null)}
              className="h-14 w-14 rounded-xl object-cover border border-[#E6D7CB] cursor-pointer hover:scale-105 transition"
            />
            <div className="text-xs">
              <span className="font-bold text-[#2D2424] block flex items-center gap-1">
                <ImageIcon className="h-4 w-4 text-[#B85D75]" />
                Foto de diseño o referencia adjuntada
              </span>
              <button
                type="button"
                onClick={() => setFotoModal(cita.fotoReferencia || null)}
                className="text-[11px] text-[#B85D75] hover:underline"
              >
                Toca para ampliar foto
              </button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3 pt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={getWhatsAppClientToSalonLink(cita, servicios, configuracion)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <MessageCircle className="h-4 w-4" />
              Chat WhatsApp con el Salón
            </a>

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#E6D7CB] bg-white px-4 py-3 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition shadow-xs"
            >
              <CalendarPlus className="h-4 w-4 text-[#B85D75]" />
              Añadir a Google Calendar
            </a>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={downloadIcsFile}
              className="text-xs text-[#8C7A70] hover:text-[#2D2424] underline"
            >
              Descargar recordatorio (.ics)
            </button>

            {cita.estado !== 'Rechazada' && cita.estado !== 'Completada' && (
              <button
                onClick={() => setModalCancelar(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium"
              >
                Cancelar Cita
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cancelar */}
      {modalCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#E6D7CB] text-center space-y-4">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
            <h3 className="text-base font-bold text-[#2D2424]">
              ¿Estás seguro de cancelar tu cita?
            </h3>
            <p className="text-xs text-[#7A6B65]">
              El espacio quedará liberado para otras clientas.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModalCancelar(false)}
                className="flex-1 rounded-xl border border-[#E6D7CB] bg-white py-2 text-xs font-semibold text-[#5A4D48]"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelarCita}
                className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Foto */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="relative max-w-lg rounded-2xl bg-white p-2 shadow-2xl">
            <img src={fotoModal} alt="Foto completa" className="max-h-[75vh] w-auto rounded-xl object-contain" />
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
