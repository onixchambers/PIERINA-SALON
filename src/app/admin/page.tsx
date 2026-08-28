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
  Camera,
  Upload,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import PhoneInputWithCountry from '@/components/common/PhoneInputWithCountry';
import { soundService } from '@/lib/sound';
import { processImageFile } from '@/lib/imageHelper';

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
    actualizarFotoColaborador,
    cambiarPinAdmin,
    crearCita,
  } = useSalon();

  // Autenticación por Contraseña
  const [pinIngresado, setPinIngresado] = useState('');
  const [errorPin, setErrorPin] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  // Estados del Calendario y Navegación
  const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0]);
  const [vista, setVista] = useState<VistaCalendario>('dia');
  const [filtroColaborador, setFiltroColaborador] = useState<string>('all'); // 'all' o ID específico

  // Modales
  const [modalPending, setModalPending] = useState(false);
  const [modalBlocker, setModalBlocker] = useState(false);
  const [modalServices, setModalServices] = useState(false);
  const [modalTherapists, setModalTherapists] = useState(false);
  const [modalSettings, setModalSettings] = useState(false);
  const [modalNewAppointment, setModalNewAppointment] = useState(false);
  const [modalCambiarPin, setModalCambiarPin] = useState(false);
  const [pinActualInput, setPinActualInput] = useState('');
  const [nuevoPinInput, setNuevoPinInput] = useState('');
  const [confirmarPinInput, setConfirmarPinInput] = useState('');
  const [errorCambioPin, setErrorCambioPin] = useState<string | null>(null);
  const [pinCambiadoExito, setPinCambiadoExito] = useState(false);
  const [mostrarPasswordsModal, setMostrarPasswordsModal] = useState(false);

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
  const esSuperAdmin = usuarioSesion?.tipo === 'superadmin' || !!usuarioSesion?.esSuperAdmin;
  const miColaboradorId = usuarioSesion?.colaboradorId;
  const colabActiva = colaboradores.find((c) => c.id === miColaboradorId);

  const handleLoginPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPin(false);
    setErrorMensaje('');

    const res = loginPorPin(pinIngresado);
    if (res.exito && res.sesion) {
      setPinIngresado('');
    } else {
      setErrorPin(true);
      setErrorMensaje(res.errorMotivo || 'Contraseña incorrecta.');
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
    setErrorCambioPin(null);

    const actual = pinActualInput.trim();
    const nuevo = nuevoPinInput.trim();
    const confirmacion = confirmarPinInput.trim();

    if (!actual) {
      setErrorCambioPin('Por favor ingresa tu contraseña actual.');
      return;
    }

    // 1. Validar Contraseña Actual
    const actualMin = actual.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (esColaboradora && miColaboradorId) {
      const target = colaboradores.find((c) => c.id === miColaboradorId);
      if (target) {
        const colabPin = (target.pin || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const defPass = (target.passwordOriginal || target.nombre.toLowerCase().replace(/\s+/g, '') + '123').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const origPass = (target.passwordOriginal || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const esCorrecta = actualMin === colabPin || actualMin === defPass || actualMin === origPass;
        if (!esCorrecta) {
          setErrorCambioPin('La contraseña actual es incorrecta. Por favor verifícala.');
          return;
        }
      }
    } else if (usuarioSesion?.tipo === 'superadmin' || usuarioSesion?.esSuperAdmin) {
      const superPin = (configuracion.pinSuperAdmin || 'onix1974').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (actualMin !== superPin && actualMin !== 'onix1974') {
        setErrorCambioPin('La contraseña actual de superadministrador es incorrecta.');
        return;
      }
    } else {
      // Administrador
      const adminPin = (configuracion.pinAdmin || 'pierina123').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const adminMatch = actualMin === adminPin || configuracion.administradores?.some((a) => {
        const aPin = (a.pin || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return aPin === actualMin && a.nombre === usuarioSesion?.nombre;
      });

      if (!adminMatch && actualMin !== adminPin) {
        setErrorCambioPin('La contraseña actual de administración es incorrecta.');
        return;
      }
    }

    // 2. Validar Nueva Contraseña
    if (!nuevo || nuevo.length < 3) {
      setErrorCambioPin('La nueva contraseña debe tener al menos 3 caracteres.');
      return;
    }

    // 3. Validar Confirmación
    if (nuevo !== confirmacion) {
      setErrorCambioPin('Las nuevas contraseñas no coinciden. Por favor verifica que ambas sean idénticas.');
      return;
    }

    // 4. Validar que no sea idéntica a la actual
    if (nuevo === actual) {
      setErrorCambioPin('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    // 5. Guardar Cambio
    if (esColaboradora && miColaboradorId) {
      await cambiarPinColaborador(miColaboradorId, nuevo);
    } else {
      await cambiarPinAdmin(nuevo);
    }

    setPinCambiadoExito(true);
    setTimeout(() => {
      setPinCambiadoExito(false);
      setModalCambiarPin(false);
      setPinActualInput('');
      setNuevoPinInput('');
      setConfirmarPinInput('');
      setErrorCambioPin(null);
    }, 1500);
  };

  // Modal Cambiar Foto (Colaboradora o Admin)
  const [modalCambiarFoto, setModalCambiarFoto] = useState(false);
  const [targetColaboradorFotoId, setTargetColaboradorFotoId] = useState<string | null>(null);
  const [fotoPerfilNueva, setFotoPerfilNueva] = useState<string | null>(null);
  const [cargandoFotoPerfil, setCargandoFotoPerfil] = useState(false);
  const [fotoGuardadaExito, setFotoGuardadaExito] = useState(false);

  const handleAbrirCambiarFoto = (colabId: string) => {
    const colab = colaboradores.find((c) => c.id === colabId);
    if (colab) {
      setTargetColaboradorFotoId(colabId);
      setFotoPerfilNueva(colab.foto || null);
      setModalCambiarFoto(true);
    }
  };

  const handleSubirFotoPerfilPropia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargandoFotoPerfil(true);
    try {
      const dataUrl = await processImageFile(file, 400, 0.85);
      setFotoPerfilNueva(dataUrl);
    } catch (err) {
      console.error('Error procesando foto de perfil:', err);
    } finally {
      setCargandoFotoPerfil(false);
    }
  };

  const handleGuardarFotoPerfilPropia = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = targetColaboradorFotoId || (esColaboradora ? miColaboradorId : null);
    if (targetId) {
      await actualizarFotoColaborador(targetId, fotoPerfilNueva);
      setFotoGuardadaExito(true);
      setTimeout(() => {
        setFotoGuardadaExito(false);
        setModalCambiarFoto(false);
        setTargetColaboradorFotoId(null);
      }, 1200);
    }
  };

  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const [mostrarPasswordLogin, setMostrarPasswordLogin] = useState(false);

  // =========================================================================
  // PANTALLA DE ACCESO INTELIGENTE POR CONTRASEÑA
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
                {configuracion.nombreSalon || 'Pierina Salón'}
              </h2>
              <p className="text-xs font-medium text-[#8C7A70]">
                {configuracion.eslogan || 'Cejas, pestañas y más'}
              </p>
              <p className="mt-1.5 text-[11px] text-[#A89890]">
                Ingresa tu clave de acceso. El sistema detectará automáticamente tu usuario y cargará tu agenda.
              </p>
            </div>

            <form onSubmit={handleLoginPin} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8C7A70]" />
                <input
                  type={mostrarPasswordLogin ? 'text' : 'password'}
                  autoFocus
                  required
                  placeholder="Ingresa tu Contraseña"
                  value={pinIngresado}
                  onChange={(e) => setPinIngresado(e.target.value)}
                  className={`w-full rounded-2xl border py-3.5 pl-10 pr-10 text-center text-base font-bold tracking-wider text-[#2D2424] focus:outline-hidden ${
                    errorPin
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-[#E6D7CB] bg-[#FAF6F0] focus:border-[#B85D75] focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPasswordLogin(!mostrarPasswordLogin)}
                  className="absolute right-3.5 top-3.5 text-[#8C7A70] hover:text-[#2D2424] transition"
                  title={mostrarPasswordLogin ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarPasswordLogin ? '🙈' : '👁️'}
                </button>
              </div>

              {errorPin && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-left">
                  <p className="text-xs font-semibold text-rose-700 leading-relaxed">
                    {errorMensaje || 'Contraseña no reconocida. Verifica tu clave o consulta a la administración.'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-gold-gradient py-3.5 text-sm font-bold text-white shadow-md shadow-[#B85D75]/25 hover:opacity-95 transition cursor-pointer"
              >
                Identificarme e Ingresar
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
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
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          <span className="font-bold text-[#2D2424] text-xs">
            {usuarioSesion.nombre}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
              esSuperAdmin
                ? 'bg-purple-100 text-purple-800 font-bold'
                : esColaboradora
                ? 'bg-[#FAF0E6] text-[#8C5845]'
                : 'bg-rose-50 text-[#B85D75] font-bold'
            }`}
          >
            {esSuperAdmin ? '👑 Superadministrador' : esColaboradora ? 'Colaboradora' : 'Administración Total'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPinActualInput('');
              setNuevoPinInput('');
              setConfirmarPinInput('');
              setErrorCambioPin(null);
              setPinCambiadoExito(false);
              setModalCambiarPin(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 border border-amber-300 transition shadow-2xs cursor-pointer"
            title="Cambiar mi contraseña de acceso de forma segura y privada"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-700" />
            <span>🔑 Cambiar Mi Contraseña</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl bg-[#FAF6F0] px-3 py-1.5 text-xs font-semibold text-[#8C7A70] hover:text-rose-600 hover:bg-rose-50 border border-[#E6D7CB] transition cursor-pointer"
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
        filtroColaborador={filtroColaborador}
        setFiltroColaborador={setFiltroColaborador}
        onOpenPending={() => setModalPending(true)}
        onOpenBlocker={() => setModalBlocker(true)}
        onOpenServices={() => setModalServices(true)}
        onOpenTherapists={() => setModalTherapists(true)}
        onOpenSettings={() => setModalSettings(true)}
        onOpenNewAppointment={() => {
          const targetColab = esColaboradora && miColaboradorId ? miColaboradorId : (filtroColaborador !== 'all' ? filtroColaborador : colaboradores[0]?.id);
          if (targetColab) setManualColaboradorId(targetColab);
          if (servicios.length > 0) setManualServicioId(servicios[0].id);
          setModalNewAppointment(true);
        }}
      />

      <main className="flex-1 flex flex-col overflow-auto">
        <CalendarView
          fechaActual={fechaActual}
          vista={vista}
          filtroColaborador={filtroColaborador}
          onSelectCita={(cita) => setCitaSeleccionada(cita)}
          onSlotClick={handleSlotClick}
          onQuickBlock={handleQuickBlock}
          onOpenChangePhoto={handleAbrirCambiarFoto}
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
                  Cambiar Contraseña
                </h3>
              </div>
              <button
                onClick={() => setModalCambiarPin(false)}
                className="rounded-full p-1.5 text-[#8C7A70] hover:bg-[#EFE7DE] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoPin} className="space-y-3">
              <p className="text-xs text-[#6B5E59]">
                Para cambiar la clave de <strong>{usuarioSesion.nombre}</strong>, ingresa tu contraseña actual y confirma la nueva.
              </p>

              <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                <span className="font-bold flex items-center gap-1">
                  🔒 100% Privada y Confidencial
                </span>
                <p className="text-amber-800 leading-tight">
                  Tu nueva contraseña es secreta y nadie más podrá visualizarla.
                </p>
              </div>

              {/* Contraseña Actual */}
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Contraseña Actual (Vieja):
                </label>
                <div className="relative">
                  <input
                    type={mostrarPasswordsModal ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={pinActualInput}
                    onChange={(e) => setPinActualInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 pr-9 text-center text-sm font-bold text-[#2D2424] tracking-wider focus:border-[#B85D75] focus:outline-hidden shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordsModal(!mostrarPasswordsModal)}
                    className="absolute right-2.5 top-2.5 text-xs text-[#8C7A70] hover:text-[#2D2424] transition cursor-pointer"
                    title={mostrarPasswordsModal ? 'Ocultar' : 'Mostrar'}
                  >
                    {mostrarPasswordsModal ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Nueva Contraseña:
                </label>
                <input
                  type={mostrarPasswordsModal ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={nuevoPinInput}
                  onChange={(e) => setNuevoPinInput(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-center text-sm font-bold text-[#2D2424] tracking-wider focus:border-[#B85D75] focus:outline-hidden shadow-2xs"
                />
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Confirmar Nueva Contraseña:
                </label>
                <input
                  type={mostrarPasswordsModal ? 'text' : 'password'}
                  required
                  placeholder="Repite la nueva contraseña"
                  value={confirmarPinInput}
                  onChange={(e) => setConfirmarPinInput(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-center text-sm font-bold text-[#2D2424] tracking-wider focus:border-[#B85D75] focus:outline-hidden shadow-2xs"
                />
              </div>

              {errorCambioPin && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-center">
                  <p className="text-xs font-semibold text-rose-700 leading-tight">
                    {errorCambioPin}
                  </p>
                </div>
              )}

              {pinCambiadoExito && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <Check className="h-4 w-4 text-emerald-600" />
                  ¡Contraseña actualizada exitosamente!
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8DCCF]">
                <button
                  type="button"
                  onClick={() => setModalCambiarPin(false)}
                  className="rounded-xl border border-[#E6D7CB] bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-gold-gradient px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-95 transition"
                >
                  Guardar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Foto (Colaboradora o Admin) */}
      {modalCambiarFoto && (() => {
        const colabFotoObjetivo = colaboradores.find((c) => c.id === targetColaboradorFotoId) || (esColaboradora && miColaboradorId ? colaboradores.find(c => c.id === miColaboradorId) : null);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative flex w-full max-w-sm flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2D2424] text-white">
                    <Camera className="h-4 w-4 text-[#E07A5F]" />
                  </div>
                  <h3 className="text-base font-serif font-bold text-[#2D2424]">
                    Foto de Perfil {colabFotoObjetivo ? `• ${colabFotoObjetivo.nombre}` : ''}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setModalCambiarFoto(false);
                    setTargetColaboradorFotoId(null);
                  }}
                  className="rounded-full p-1.5 text-[#8C7A70] hover:bg-[#EFE7DE] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGuardarFotoPerfilPropia} className="space-y-4">
                <p className="text-xs text-[#6B5E59]">
                  Personaliza la foto de <strong>{colabFotoObjetivo ? colabFotoObjetivo.nombre : 'perfil'}</strong> para que las clientas y el equipo la reconozcan.
                </p>

                {/* Previsualización y Avatar */}
                <div className="flex flex-col items-center justify-center gap-3 py-2">
                  <div className="relative">
                    {fotoPerfilNueva ? (
                      <img
                        src={fotoPerfilNueva}
                        alt="Previsualización de foto"
                        className="h-24 w-24 rounded-full object-cover border-3 border-[#B85D75] shadow-md bg-white"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FAF0E6] text-[#B85D75] border-2 border-dashed border-[#E6D7CB] shadow-xs">
                        <ImageIcon className="h-10 w-10 text-[#B85D75]" />
                      </div>
                    )}

                    {fotoPerfilNueva && (
                      <button
                        type="button"
                        onClick={() => setFotoPerfilNueva(null)}
                        className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                        title="Quitar foto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-4 py-2 text-xs font-bold text-white cursor-pointer hover:opacity-95 transition shadow-xs">
                    <Upload className="h-3.5 w-3.5" />
                    {cargandoFotoPerfil ? 'Procesando...' : fotoPerfilNueva ? 'Cambiar Foto' : 'Subir Foto desde Celular/PC'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={cargandoFotoPerfil}
                      onChange={handleSubirFotoPerfilPropia}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-[#8C7A70] text-center">
                    Soporta fotos desde la cámara o galería (JPG, PNG, WebP).
                  </p>
                </div>

                {fotoGuardadaExito && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <Check className="h-4 w-4" />
                    ¡Foto actualizada con éxito!
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-[#E8DCCF]">
                  <button
                    type="button"
                    onClick={() => {
                      setModalCambiarFoto(false);
                      setTargetColaboradorFotoId(null);
                    }}
                    className="rounded-xl border border-[#E6D7CB] bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargandoFotoPerfil}
                    className="rounded-xl bg-[#2D2424] hover:bg-stone-800 px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer transition"
                  >
                    Guardar Foto
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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
                  <PhoneInputWithCountry
                    value={manualTelefono}
                    onChange={(val) => setManualTelefono(val)}
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
