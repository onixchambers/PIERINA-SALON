'use client';

import React, { useState, useEffect } from 'react';
import { useSalon } from '@/context/SalonContext';
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload, HardDriveDownload } from 'lucide-react';

export default function OfflineSyncBanner() {
  const { isOnline, pendingSyncCount, isSyncingOffline, forzarSincronizacionOffline } = useSalon();
  const [mostrarExito, setMostrarExito] = useState(false);
  const [ultimoEstadoOnline, setUltimoEstadoOnline] = useState(isOnline);

  useEffect(() => {
    // Si pasamos de offline a online y no hay cambios pendientes, mostrar confirmación temporal
    if (!ultimoEstadoOnline && isOnline && pendingSyncCount === 0) {
      setMostrarExito(true);
      const timer = setTimeout(() => setMostrarExito(false), 4000);
      return () => clearTimeout(timer);
    }
    setUltimoEstadoOnline(isOnline);
  }, [isOnline, pendingSyncCount, ultimoEstadoOnline]);

  if (isOnline && pendingSyncCount === 0 && !mostrarExito && !isSyncingOffline) {
    return null;
  }

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-lg animate-in slide-in-from-top duration-300">
      {/* Banner Sin Conexión */}
      {!isOnline && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/80 bg-amber-50/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-amber-900/10 text-[#5A3A1E]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <WifiOff className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Modo Fuera de Línea (Activo)
                </span>
                {pendingSyncCount > 0 && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-900">
                    {pendingSyncCount} {pendingSyncCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800 truncate">
                Tus cambios se guardan localmente y se sincronizarán al volver internet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner con cambios pendientes y conexión disponible */}
      {isOnline && pendingSyncCount > 0 && !isSyncingOffline && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-300/80 bg-blue-50/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-blue-900/10 text-blue-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <CloudUpload className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                {pendingSyncCount} {pendingSyncCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
              </span>
              <p className="text-[11px] text-blue-800 truncate">
                Listo para sincronizar con la base de datos en la nube.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => forzarSincronizacionOffline()}
            className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-xs"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Sincronizar</span>
          </button>
        </div>
      )}

      {/* Banner Sincronizando al recuperar internet */}
      {isOnline && isSyncingOffline && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-300/80 bg-blue-50/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-blue-900/10 text-blue-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Sincronizando con la Nube...
              </span>
              <p className="text-[11px] text-blue-800 truncate">
                Subiendo {pendingSyncCount} {pendingSyncCount === 1 ? 'cambio guardado' : 'cambios guardados'} en tu dispositivo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner Sincronización Exitosa */}
      {isOnline && !isSyncingOffline && mostrarExito && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300/80 bg-emerald-50/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-emerald-900/10 text-emerald-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                ¡Conexión Restablecida!
              </span>
              <p className="text-[11px] text-emerald-800 truncate">
                Todos tus datos locales se sincronizaron exitosamente con la nube.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
