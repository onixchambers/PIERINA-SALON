'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Cita } from '@/types/salon';
import {
  X,
  Check,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  Inbox,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { getWhatsAppConfirmationLink, getWhatsAppRejectionLink, formatWhatsAppNumber } from '@/lib/whatsapp';
import { FlagIcon } from '@/components/common/PhoneInputWithCountry';
import { separarTelefonoYPais } from '@/lib/countryDetection';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingRequestsModal({ isOpen, onClose }: PendingRequestsModalProps) {
  const { citas, servicios, colaboradores, configuracion, usuarioSesion, actualizarEstadoCita } = useSalon();
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  if (!isOpen) return null;

  const esColaboradora = usuarioSesion?.tipo === 'colaborador';
  const miColaboradorId = usuarioSesion?.colaboradorId;

  const solicitudesPendientes = citas.filter((c) => {
    if (c.estado !== 'Pendiente') return false;
    if (esColaboradora && miColaboradorId) {
      return c.terapeutaId === miColaboradorId || c.colaboradorId === miColaboradorId;
    }
    return true;
  });

  const handleAceptar = async (cita: Cita, enviarWhatsApp: boolean) => {
    await actualizarEstadoCita(cita.id, 'Confirmada');
    if (enviarWhatsApp) {
      const colab = colaboradores.find((c) => c.id === (cita.colaboradorId || cita.terapeutaId));
      const link = getWhatsAppConfirmationLink(cita, servicios, colab, configuracion);
      window.open(link, '_blank');
    }
  };

  const handleRechazar = async (cita: Cita, enviarWhatsApp: boolean) => {
    await actualizarEstadoCita(cita.id, 'Rechazada');
    if (enviarWhatsApp) {
      const colab = colaboradores.find((c) => c.id === (cita.colaboradorId || cita.terapeutaId));
      const link = getWhatsAppRejectionLink(cita, servicios, colab, configuracion);
      window.open(link, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-gold-gradient text-white shadow-xs">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                {esColaboradora ? 'Tus Solicitudes Pendientes' : 'Bandeja del Salón'}
              </span>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                {esColaboradora
                  ? `Solicitudes para ${usuarioSesion?.nombre} (${solicitudesPendientes.length})`
                  : `Todas las Solicitudes Pendientes (${solicitudesPendientes.length})`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8C7A70] hover:bg-[#EFE7DE] hover:text-[#2D2424] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Solicitudes */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {solicitudesPendientes.map((cita) => {
            const colab = colaboradores.find((c) => c.id === (cita.colaboradorId || cita.terapeutaId));
            const nombresServicios = cita.servicioIds
              .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
              .join(' + ');

            return (
              <div
                key={cita.id}
                className="rounded-2xl border border-[#EAE0D5] bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#F4EDE4] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#2D2424]">
                        {cita.clienteNombre}
                      </h4>
                      <span className="rounded-md bg-[#FAF0E6] px-2 py-0.5 text-xs font-bold text-[#8C5845]">
                        {cita.codigo}
                      </span>
                    </div>
                    <a
                      href={`https://wa.me/${formatWhatsAppNumber(cita.clienteTelefono)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      <FlagIcon
                        codigo={separarTelefonoYPais(cita.clienteTelefono).pais.codigo}
                        bandera={separarTelefonoYPais(cita.clienteTelefono).pais.bandera}
                        className="h-3 w-4.5 rounded-xs object-cover"
                      />
                      <Phone className="h-3 w-3" />
                      <span>{cita.clienteTelefono}</span>
                    </a>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-[#B85D75]">
                      {configuracion.moneda}{cita.precioTotal}
                    </span>
                    <span className="block text-[10px] text-[#8C7A70]">
                      {cita.duracionTotalMin} min
                    </span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 text-xs text-[#5A4D48]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#B85D75] shrink-0" />
                    <span className="truncate">
                      <strong>Servicios:</strong> {nombresServicios}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-[#B85D75] shrink-0" />
                    <span>
                      <strong>Colaboradora:</strong> {colab?.nombre || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#B85D75] shrink-0" />
                    <span>
                      <strong>Fecha:</strong> {cita.fecha}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#B85D75] shrink-0" />
                    <span>
                      <strong>Horario:</strong> {cita.horaInicio} - {cita.horaFin} hrs
                    </span>
                  </div>
                </div>

                {/* Foto de Referencia de la Clienta (si la subió) */}
                {cita.fotoReferencia && (
                  <div className="flex items-center gap-3 rounded-xl bg-[#FAF6F0] p-2.5 border border-[#EFE7DE]">
                    <img
                      src={cita.fotoReferencia}
                      alt="Referencia de diseño"
                      onClick={() => setFotoModal(cita.fotoReferencia || null)}
                      className="h-12 w-12 rounded-lg object-cover border border-[#E6D7CB] cursor-pointer hover:scale-105 transition"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#2D2424] block flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5 text-[#B85D75]" />
                        Foto de referencia adjunta por la clienta
                      </span>
                      <button
                        type="button"
                        onClick={() => setFotoModal(cita.fotoReferencia || null)}
                        className="text-[11px] text-[#B85D75] hover:underline"
                      >
                        Ver imagen completa
                      </button>
                    </div>
                  </div>
                )}

                {cita.clienteNotas && (
                  <div className="rounded-xl bg-[#FAF6F0] p-2.5 text-xs text-[#6B5E59] border border-[#EFE7DE]">
                    <strong>Nota:</strong> {cita.clienteNotas}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#F4EDE4]">
                  <button
                    onClick={() => handleRechazar(cita, true)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    Rechazar / Reprogramar
                  </button>

                  <button
                    onClick={() => handleAceptar(cita, false)}
                    className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-2 text-xs font-semibold text-[#2D2424] hover:bg-[#F4EDE4] transition"
                  >
                    Solo Aceptar
                  </button>

                  <button
                    onClick={() => handleAceptar(cita, true)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Aceptar + Notificar WhatsApp
                  </button>
                </div>
              </div>
            );
          })}

          {solicitudesPendientes.length === 0 && (
            <div className="py-16 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-emerald-600/70" />
              <h4 className="mt-3 text-sm font-bold text-[#2D2424]">
                ¡Bandeja al día!
              </h4>
              <p className="text-xs text-[#7A6B65] mt-1">
                No tienes solicitudes pendientes de confirmación en este momento.
              </p>
            </div>
          )}
        </div>

        {/* Modal para ver foto completa */}
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

        {/* Footer */}
        <div className="mt-4 border-t border-[#E8DCCF] pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-[#5A4D48] border border-[#E6D7CB]"
          >
            Cerrar Bandeja
          </button>
        </div>
      </div>
    </div>
  );
}
