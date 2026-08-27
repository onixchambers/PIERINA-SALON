'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSalon } from '@/context/SalonContext';
import {
  Sparkles,
  Calendar,
  Lock,
  Menu,
  X,
  Phone,
  Clock,
  MapPin,
  Flame,
  Volume2,
  VolumeX,
  Database,
  Download,
} from 'lucide-react';
import { soundService } from '@/lib/sound';

interface NavbarProps {
  onOpenCatalog?: () => void;
  onOpenLookup?: () => void;
}

export default function Navbar({ onOpenCatalog, onOpenLookup }: NavbarProps) {
  const pathname = usePathname();
  const { configuracion, citas, isFirebaseConnected, actualizarConfiguracion } = useSalon();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalable, setPwaInstalable] = useState(false);

  const pendientesCount = citas.filter((c) => c.estado === 'Pendiente').length;
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration:', err);
      });
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaInstalable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaInstalable(false);
    }
    setDeferredPrompt(null);
  };

  const toggleSonido = () => {
    const nuevo = !configuracion.alertaSonoraActiva;
    actualizarConfiguracion({ alertaSonoraActiva: nuevo });
    if (nuevo) {
      soundService.playChime();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8DCCF] bg-[#FAF6F0]/90 backdrop-blur-md transition-all">
      {/* Barra superior de aviso / contacto */}
      <div className="hidden border-b border-[#EFE7DE] bg-[#F4EDE4] px-4 py-1 text-xs text-[#6B5E59] sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-[#2D2424]">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Abierto Hoy • {configuracion.horarioApertura} - {configuracion.horarioCierre} hrs
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#B85D75]" />
              {configuracion.direccion}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px]">
              <Database className="h-3 w-3 text-[#B85D75]" />
              <span className={isFirebaseConnected ? 'text-emerald-700 font-semibold' : 'text-[#8C7A70]'}>
                {isFirebaseConnected ? 'Firebase Realtime Cloud' : 'Modo Reactivo Local'}
              </span>
            </div>

            <button
              onClick={toggleSonido}
              title={configuracion.alertaSonoraActiva ? 'Sonido activado' : 'Sonido desactivado'}
              className="flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[11px] text-[#5A4D48] hover:bg-white"
            >
              {configuracion.alertaSonoraActiva ? (
                <>
                  <Volume2 className="h-3 w-3 text-[#B85D75]" />
                  <span>Sonido ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3 w-3 text-stone-400" />
                  <span>Sonido OFF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Barra de navegación principal */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo & Marca (Agrandado y con fondo transparente) */}
        <Link href="/" className="group flex items-center gap-3.5 py-1">
          <img
            src={configuracion.logoUrl || '/logo-pierina.png'}
            alt="Logo Pierina Salón"
            className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md transition-transform group-hover:scale-105"
          />
          <div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#2D2424] sm:text-2xl block leading-tight">
              {configuracion.nombreSalon}
            </span>
            <span className="text-xs text-[#8C7A70] tracking-wide block font-medium">
              {configuracion.eslogan || 'Cejas, pestañas y más'}
            </span>
          </div>
        </Link>

        {/* Botones de acción Desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {!isAdmin ? (
            <>
              {onOpenCatalog && (
                <button
                  onClick={onOpenCatalog}
                  className="px-3.5 py-2 text-sm font-medium text-[#5A4D48] hover:text-[#B85D75] hover:bg-[#F3ECE2] rounded-xl transition"
                >
                  Servicios y Precios
                </button>
              )}

              {onOpenLookup && (
                <button
                  onClick={onOpenLookup}
                  className="px-3.5 py-2 text-sm font-medium text-[#5A4D48] hover:text-[#B85D75] hover:bg-[#F3ECE2] rounded-xl transition"
                >
                  Consultar mi Cita
                </button>
              )}

              {pwaInstalable && (
                <button
                  onClick={handleInstallPWA}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#B85D75] bg-[#FCEEE9] hover:bg-[#F8DFD7] border border-[#F2C8BC] rounded-xl transition shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Instalar App
                </button>
              )}

              <Link
                href="/admin"
                className="relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5A4D48] bg-white border border-[#E6D7CB] rounded-xl hover:border-[#B85D75] hover:text-[#B85D75] transition shadow-xs"
              >
                <Lock className="h-3.5 w-3.5" />
                Portal Colaboradoras
                {pendientesCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B85D75] px-1 text-[10px] font-bold text-white shadow-xs animate-soft-pulse">
                    {pendientesCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5A4D48] bg-white border border-[#E6D7CB] rounded-xl hover:border-[#B85D75] hover:text-[#B85D75] transition shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#B85D75]" />
                Ver Portal Cliente
              </Link>
            </>
          )}
        </nav>

        {/* Botón Móvil Menú */}
        <div className="flex items-center gap-2 md:hidden">
          {pwaInstalable && (
            <button
              onClick={handleInstallPWA}
              className="flex items-center gap-1 p-2 text-xs font-medium text-[#B85D75] bg-[#FCEEE9] rounded-xl border border-[#F2C8BC]"
            >
              <Download className="h-4 w-4" />
            </button>
          )}

          <Link
            href="/admin"
            className="relative p-2 text-[#5A4D48] bg-white border border-[#E6D7CB] rounded-xl hover:text-[#B85D75]"
          >
            <Lock className="h-4 w-4" />
            {pendientesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B85D75] text-[9px] font-bold text-white">
                {pendientesCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="p-2 text-[#5A4D48] hover:bg-[#F3ECE2] rounded-xl transition"
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {menuAbierto && (
        <div className="border-t border-[#E8DCCF] bg-[#FAF6F0] px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 border-b border-[#EFE7DE] text-xs text-[#6B5E59]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#B85D75]" />
                {configuracion.horarioApertura} - {configuracion.horarioCierre} hrs
              </span>
              <button
                onClick={toggleSonido}
                className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-[#5A4D48] border border-[#E6D7CB]"
              >
                {configuracion.alertaSonoraActiva ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-[#B85D75]" />
                    <span>Sonido ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-stone-400" />
                    <span>Sonido OFF</span>
                  </>
                )}
              </button>
            </div>

            {!isAdmin ? (
              <>
                {onOpenCatalog && (
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      onOpenCatalog();
                    }}
                    className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#3D322E] hover:bg-[#F3ECE2] rounded-xl"
                  >
                    🌸 Catálogo de Servicios y Precios
                  </button>
                )}

                {onOpenLookup && (
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      onOpenLookup();
                    }}
                    className="w-full text-left py-2.5 px-3 text-sm font-medium text-[#3D322E] hover:bg-[#F3ECE2] rounded-xl"
                  >
                    🔍 Consultar Estado de mi Cita
                  </button>
                )}

                <Link
                  href="/admin"
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center justify-between py-2.5 px-3 text-sm font-medium text-[#B85D75] bg-[#FCEEE9] rounded-xl"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Portal Colaboradoras / Admin
                  </span>
                  {pendientesCount > 0 && (
                    <span className="rounded-full bg-[#B85D75] px-2 py-0.5 text-[11px] font-bold text-white">
                      {pendientesCount} pendientes
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <Link
                href="/"
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-2 py-2.5 px-3 text-sm font-medium text-[#3D322E] hover:bg-[#F3ECE2] rounded-xl"
              >
                <Sparkles className="h-4 w-4 text-[#B85D75]" />
                Regresar al Portal Cliente
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
