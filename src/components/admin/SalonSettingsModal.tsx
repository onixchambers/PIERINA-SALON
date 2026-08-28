'use client';

import React, { useState, useEffect } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Especialidad } from '@/types/salon';
import { processImageFile } from '@/lib/imageHelper';
import {
  X,
  Settings,
  Database,
  Lock,
  Volume2,
  Sparkles,
  RotateCcw,
  Check,
  Upload,
  Trash2,
  Image as ImageIcon,
  Plus,
  Tag,
  MapPin,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  HardDrive,
  Wifi,
  WifiOff,
  DollarSign,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { soundService } from '@/lib/sound';
import PhoneInputWithCountry from '@/components/common/PhoneInputWithCountry';

interface SalonSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SalonSettingsModal({ isOpen, onClose }: SalonSettingsModalProps) {
  const {
    configuracion,
    colaboradores,
    especialidades,
    isFirebaseConnected,
    isOnline,
    pendingSyncCount,
    limpiarCacheLocal7Dias,
    usuarioSesion,
    actualizarConfiguracion,
    guardarEspecialidad,
    eliminarEspecialidad,
    resetearADatosPorDefecto,
  } = useSalon();

  const esSuperAdmin = usuarioSesion?.tipo === 'superadmin' || !!usuarioSesion?.esSuperAdmin;

  const [nombreSalon, setNombreSalon] = useState(configuracion.nombreSalon);
  const [eslogan, setEslogan] = useState(configuracion.eslogan || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(configuracion.logoUrl || null);
  const [telefonoSalon, setTelefonoSalon] = useState(configuracion.telefonoSalon);
  const [direccion, setDireccion] = useState(configuracion.direccion);
  const [moneda, setMoneda] = useState(configuracion.moneda || '$');
  const [maxColaboradores, setMaxColaboradores] = useState(configuracion.maxColaboradores || 50);
  const [maxAdministradores, setMaxAdministradores] = useState(configuracion.maxAdministradores || 10);
  const [horarioApertura, setHorarioApertura] = useState(configuracion.horarioApertura);
  const [horarioCierre, setHorarioCierre] = useState(configuracion.horarioCierre);
  const [intervaloMinutos, setIntervaloMinutos] = useState(configuracion.intervaloMinutos);
  const [alertaSonora, setAlertaSonora] = useState(configuracion.alertaSonoraActiva);
  const [zonaHoraria, setZonaHoraria] = useState(configuracion.zonaHoraria || 'America/Panama');

  // Nueva Especialidad
  const [nuevaEspNombre, setNuevaEspNombre] = useState('');

  // Firebase Config Form
  const [fbApiKey, setFbApiKey] = useState(configuracion.firebaseConfig?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(configuracion.firebaseConfig?.projectId || '');
  const [fbAppId, setFbAppId] = useState(configuracion.firebaseConfig?.appId || '');

  const [guardadoExito, setGuardadoExito] = useState(false);
  const [mensajeLimpieza, setMensajeLimpieza] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNombreSalon(configuracion.nombreSalon);
      setEslogan(configuracion.eslogan || '');
      setLogoUrl(configuracion.logoUrl || null);
      setTelefonoSalon(configuracion.telefonoSalon);
      setDireccion(configuracion.direccion);
      setMoneda(configuracion.moneda || '$');
      setMaxColaboradores(configuracion.maxColaboradores || 50);
      setMaxAdministradores(configuracion.maxAdministradores || 10);
      setHorarioApertura(configuracion.horarioApertura);
      setHorarioCierre(configuracion.horarioCierre);
      setIntervaloMinutos(configuracion.intervaloMinutos);
      setAlertaSonora(configuracion.alertaSonoraActiva);
      setZonaHoraria(configuracion.zonaHoraria || 'America/Panama');
      setFbApiKey(configuracion.firebaseConfig?.apiKey || '');
      setFbProjectId(configuracion.firebaseConfig?.projectId || '');
      setFbAppId(configuracion.firebaseConfig?.appId || '');
    }
  }, [isOpen, configuracion]);

  if (!isOpen) return null;

  const handleSubirLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 400, 0.9);
      setLogoUrl(dataUrl);
    } catch (err) {
      console.error('Error procesando logo:', err);
    }
  };

  const handleProbarSonido = () => {
    soundService.playChime();
  };

  const handleAgregarEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaEspNombre.trim()) return;

    const id = nuevaEspNombre.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const nueva: Especialidad = {
      id: `${id}-${Date.now().toString().slice(-4)}`,
      nombre: nuevaEspNombre.trim(),
      color: '#B85D75',
      icono: 'Sparkles',
    };

    await guardarEspecialidad(nueva);
    setNuevaEspNombre('');
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    await actualizarConfiguracion({
      nombreSalon: nombreSalon.trim(),
      eslogan: eslogan.trim(),
      logoUrl: logoUrl || null,
      telefonoSalon: telefonoSalon.trim(),
      direccion: direccion.trim(),
      moneda: moneda.trim() || '$',
      maxColaboradores: esSuperAdmin ? (Number(maxColaboradores) || 50) : (configuracion.maxColaboradores || 50),
      maxAdministradores: esSuperAdmin ? (Number(maxAdministradores) || 10) : (configuracion.maxAdministradores || 10),
      horarioApertura,
      horarioCierre,
      intervaloMinutos: Number(intervaloMinutos),
      pinAdmin: configuracion.pinAdmin || 'pierina123',
      alertaSonoraActiva: alertaSonora,
      zonaHoraria: zonaHoraria || 'America/Panama',
      firebaseConfig: esSuperAdmin && fbApiKey && fbProjectId ? {
        apiKey: fbApiKey.trim(),
        projectId: fbProjectId.trim(),
        appId: fbAppId.trim(),
      } : configuracion.firebaseConfig,
    });

    setGuardadoExito(true);
    setTimeout(() => {
      setGuardadoExito(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de restaurar los datos iniciales de prueba?')) {
      resetearADatosPorDefecto();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2D2424] text-white shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                Configuración del Negocio
              </span>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                Ajustes, Logo y Especialidades
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

        {/* Contenido con Scroll */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-5">
          {/* LOGO DEL SALÓN (SUBIR Y ELIMINAR A VOLUNTAD) */}
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#B85D75]" />
              Logo Oficial del Salón
            </h4>

            <div className="flex flex-wrap items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Logo del Salón"
                    className="h-16 w-16 rounded-2xl object-contain border-2 border-[#B85D75] bg-[#FAF6F0] p-1 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition"
                    title="Eliminar logo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FCEEE9] text-[#B85D75] border border-[#F2C8BC] shadow-xs">
                  <ImageIcon className="h-7 w-7" />
                </div>
              )}

              <div className="space-y-1">
                <label className="inline-flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-4 py-2 text-xs font-bold text-white cursor-pointer hover:opacity-95 transition shadow-xs">
                  <Upload className="h-3.5 w-3.5" />
                  {logoUrl ? 'Cambiar Logo' : 'Subir Logo del Salón'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSubirLogo}
                    className="hidden"
                  />
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="block text-xs text-rose-600 hover:underline"
                  >
                    Eliminar logo personalizado
                  </button>
                )}

                <p className="text-[10px] text-[#8C7A70]">
                  Formato PNG transparente, SVG o JPG. Se reflejará en toda la app.
                </p>
              </div>
            </div>
          </div>

          {/* GESTIÓN DE ESPECIALIDADES DINÁMICAS */}
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424] flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#B85D75]" />
              Especialidades / Categorías del Salón
            </h4>

            <div className="flex flex-wrap gap-2">
              {especialidades.map((esp) => (
                <div
                  key={esp.id}
                  className="flex items-center gap-1.5 rounded-xl bg-[#FAF0E6] border border-[#EAE0D5] px-3 py-1.5 text-xs font-semibold text-[#8C5845]"
                >
                  <span>{esp.nombre}</span>
                  <button
                    type="button"
                    onClick={() => eliminarEspecialidad(esp.id)}
                    className="ml-1 rounded-md p-0.5 text-[#8C5845] hover:bg-rose-100 hover:text-rose-700 transition"
                    title="Eliminar especialidad"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAgregarEspecialidad} className="flex gap-2 pt-2 border-t border-[#F4EDE4]">
              <input
                type="text"
                placeholder="Nombre de nueva especialidad (ej. Barbería, Micropigmentación...)"
                value={nuevaEspNombre}
                onChange={(e) => setNuevaEspNombre(e.target.value)}
                className="flex-1 rounded-xl border border-[#E6D7CB] bg-white px-3 py-2 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-xl bg-[#2D2424] px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            </form>
          </div>

          {/* Datos del Salón */}
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424]">
              Información de Contacto y Ubicación
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Nombre Comercial:
                </label>
                <input
                  type="text"
                  required
                  value={nombreSalon}
                  onChange={(e) => setNombreSalon(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Teléfono / WhatsApp Recepción:
                </label>
                <PhoneInputWithCountry
                  required
                  value={telefonoSalon}
                  onChange={(val) => setTelefonoSalon(val)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1 flex items-center justify-between">
                <span>Eslogan / Subtítulo:</span>
                <span className="text-[10px] text-[#B85D75] font-normal">Aparece bajo el nombre "Pierina Salón" en toda la app</span>
              </label>
              <input
                type="text"
                value={eslogan}
                onChange={(e) => setEslogan(e.target.value)}
                placeholder="Ej: Cejas, pestañas y más"
                className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                Dirección Física del Salón:
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, Número, Colonia, Ciudad"
                className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              />
            </div>
          </div>

          {/* SISTEMA DE MONEDA Y DIVISA */}
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#B85D75]" />
                Moneda / Símbolo de Precios en Toda la App
              </h4>
              <span className="rounded-lg bg-[#FAF0E6] px-2.5 py-1 text-xs font-bold text-[#B85D75] border border-[#E6D7CB]">
                Vista previa: {moneda}25.00
              </span>
            </div>

            <p className="text-xs text-[#6B5E59]">
              Configura el símbolo de moneda de tu país (ej. <strong>B/.</strong> para Panamá, <strong>$</strong> para Dólares/Pesos, <strong>€</strong> para Euros). Se aplicará en el catálogo, citas, administración y mensajes de WhatsApp.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Símbolo o Código de Moneda Personalizado:
                </label>
                <input
                  type="text"
                  required
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  placeholder="Ej: B/., $, €, S/., Bs., RD$, ₡, Q..."
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] font-bold focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8C7A70] mb-1">
                  Opciones Rápidas por País:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🇵🇦 B/. (Panamá)', val: 'B/. ' },
                    { label: '🇺🇸 / 🇲🇽 $ (USD / Pesos)', val: '$' },
                    { label: '🇪🇺 € (Euros)', val: '€' },
                    { label: '🇵🇪 S/. (Perú)', val: 'S/. ' },
                    { label: '🇻🇪 / 🇧🇴 Bs. (Bolívares / Bolivianos)', val: 'Bs. ' },
                    { label: '🇨🇷 ₡ (Costa Rica)', val: '₡' },
                    { label: '🇩🇴 RD$ (Rep. Dominicana)', val: 'RD$ ' },
                    { label: '🇬🇹 Q (Guatemala)', val: 'Q ' },
                  ].map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setMoneda(m.val)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition cursor-pointer ${
                        moneda.trim() === m.val.trim()
                          ? 'border-[#B85D75] bg-[#FAF0E6] text-[#B85D75] font-bold shadow-2xs'
                          : 'border-[#EAE0D5] bg-[#FAF6F0] text-[#5A4D48] hover:bg-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Horarios, Zona Horaria y Seguridad */}
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424]">
              Horarios, Zona Horaria & Seguridad
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                🌐 Zona / Huso Horario del Salón:
              </label>
              <select
                value={zonaHoraria}
                onChange={(e) => setZonaHoraria(e.target.value)}
                className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0] p-2.5 text-xs text-[#2D2424] font-semibold focus:border-[#B85D75] focus:outline-hidden"
              >
                <option value="America/Panama">🇵🇦 Panamá (GMT-5) - [Por Defecto]</option>
                <option value="America/Costa_Rica">🇨🇷 Costa Rica / Centroamérica (GMT-6)</option>
                <option value="America/Bogota">🇨🇴 Colombia / Bogotá (GMT-5)</option>
                <option value="America/Lima">🇵🇪 Perú / Lima (GMT-5)</option>
                <option value="America/Mexico_City">🇲🇽 México / CDMX (GMT-6)</option>
                <option value="America/Caracas">🇻🇪 Venezuela / Caracas (GMT-4)</option>
                <option value="America/Santo_Domingo">🇩🇴 Rep. Dominicana (GMT-4)</option>
                <option value="America/Santiago">🇨🇱 Chile / Santiago (GMT-4)</option>
                <option value="America/Argentina/Buenos_Aires">🇦🇷 Argentina / Buenos Aires (GMT-3)</option>
                <option value="America/New_York">🇺🇸 Estados Unidos (Miami / New York - GMT-5)</option>
                <option value="Europe/Madrid">🇪🇸 España / Madrid (GMT+1)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Apertura:
                </label>
                <input
                  type="time"
                  value={horarioApertura}
                  onChange={(e) => setHorarioApertura(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Cierre:
                </label>
                <input
                  type="time"
                  value={horarioCierre}
                  onChange={(e) => setHorarioCierre(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                />
              </div>
            </div>

            {/* Resumen de Claves de Colaboradoras */}
            <div className="rounded-xl bg-[#FAF6F0] p-3 border border-[#EFE7DE] space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A70] block">
                🔒 Seguridad y Claves de Acceso:
              </span>
              <p className="text-[11px] text-[#5A4D48] leading-relaxed">
                Todas las contraseñas de las colaboradoras son privadas e intransferibles. Si alguna colaboradora olvida su clave, el administrador puede restablecerla en el <strong>Gestor de Colaboradoras</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#5A4D48] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertaSonora}
                  onChange={(e) => setAlertaSonora(e.target.checked)}
                  className="rounded border-[#E6D7CB] text-[#B85D75]"
                />
                <span>Emitir timbre sonoro con nuevas solicitudes</span>
              </label>

              <button
                type="button"
                onClick={handleProbarSonido}
                className="flex items-center gap-1 text-xs text-[#B85D75] font-semibold hover:underline"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Probar Sonido
              </button>
            </div>
          </div>

          {/* LÍMITE MÁXIMO DE COLABORADORAS (EXCLUSIVO SUPERUSUARIO: 1 A 50) */}
          {esSuperAdmin && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-800" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                    Límite Máximo de Colaboradoras (1 a 50)
                  </h4>
                </div>
                <span className="rounded-md bg-amber-200/80 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  👑 Superusuario
                </span>
              </div>

              <p className="text-xs text-amber-900/80">
                Como <strong>Superusuario</strong>, puedes aumentar o reducir la capacidad de colaboradoras permitidas en el sistema (entre 1 y 50).
              </p>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={maxColaboradores}
                    onChange={(e) => setMaxColaboradores(Number(e.target.value))}
                    className="w-full accent-[#B85D75] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-900/70 font-semibold px-0.5">
                    <span>1</span>
                    <span>10</span>
                    <span>25</span>
                    <span>50 colaboradoras</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 shrink-0 shadow-2xs">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxColaboradores}
                    onChange={(e) => {
                      const val = Math.min(50, Math.max(1, Number(e.target.value) || 1));
                      setMaxColaboradores(val);
                    }}
                    className="w-10 text-center text-xs font-bold text-[#2D2424] focus:outline-hidden"
                  />
                  <span className="text-[11px] font-bold text-amber-900">Máx.</span>
                </div>
              </div>

              <div className="rounded-lg bg-white/80 p-2 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                <span>Registradas actualmente: <strong>{colaboradores.length}</strong></span>
                <span>Capacidad disponible: <strong>{Math.max(0, maxColaboradores - colaboradores.length)}</strong> lugares libres</span>
              </div>
            </div>
          )}

          {/* LÍMITE MÁXIMO DE ADMINISTRADORES (EXCLUSIVO SUPERUSUARIO: 1 A 50) */}
          {esSuperAdmin && (
            <div className="rounded-2xl border border-purple-300 bg-purple-50/60 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-800" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                    Límite Máximo de Administradores (1 a 50)
                  </h4>
                </div>
                <span className="rounded-md bg-purple-200/80 border border-purple-300 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                  👑 Superusuario
                </span>
              </div>

              <p className="text-xs text-purple-900/80">
                Como <strong>Superusuario</strong>, puedes definir la cantidad máxima de administradores o recepcionistas con permisos de gestión (entre 1 y 50).
              </p>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={maxAdministradores}
                    onChange={(e) => setMaxAdministradores(Number(e.target.value))}
                    className="w-full accent-purple-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-purple-900/70 font-semibold px-0.5">
                    <span>1</span>
                    <span>10</span>
                    <span>25</span>
                    <span>50 administradores</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-3 py-1.5 shrink-0 shadow-2xs">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxAdministradores}
                    onChange={(e) => {
                      const val = Math.min(50, Math.max(1, Number(e.target.value) || 1));
                      setMaxAdministradores(val);
                    }}
                    className="w-10 text-center text-xs font-bold text-[#2D2424] focus:outline-hidden"
                  />
                  <span className="text-[11px] font-bold text-purple-900">Máx.</span>
                </div>
              </div>

              <div className="rounded-lg bg-white/80 p-2 border border-purple-200 text-[11px] text-purple-900 flex items-center justify-between">
                <span>Administradores creados: <strong>{configuracion.administradores?.length || 0}</strong></span>
                <span>Cupos disponibles: <strong>{Math.max(0, maxAdministradores - (configuracion.administradores?.length || 0))}</strong> libres</span>
              </div>
            </div>
          )}

          {/* Conexión Firebase (SÓLO VISIBLE PARA EL SUPERUSUARIO) */}
          {esSuperAdmin && (
            <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#B85D75]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424]">
                    Sincronización Cloud Firebase Firestore (Superusuario)
                  </h4>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isFirebaseConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#FAF0E6] text-[#8C5845]'
                  }`}
                >
                  {isFirebaseConnected ? '🟢 Conectado' : 'Sistema Local'}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-[#6B5E59] mb-0.5">API Key:</label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    className="w-full rounded-lg border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#6B5E59] mb-0.5">Project ID:</label>
                  <input
                    type="text"
                    placeholder="mi-salon-app"
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    className="w-full rounded-lg border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MANTENIMIENTO Y ALMACENAMIENTO LOCAL OFFLINE (7 DÍAS) */}
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424] flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-[#B85D75]" />
                Almacenamiento Local y Persistencia Offline
              </h4>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline ? 'Online (Nube)' : 'Modo Offline'}
              </span>
            </div>

            <p className="text-xs text-[#6B5E59]">
              El sistema guarda los datos en la memoria del teléfono o computadora para funcionar sin internet. Cuando recuperas la conexión, tus cambios se sincronizan automáticamente.
            </p>

            <div className="rounded-xl bg-[#FAF6F0] p-3 border border-[#EFE7DE] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#3D322E]">
                  🧹 Poda automática de memoria (Cada 7 días):
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Activa
                </span>
              </div>
              <p className="text-[11px] text-[#8C7A70]">
                Para no saturar los celulares de las colaboradoras, las citas completadas/rechazadas de más de 7 días se purgan de la memoria local del equipo (quedan seguras en la nube).
              </p>

              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const res = limpiarCacheLocal7Dias(true);
                    setMensajeLimpieza(
                      res.purgadas > 0
                        ? `¡Optimización completada! Se purgaron ${res.purgadas} registros antiguos (${res.espacioLiberadoAprox} liberados).`
                        : 'El almacenamiento ya está 100% optimizado y sin saturación.'
                    );
                    setTimeout(() => setMensajeLimpieza(null), 5000);
                  }}
                  className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-1.5 text-xs font-bold text-[#5A4D48] hover:bg-[#F4EDE4] transition shadow-2xs cursor-pointer"
                >
                  Liberar memoria local ahora
                </button>

                {mensajeLimpieza && (
                  <span className="text-[11px] font-semibold text-emerald-700 animate-in fade-in">
                    {mensajeLimpieza}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reset */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar datos de prueba
            </button>

            {guardadoExito && (
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <Check className="h-4 w-4" />
                ¡Cambios guardados!
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-[#E8DCCF] pt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48] border border-[#E6D7CB]"
          >
            Cancelar
          </button>

          <button
            onClick={handleGuardar}
            className="rounded-xl bg-rose-gold-gradient px-6 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
