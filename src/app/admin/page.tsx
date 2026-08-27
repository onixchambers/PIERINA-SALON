'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import AdminHeader, { VistaCalendario } from '@/components/admin/AdminHeader';
import CalendarView from '@/components/admin/CalendarView';
import PendingRequestsModal from '@/components/admin/PendingRequestsModal';
import AvailabilityBlockerModal from '@/components/admin/AvailabilityBlockerModal';
import ServicesManagerModal from '@/components/admin/ServicesManagerModal';
import CollaboratorsManagerModal from '@/components/admin/CollaboratorsManagerModal';
import SalonSettingsModal from '@/components/admin/SalonSettingsModal';
import AppointmentDetailModal from '@/components/admin/AppointmentDetailModal';
import { useSalon } from '@/context/SalonContext';
import { Cita, Servicio } from '@/types/salon';
import {
  Lock,
  KeyRound,
  Sparkles,
  ArrowRight,
  LogOut,
  Plus,
  X,
  Clock,
  Calendar as CalendarIcon,
  User,
  Phone,
  CheckCircle2,
  Key,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { soundService } from '@/lib/sound';

export default function AdminPage() {
  const {
    configuracion,
    citas,
    servicios,
    colaboradores,
    usuarioSesion,
    loginPorPin,
    logout,
    cambiarPinColaborador,
    cambiarPinAdmin,
    crearCita,
  } = useSalon();

  // Autenticación por PIN
  const [pinIngresado, setPinIngresado] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // Estados del Calendario y Navegación
  const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0]);
  const [vista, setVista] = useState<VistaCalendario>('dia');

  // Modales
  const [modalPending, setModalPending] = useState(false);
  const [modalBlocker, setModalBlocker] = useState(false);
  const [modalServices, setModalServices] = useState(false);
  const [modalTherapists, setModalTherapists] = useState(false);
  const [modalSettings, setModalSettings] = useState(false);
  const [modalNewAppointment, setModalNewAppointment] = useState(false);
  const [modalCambiarPin, setModalCambiarPin] = useState(false);
  const [nuevoPinInput, setNuevoPinInput] = useState('');
  const [pinCambiadoExito, setPinCambiadoExito] = useState(false);

  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  // Props para apertura rápida
  const [previaHora, setPreviaHora] = useState<string>('10:00');
  const [previaColaboradorId, setPreviaColaboradorId] = useState<string>('');

  // Formulario de Nueva Cita Manual
  const [manualNombre, setManualNombre] = useState('');
  const [manualTelefono, setManualTelefono] = useState('');
  const [manualNotas, setManualNotas] = useState('');
  const [manualColaboradorId, setManualColaboradorId] = useState('');
  const [manualServicioId, setManualServicioId] = useState('');
  const [manualFecha, setManualFecha] = useState(fechaActual);
  const [manualHora, setManualHora] = useState('10:00');

  const esColaboradora = usuarioSesion?.tipo === 'colaborador';
  const miColaboradorId = usuarioSesion?.colaboradorId;
  const colabActiva = colaboradores.find((c) => c.id === miColaboradorId);

  const handleLoginPin = (e: React.FormEvent) => {
    e.preventDefault();
    const sesion = loginPorPin(pinIngresado);
    if (sesion) {
      setErrorPin(false);
      setPinIngresado('');
    } else {
      setErrorPin(true);
      setPinIngresado('');
    }
  };

  const handleSlotClick = (fecha: string, hora: string, colabId?: string) => {
    const targetColab = esColaboradora ? miColaboradorId : colabId;
    setPreviaHora(hora);
    setPreviaColaboradorId(targetColab || '');
    setManualFecha(fecha);
    setManualHora(hora);
    if (targetColab) setManualColaboradorId(targetColab);
    if (servicios.length > 0) setManualServicioId(servicios[0].id);
    setModalNewAppointment(true);
  };

  const handleQuickBlock = (fecha: string, hora: string, colabId?: string) => {
    const targetColab = esColaboradora ? miColaboradorId : colabId;
    setPreviaHora(hora);
    setPreviaColaboradorId(targetColab || '');
    setFechaActual(fecha);
    setModalBlocker(true);
  };

  const handleCrearCitaManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetColab = esColaboradora && miColaboradorId ? miColaboradorId : manualColaboradorId;
    const serv = servicios.find((s) => s.id === manualServicioId);
    if (!serv || !targetColab || !manualNombre.trim()) return;

    const [h, m] = manualHora.split(':').map(Number);
    const endMinutes = h * 60 + m + serv.duracionMin;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const horaFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Obtener precio personalizado si existe
    const colab = colaboradores.find((c) => c.id === targetColab);
    let precio = serv.precio;
    if (colab?.serviciosAsignados) {
      const sa = colab.serviciosAsignados.find((s) => s.servicioId === serv.id);
      if (sa && sa.precioPersonalizado !== undefined) {
        precio = sa.precioPersonalizado;
      }
    }

    await crearCita({
      clienteNombre: manualNombre.trim(),
      clienteTelefono: manualTelefono.trim() || '+52 55 0000 0000',
      clienteNotas: manualNotas.trim() || 'Cita manual registrada en recepción',
      terapeutaId: targetColab,
      colaboradorId: targetColab,
      servicioIds: [serv.id],
      fecha: manualFecha,
      horaInicio: manualHora,
      horaFin,
      precioTotal: precio,
      duracionTotalMin: serv.duracionMin,
      origen: 'admin_manual',
    });

    setModalNewAppointment(false);
    setManualNombre('');
    setManualTelefono('');
    setManualNotas('');
  };

  const handleGuardarNuevoPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPinInput.trim()) return;

    if (esColaboradora && miColaboradorId) {
      await cambiarPinColaborador(miColaboradorId, nuevoPinInput.trim());
    } else {
      await cambiarPinAdmin(nuevoPinInput.trim());
    }

    setPinCambiadoExito(true);
    setTimeout(() => {
      setPinCambiadoExito(false);
      setModalCambiarPin(false);
      setNuevoPinInput('');
    }, 1200);
  };

  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  // =========================================================================
  // PANTALLA DE PIN INTELIGENTE
  // =========================================================================
  if (!usuarioSesion) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl border-2 border-[#E6D7CB] bg-white p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex justify-center">
              <img
                src={configuracion.logoUrl || '/logo-pierina.png'}
                alt="Logo Pierina Salón"
                className="h-28 w-28 object-contain drop-shadow-xl"
              />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                Acceso con Contraseña Personal
              </span>
              <h2 className="mt-1 text-2xl font-serif font-bold text-[#2D2424]">
                Portal de Colaboradoras
              </h2>
              <p className="mt-1 text-xs text-[#7A6B65]">
                Ingresa tu PIN personal. El sistema identificará automáticamente tu perfil y cargará tu agenda.
              </p>
            </div>

            <form onSubmit={handleLoginPin} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-5 w-5 text-[#8C7A70]" />
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  required
                  placeholder="PIN / Contraseña"
                  value={pinIngresado}
                  onChange={(e) => setPinIngresado(e.target.value)}
                  className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-center text-lg font-bold tracking-widest text-[#2D2424] focus:outline-hidden ${
                    errorPin
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-[#E6D7CB] bg-[#FAF6F0] focus:border-[#B85D75] focus:bg-white'
                  }`}
                />
              </div>

              {errorPin && (
                <p className="text-xs font-semibold text-rose-600">
                  PIN no reconocido. Intenta con tu clave personal o 1234 (Admin).
                </p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-gold-gradient py-3 text-sm font-bold text-white shadow-md shadow-[#B85D75]/25 hover:opacity-95 transition"
              >
                Identificarme e Ingresar
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="rounded-xl bg-[#FAF6F0] p-3 text-left text-[11px] text-[#8C7A70] space-y-1 border border-[#EFE7DE]">
              <span className="font-bold text-[#2D2424] block">💡 Claves de prueba:</span>
              <div>• <strong>1234</strong>: Administradora General (Dueña)</div>
              <div>• <strong>1111</strong>: Valentina Ramos (Uñas & Pestañas)</div>
              <div>• <strong>2222</strong>: Sofía Morales (Cabello)</div>
              <div>• <strong>3333</strong>: Camila Silva (Faciales)</div>
              <div>• <strong>4444</strong>: Elena Castillo (Masajes)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PANEL ADMINISTRATIVO DESBLOQUEADO
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Navbar />

      {/* Barra de Sesión Activa */}
      <div className="border-b border-[#E8DCCF] bg-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A4D48]">
        <div className="flex items-center gap-2.5">
          {usuarioSesion.foto ? (
            <img
              src={usuarioSesion.foto}
              alt={usuarioSesion.nombre}
              className="h-6 w-6 rounded-full object-cover border border-[#E6D7CB]"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-gold-gradient text-white font-bold text-[10px]">
              {obtenerIniciales(usuarioSesion.nombre)}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-[#2D2424]">
              {usuarioSesion.nombre}
            </span>
            <span className="rounded-md bg-[#FAF0E6] px-1.5 py-0.5 text-[10px] font-semibold text-[#8C5845]">
              {esColaboradora ? 'Colaboradora' : 'Administración Total'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalCambiarPin(true)}
            className="flex items-center gap-1 text-xs font-semibold text-[#B85D75] hover:underline"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Cambiar mi PIN</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-[#8C7A70] hover:text-rose-600 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <AdminHeader
        fechaActual={fechaActual}
        setFechaActual={setFechaActual}
        vista={vista}
        setVista={setVista}
        onOpenPending={() => setModalPending(true)}
        onOpenBlocker={() => setModalBlocker(true)}
        onOpenServices={() => setModalServices(true)}
        onOpenTherapists={() => setModalTherapists(true)}
        onOpenSettings={() => setModalSettings(true)}
        onOpenNewAppointment={() => {
          const targetColab = esColaboradora && miColaboradorId ? miColaboradorId : colaboradores[0]?.id;
          if (targetColab) setManualColaboradorId(targetColab);
          if (servicios.length > 0) setManualServicioId(servicios[0].id);
          setModalNewAppointment(true);
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <CalendarView
          fechaActual={fechaActual}
          vista={vista}
          onSelectCita={(cita) => setCitaSeleccionada(cita)}
          onSlotClick={handleSlotClick}
          onQuickBlock={handleQuickBlock}
          onSelectFecha={(f) => {
            setFechaActual(f);
            setVista('dia');
          }}
        />
      </main>

      {/* Modales */}
      <PendingRequestsModal
        isOpen={modalPending}
        onClose={() => setModalPending(false)}
      />

      <AvailabilityBlockerModal
        isOpen={modalBlocker}
        onClose={() => setModalBlocker(false)}
        fechaPrevia={fechaActual}
        horaPrevia={previaHora}
        terapeutaIdPrevia={esColaboradora && miColaboradorId ? miColaboradorId : previaColaboradorId}
      />

      <ServicesManagerModal
        isOpen={modalServices}
        onClose={() => setModalServices(false)}
      />

      <CollaboratorsManagerModal
        isOpen={modalTherapists}
        onClose={() => setModalTherapists(false)}
      />

      <SalonSettingsModal
        isOpen={modalSettings}
        onClose={() => setModalSettings(false)}
      />

      <AppointmentDetailModal
        cita={citaSeleccionada}
        isOpen={!!citaSeleccionada}
        onClose={() => setCitaSeleccionada(null)}
      />

      {/* Modal Cambiar PIN */}
      {modalCambiarPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-[#E6D7CB] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[#B85D75]" />
                <h3 className="text-base font-serif font-bold text-[#2D2424]">
                  Cambiar Contraseña / PIN
                </h3>
              </div>
              <button
                onClick={() => setModalCambiarPin(false)}
                className="rounded-full p-1.5 text-[#8C7A70] hover:bg-[#EFE7DE]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoPin} className="space-y-3">
              <p className="text-xs text-[#6B5E59]">
                Ingresa el nuevo PIN de acceso para <strong>{usuarioSesion.nombre}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Nuevo PIN (4 a 8 dígitos o caracteres):
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="Ej. 5555"
                  value={nuevoPinInput}
                  onChange={(e) => setNuevoPinInput(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0] p-2.5 text-center text-base font-bold text-[#2D2424] tracking-widest focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              {pinCambiadoExito && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <Check className="h-4 w-4" />
                  ¡PIN actualizado exitosamente!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCambiarPin(false)}
                  className="rounded-xl border border-[#E6D7CB] bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-gold-gradient px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Guardar Nuevo PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Cita Manual */}
      {modalNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D2424] text-white">
                  <Plus className="h-5 w-5 text-[#E07A5F]" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#2D2424]">
                  Agendar Cita Manualmente
                </h3>
              </div>
              <button
                onClick={() => setModalNewAppointment(false)}
                className="rounded-full p-2 text-[#8C7A70] hover:bg-[#EFE7DE]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCrearCitaManual} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Nombre de la Clienta:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen Salinas"
                    value={manualNombre}
                    onChange={(e) => setManualNombre(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="tel"
                    placeholder="55 1234 5678"
                    value={manualTelefono}
                    onChange={(e) => setManualTelefono(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Colaboradora:
                  </label>
                  <select
                    disabled={esColaboradora}
                    value={esColaboradora && miColaboradorId ? miColaboradorId : manualColaboradorId}
                    onChange={(e) => setManualColaboradorId(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424] disabled:opacity-75"
                  >
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Tratamiento:
                  </label>
                  <select
                    value={manualServicioId}
                    onChange={(e) => setManualServicioId(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  >
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({s.duracionMin}m - {configuracion.moneda}{s.precio})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Fecha:
                  </label>
                  <input
                    type="date"
                    required
                    value={manualFecha}
                    onChange={(e) => setManualFecha(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Hora Inicio:
                  </label>
                  <input
                    type="time"
                    required
                    value={manualHora}
                    onChange={(e) => setManualHora(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Notas adicionales:
                </label>
                <textarea
                  rows={2}
                  value={manualNotas}
                  onChange={(e) => setManualNotas(e.target.value)}
                  placeholder="Observaciones de la cita..."
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNewAppointment(false)}
                  className="rounded-xl border border-[#E6D7CB] bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-gold-gradient px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Confirmar y Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
