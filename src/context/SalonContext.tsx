'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Cita,
  Servicio,
  Colaborador,
  Terapeuta,
  BloqueoDisponibilidad,
  ConfiguracionSalon,
  EstadoCita,
  Especialidad,
  UsuarioSesion,
  AdministradorAdicional,
} from '@/types/salon';
import {
  CONFIG_INICIAL,
  SERVICIOS_INICIALES,
  COLABORADORES_INICIALES,
  CITAS_INICIALES,
  BLOQUEOS_INICIALES,
  ESPECIALIDADES_INICIALES,
  generarPasswordPorDefecto,
} from '@/lib/seedData';
import { soundService } from '@/lib/sound';
import { initFirebase } from '@/lib/firebase';
import {
  STORAGE_KEYS,
  obtenerColaOffline,
  encolarAccionOffline,
  sincronizarColaConFirestore,
  ejecutarMantenimientoLocalStorage7Dias,
} from '@/lib/offlineManager';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';

export interface LoginResultado {
  exito: boolean;
  sesion?: UsuarioSesion;
  errorMotivo?: string;
}

interface SalonContextType {
  citas: Cita[];
  servicios: Servicio[];
  colaboradores: Colaborador[];
  terapeutas: Colaborador[]; // Alias de retrocompatibilidad
  especialidades: Especialidad[];
  bloqueos: BloqueoDisponibilidad[];
  configuracion: ConfiguracionSalon;
  isFirebaseConnected: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncingOffline: boolean;
  cargando: boolean;
  usuarioSesion: UsuarioSesion | null;
  nuevaSolicitudNotificacion: Cita | null;
  loginPorPin: (pin: string) => LoginResultado;
  logout: () => void;
  descartarNotificacion: () => void;
  limpiarCacheLocal7Dias: (forzar?: boolean) => { purgadas: number; espacioLiberadoAprox: string };
  crearCita: (datos: {
    clienteNombre: string;
    clienteTelefono: string;
    clienteNotas?: string;
    fotoReferencia?: string | null;
    terapeutaId: string;
    colaboradorId?: string;
    servicioIds: string[];
    fecha: string;
    horaInicio: string;
    horaFin: string;
    precioTotal: number;
    duracionTotalMin: number;
    origen?: 'web_cliente' | 'admin_manual';
  }) => Promise<Cita>;
  actualizarEstadoCita: (id: string, nuevoEstado: EstadoCita) => Promise<void>;
  eliminarCita: (id: string) => Promise<void>;
  reprogramarCita: (
    citaId: string,
    nuevaFecha: string,
    nuevaHoraInicio: string,
    nuevoColaboradorId?: string
  ) => Promise<void>;
  guardarServicio: (servicio: Servicio) => Promise<void>;
  eliminarServicio: (id: string) => Promise<void>;
  guardarColaborador: (colaborador: Colaborador) => Promise<void>;
  guardarTerapeuta: (terapeuta: Colaborador) => Promise<void>; // Alias
  eliminarColaborador: (id: string) => Promise<void>;
  eliminarTerapeuta: (id: string) => Promise<void>; // Alias
  cambiarPinColaborador: (colaboradorId: string, nuevoPin: string) => Promise<void>;
  actualizarFotoColaborador: (colaboradorId: string, nuevaFoto: string | null) => Promise<void>;
  resetearPasswordColaborador: (colaboradorId: string) => Promise<string>;
  toggleRestriccionColaborador: (
    colaboradorId: string,
    restringido: boolean,
    motivo?: string
  ) => Promise<void>;
  cambiarPinAdmin: (nuevoPin: string) => Promise<void>;
  guardarAdministrador: (admin: AdministradorAdicional) => Promise<void>;
  eliminarAdministrador: (id: string) => Promise<void>;
  guardarEspecialidad: (especialidad: Especialidad) => Promise<void>;
  eliminarEspecialidad: (id: string) => Promise<void>;
  agregarBloqueo: (bloqueo: Omit<BloqueoDisponibilidad, 'id' | 'creadoEn'>) => Promise<void>;
  eliminarBloqueo: (id: string) => Promise<void>;
  desbloquearTodoElDia: (fecha: string, colaboradorId?: string) => Promise<void>;
  reprogramarBloqueo: (
    id: string,
    nuevaFecha: string,
    nuevaHoraInicio?: string,
    nuevaHoraFin?: string,
    nuevoColaboradorId?: string
  ) => Promise<void>;
  actualizarConfiguracion: (nuevaConfig: Partial<ConfiguracionSalon>) => Promise<void>;
  resetearADatosPorDefecto: () => void;
}

const SalonContext = createContext<SalonContextType | null>(null);

function generarCodigoCita(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PIER-${num}`;
}

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const [citas, setCitas] = useState<Cita[]>(CITAS_INICIALES);
  const [servicios, setServicios] = useState<Servicio[]>(SERVICIOS_INICIALES);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(COLABORADORES_INICIALES);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>(ESPECIALIDADES_INICIALES);
  const [bloqueos, setBloqueos] = useState<BloqueoDisponibilidad[]>(BLOQUEOS_INICIALES);
  const [configuracion, setConfiguracion] = useState<ConfiguracionSalon>(CONFIG_INICIAL);
  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioSesion | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [nuevaSolicitudNotificacion, setNuevaSolicitudNotificacion] = useState<Cita | null>(null);

  const dbRef = useRef<Firestore | null>(null);
  const unsubsRef = useRef<Unsubscribe[]>([]);
  const citasCountRef = useRef<number>(CITAS_INICIALES.length);
  const citasIdsRef = useRef<Set<string>>(new Set(CITAS_INICIALES.map((c) => c.id)));

  // Sincronizar cola de acciones pendientes hacia Firestore
  const ejecutarSincronizacionOffline = useCallback(async () => {
    if (!dbRef.current || !navigator.onLine) return;
    const cola = obtenerColaOffline();
    if (cola.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setIsSyncingOffline(true);
    try {
      const { sincronizadas } = await sincronizarColaConFirestore(dbRef.current, (restantes) => {
        setPendingSyncCount(restantes);
      });
      if (sincronizadas > 0) {
        soundService.playSuccess();
      }
    } catch (err) {
      console.warn('Error sincronizando cola offline:', err);
    } finally {
      setIsSyncingOffline(false);
      setPendingSyncCount(obtenerColaOffline().length);
    }
  }, []);

  // Función de mantenimiento y limpieza de caché local de 7 días
  const limpiarCacheLocal7Dias = useCallback((forzar: boolean = false) => {
    const resultado = ejecutarMantenimientoLocalStorage7Dias(citas, forzar);
    if (resultado.purgadas > 0) {
      setCitas(resultado.citasFiltradas);
      citasCountRef.current = resultado.citasFiltradas.length;
      citasIdsRef.current = new Set(resultado.citasFiltradas.map((c) => c.id));
    }
    return {
      purgadas: resultado.purgadas,
      espacioLiberadoAprox: resultado.espacioLiberadoAprox,
    };
  }, [citas]);

  // Helper para persistencia offline-first con encolado inteligente
  const persistirAccion = useCallback(
    async (
      tipo: 'set' | 'delete',
      coleccion: 'citas' | 'servicios' | 'colaboradores' | 'bloqueos' | 'configuracion',
      docId: string,
      datos?: any
    ) => {
      if (dbRef.current && navigator.onLine) {
        try {
          if (tipo === 'set' && datos) {
            await setDoc(doc(dbRef.current, coleccion, docId), datos, { merge: true });
          } else if (tipo === 'delete') {
            await deleteDoc(doc(dbRef.current, coleccion, docId));
          }
          return;
        } catch (err) {
          console.warn(`Fallo de red en ${coleccion}/${docId}, guardando en cola offline:`, err);
        }
      }

      // Si no hay conexión o falló la escritura directa, encolar en localStorage
      const total = encolarAccionOffline({ tipo, coleccion, docId, datos });
      setPendingSyncCount(total);
    },
    []
  );

  // 1. Cargar datos iniciales desde LocalStorage / Seeds y ejecutar mantenimiento de 7 días
  useEffect(() => {
    try {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      setPendingSyncCount(obtenerColaOffline().length);

      // Limpiar claves antiguas en caso de existir
      ['lumina_citas_v2', 'lumina_servicios_v2', 'lumina_colaboradores_v2', 'lumina_especialidades_v2', 'lumina_bloqueos_v2', 'lumina_config_v2'].forEach((k) => {
        localStorage.removeItem(k);
      });

      // Restaurar sesión activa
      const storedSesion = sessionStorage.getItem(STORAGE_KEYS.SESION);
      if (storedSesion) {
        try {
          setUsuarioSesion(JSON.parse(storedSesion));
        } catch {
          // ignore
        }
      }

      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        try {
          const conf = JSON.parse(storedConfig);
          const pinAdminMigrado = conf.pinAdmin && conf.pinAdmin !== '1234' ? conf.pinAdmin : 'pierina123';
          const horarioAperturaMigrado = conf.horarioApertura === '09:00' || !conf.horarioApertura ? '08:00' : conf.horarioApertura;
          const horarioCierreMigrado = conf.horarioCierre === '20:00' || !conf.horarioCierre ? '23:00' : conf.horarioCierre;
          const mergedConfig: ConfiguracionSalon = {
            ...CONFIG_INICIAL,
            ...conf,
            nombreSalon: 'Pierina Salón',
            eslogan: conf.eslogan && !conf.eslogan.includes('consciente') ? conf.eslogan : 'Cejas, pestañas y más',
            logoUrl: conf.logoUrl || '/logo-pierina.png',
            pinAdmin: pinAdminMigrado,
            pinSuperAdmin: conf.pinSuperAdmin || 'onix1974',
            administradores: conf.administradores || [],
            maxColaboradores: conf.maxColaboradores || 50,
            zonaHoraria: conf.zonaHoraria || 'America/Panama',
            horarioApertura: horarioAperturaMigrado,
            horarioCierre: horarioCierreMigrado,
            firebaseConfig: conf.firebaseConfig || CONFIG_INICIAL.firebaseConfig,
          };
          setConfiguracion(mergedConfig);
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(mergedConfig));
        } catch {
          setConfiguracion(CONFIG_INICIAL);
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(CONFIG_INICIAL));
        }
      } else {
        setConfiguracion(CONFIG_INICIAL);
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(CONFIG_INICIAL));
      }

      const storedEsp = localStorage.getItem(STORAGE_KEYS.ESPECIALIDADES);
      if (storedEsp) {
        try {
          const esp = JSON.parse(storedEsp);
          if (Array.isArray(esp) && esp.length > 0) setEspecialidades(esp);
        } catch {
          // ignore
        }
      }

      const storedServ = localStorage.getItem(STORAGE_KEYS.SERVICIOS);
      if (storedServ) {
        try {
          const serv = JSON.parse(storedServ);
          if (Array.isArray(serv) && serv.length > 0) setServicios(serv);
        } catch {
          // ignore
        }
      }

      const storedColab = localStorage.getItem(STORAGE_KEYS.COLABORADORES);
      if (storedColab) {
        try {
          const colabs: Colaborador[] = JSON.parse(storedColab);
          if (Array.isArray(colabs) && colabs.length > 0) {
            const colabsConPin = colabs.map((c) => {
              const inicial = COLABORADORES_INICIALES.find((i) => i.id === c.id);
              const defaultPass = generarPasswordPorDefecto(c.nombre);
              const pinValido = c.pin && !['1111', '2222', '3333', '4444', '1234'].includes(c.pin)
                ? c.pin
                : inicial?.pin || defaultPass;

              return {
                ...c,
                pin: pinValido,
                passwordOriginal: c.passwordOriginal || defaultPass,
                accesoRestringido: c.accesoRestringido || false,
                motivoRestriccion: c.motivoRestriccion || '',
              };
            });
            setColaboradores(colabsConPin);
            localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(colabsConPin));
          }
        } catch {
          // ignore
        }
      }

      const storedBloq = localStorage.getItem(STORAGE_KEYS.BLOQUEOS);
      if (storedBloq) {
        try {
          const bl = JSON.parse(storedBloq);
          if (Array.isArray(bl)) setBloqueos(bl);
        } catch {
          // ignore
        }
      }

      let citasCargadas = CITAS_INICIALES;
      const storedCitas = localStorage.getItem(STORAGE_KEYS.CITAS);
      if (storedCitas) {
        try {
          const cList = JSON.parse(storedCitas);
          if (Array.isArray(cList) && cList.length > 0) {
            citasCargadas = cList;
          }
        } catch {
          // ignore
        }
      }

      // Ejecutar mantenimiento periódico de 7 días en localStorage
      const limpieza = ejecutarMantenimientoLocalStorage7Dias(citasCargadas, false);
      const citasFinales = limpieza.citasFiltradas;
      setCitas(citasFinales);
      citasCountRef.current = citasFinales.length;
      citasIdsRef.current = new Set(citasFinales.map((c) => c.id));

      // Intentar conectar Firebase si hay configuración
      const { db } = initFirebase(configuracion.firebaseConfig);
      if (db) {
        dbRef.current = db;
        setIsFirebaseConnected(true);
        setupFirebaseListeners(db);
        // Sincronizar cola offline si existían acciones pendientes
        ejecutarSincronizacionOffline();
      }
    } catch (e) {
      console.error('Error cargando datos iniciales:', e);
    }

    // Detectores de eventos de conectividad Online / Offline
    const handleOnline = () => {
      setIsOnline(true);
      if (dbRef.current) {
        ejecutarSincronizacionOffline();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.CITAS && e.newValue) {
        try {
          const updatedCitas: Cita[] = JSON.parse(e.newValue);
          const nuevas = updatedCitas.filter(
            (c) => !citasIdsRef.current.has(c.id) && c.estado === 'Pendiente'
          );
          if (nuevas.length > 0) {
            const ultima = nuevas[0];
            setNuevaSolicitudNotificacion(ultima);
            if (configuracion.alertaSonoraActiva) {
              soundService.playChime();
            }
          }
          setCitas(updatedCitas);
          citasCountRef.current = updatedCitas.length;
          citasIdsRef.current = new Set(updatedCitas.map((c) => c.id));
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEYS.OFFLINE_QUEUE) {
        setPendingSyncCount(obtenerColaOffline().length);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      unsubsRef.current.forEach((u) => u());
    };
  }, [ejecutarSincronizacionOffline]);

  const setupFirebaseListeners = (db: Firestore) => {
    unsubsRef.current.forEach((u) => u());
    unsubsRef.current = [];

    const unsubCitas = onSnapshot(collection(db, 'citas'), (snapshot) => {
      const items: Cita[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Cita));

      if (citasIdsRef.current.size > 0) {
        const nuevasPendientes = items.filter(
          (c) => !citasIdsRef.current.has(c.id) && c.estado === 'Pendiente'
        );
        if (nuevasPendientes.length > 0) {
          const nueva = nuevasPendientes[0];
          setNuevaSolicitudNotificacion(nueva);
          soundService.playChime();
        }
      }

      setCitas(items);
      citasCountRef.current = items.length;
      citasIdsRef.current = new Set(items.map((c) => c.id));
      localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(items));
    });

    const unsubServ = onSnapshot(collection(db, 'servicios'), (snapshot) => {
      if (!snapshot.empty) {
        const items: Servicio[] = [];
        snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Servicio));
        setServicios(items);
        localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(items));
      }
    });

    const unsubColab = onSnapshot(collection(db, 'colaboradores'), (snapshot) => {
      if (!snapshot.empty) {
        const items: Colaborador[] = [];
        snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as Colaborador));
        setColaboradores(items);
        localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(items));
      }
    });

    const unsubBloq = onSnapshot(collection(db, 'bloqueos'), (snapshot) => {
      const items: BloqueoDisponibilidad[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as BloqueoDisponibilidad));
      setBloqueos(items);
      localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(items));
    });

    const unsubConfig = onSnapshot(doc(db, 'configuracion', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const confData = docSnap.data() as ConfiguracionSalon;
        setConfiguracion((prev) => ({ ...prev, ...confData }));
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(confData));
      }
    });

    unsubsRef.current = [unsubCitas, unsubServ, unsubColab, unsubBloq, unsubConfig];
  };

  // Autenticación inteligente sin usuario
  const loginPorPin = (pin: string): LoginResultado => {
    const pinLimpio = (pin || '').trim();
    if (!pinLimpio) {
      return { exito: false, errorMotivo: 'Por favor ingresa tu contraseña.' };
    }

    const pinMin = pinLimpio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const confSuperMin = (configuracion.pinSuperAdmin || 'onix1974').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (pinMin === confSuperMin || pinMin === 'onix1974') {
      const sesion: UsuarioSesion = {
        tipo: 'superadmin',
        nombre: 'Superusuario',
        esSuperAdmin: true,
      };
      setUsuarioSesion(sesion);
      sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
      return { exito: true, sesion };
    }

    const confAdminMin = (configuracion.pinAdmin || 'pierina123').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (pinMin === confAdminMin || pinMin === 'pierina123') {
      const sesion: UsuarioSesion = {
        tipo: 'admin',
        nombre: 'Administrador General',
      };
      setUsuarioSesion(sesion);
      sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
      return { exito: true, sesion };
    }

    if (configuracion.administradores && configuracion.administradores.length > 0) {
      const adminAdicional = configuracion.administradores.find((a) => {
        const pinAdminMin = ((a as any).pin || (a as any).password || '')
          .toString()
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const passMin = ((a as any).password || (a as any).pin || '')
          .toString()
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return (pinAdminMin === pinMin || passMin === pinMin) && (a.activo !== false);
      });

      if (adminAdicional) {
        const sesion: UsuarioSesion = {
          tipo: 'admin',
          nombre: adminAdicional.nombre,
          adminId: adminAdicional.id,
        };
        setUsuarioSesion(sesion);
        sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
        return { exito: true, sesion };
      }
    }

    const colab = colaboradores.find((c) => {
      const pinColabMin = (c.pin || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const passOriginalMin = (c.passwordOriginal || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return pinColabMin === pinMin || passOriginalMin === pinMin;
    });

    if (colab) {
      if (colab.accesoRestringido) {
        return {
          exito: false,
          errorMotivo: colab.motivoRestriccion || 'Tu acceso al sistema ha sido suspendido temporalmente. Contacta a administración.',
        };
      }

      const sesion: UsuarioSesion = {
        tipo: 'colaborador',
        nombre: colab.nombre,
        colaboradorId: colab.id,
      };
      setUsuarioSesion(sesion);
      sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
      return { exito: true, sesion };
    }

    return {
      exito: false,
      errorMotivo: 'Contraseña incorrecta. Verifica tus datos o solicita un restablecimiento.',
    };
  };

  const logout = () => {
    setUsuarioSesion(null);
    sessionStorage.removeItem(STORAGE_KEYS.SESION);
  };

  const descartarNotificacion = () => {
    setNuevaSolicitudNotificacion(null);
  };

  // Cambiar PIN de Admin Principal
  const cambiarPinAdmin = async (nuevoPin: string) => {
    const pinLimpio = nuevoPin.trim();
    if (!pinLimpio) return;
    await actualizarConfiguracion({ pinAdmin: pinLimpio });
  };

  // Guardar Administrador Adicional
  const guardarAdministrador = async (admin: AdministradorAdicional) => {
    const listadoActual = configuracion.administradores || [];
    const pinLimpio = (admin.pin || (admin as any).password || '').toString().trim();
    const sanitizedAdmin: AdministradorAdicional = {
      id: admin.id || `admin-${Date.now()}`,
      nombre: admin.nombre.trim(),
      pin: pinLimpio,
      password: pinLimpio,
      activo: admin.activo !== false,
      creadoEn: admin.creadoEn || new Date().toISOString(),
    };

    const existe = listadoActual.some((a) => a.id === sanitizedAdmin.id);
    const updated = existe
      ? listadoActual.map((a) => (a.id === sanitizedAdmin.id ? sanitizedAdmin : a))
      : [...listadoActual, sanitizedAdmin];

    await actualizarConfiguracion({ administradores: updated });
  };

  // Eliminar Administrador Adicional
  const eliminarAdministrador = async (id: string) => {
    const listadoActual = configuracion.administradores || [];
    const updated = listadoActual.filter((a) => a.id !== id);
    await actualizarConfiguracion({ administradores: updated });
  };

  // Cambiar Contraseña / PIN de una colaboradora
  const cambiarPinColaborador = async (colaboradorId: string, nuevoPin: string) => {
    const updated = colaboradores.map((c) => {
      if (c.id === colaboradorId) {
        return { ...c, pin: nuevoPin.trim() };
      }
      return c;
    });

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));
    const target = updated.find((c) => c.id === colaboradorId);
    if (target) {
      await persistirAccion('set', 'colaboradores', colaboradorId, target);
    }
  };

  // Actualizar Foto de Colaboradora
  const actualizarFotoColaborador = async (colaboradorId: string, nuevaFoto: string | null) => {
    const updated = colaboradores.map((c) => {
      if (c.id === colaboradorId) {
        return { ...c, foto: nuevaFoto || undefined };
      }
      return c;
    });

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));
    const target = updated.find((c) => c.id === colaboradorId);
    if (target) {
      await persistirAccion('set', 'colaboradores', colaboradorId, target);
    }
  };

  // Resetear contraseña por defecto de colaboradora
  const resetearPasswordColaborador = async (colaboradorId: string): Promise<string> => {
    const colab = colaboradores.find((c) => c.id === colaboradorId);
    if (!colab) return 'pierina123';

    const defaultPass = colab.passwordOriginal || generarPasswordPorDefecto(colab.nombre);
    const updated = colaboradores.map((c) => {
      if (c.id === colaboradorId) {
        return {
          ...c,
          pin: defaultPass,
          passwordOriginal: defaultPass,
        };
      }
      return c;
    });

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));
    const target = updated.find((c) => c.id === colaboradorId);
    if (target) {
      await persistirAccion('set', 'colaboradores', colaboradorId, target);
    }
    return defaultPass;
  };

  // Bloquear o desbloquear acceso de una colaboradora
  const toggleRestriccionColaborador = async (
    colaboradorId: string,
    restringido: boolean,
    motivo?: string
  ) => {
    const updated = colaboradores.map((c) => {
      if (c.id === colaboradorId) {
        return {
          ...c,
          accesoRestringido: restringido,
          motivoRestriccion: motivo !== undefined ? motivo : c.motivoRestriccion,
        };
      }
      return c;
    });

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));
    const target = updated.find((c) => c.id === colaboradorId);
    if (target) {
      await persistirAccion('set', 'colaboradores', colaboradorId, target);
    }
  };

  // Crear Cita
  const crearCita = async (datos: {
    clienteNombre: string;
    clienteTelefono: string;
    clienteNotas?: string;
    fotoReferencia?: string | null;
    terapeutaId: string;
    colaboradorId?: string;
    servicioIds: string[];
    fecha: string;
    horaInicio: string;
    horaFin: string;
    precioTotal: number;
    duracionTotalMin: number;
    origen?: 'web_cliente' | 'admin_manual';
  }): Promise<Cita> => {
    const targetId = datos.colaboradorId || datos.terapeutaId;
    const nuevaCita: Cita = {
      id: `cita-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      codigo: generarCodigoCita(),
      clienteNombre: datos.clienteNombre.trim(),
      clienteTelefono: datos.clienteTelefono.trim(),
      clienteNotas: datos.clienteNotas?.trim() || '',
      fotoReferencia: datos.fotoReferencia || null,
      terapeutaId: targetId,
      colaboradorId: targetId,
      servicioIds: datos.servicioIds,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      precioTotal: datos.precioTotal,
      duracionTotalMin: datos.duracionTotalMin,
      estado: 'Pendiente',
      creadoEn: new Date().toISOString(),
      origen: datos.origen || 'web_cliente',
    };

    const updated = [nuevaCita, ...citas];
    setCitas(updated);
    citasIdsRef.current.add(nuevaCita.id);
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(updated));

    await persistirAccion('set', 'citas', nuevaCita.id, nuevaCita);

    const esAutoAgendado = datos.origen === 'admin_manual' && usuarioSesion?.tipo === 'colaborador' && (targetId === usuarioSesion.colaboradorId);

    if (!esAutoAgendado) {
      if (configuracion.alertaSonoraActiva) {
        soundService.playChime();
      }
      setNuevaSolicitudNotificacion(nuevaCita);
    }

    return nuevaCita;
  };

  // Actualizar Estado de Cita
  const actualizarEstadoCita = async (id: string, nuevoEstado: EstadoCita) => {
    const updated = citas.map((c) => {
      if (c.id === id) {
        return { ...c, estado: nuevoEstado, actualizadoEn: new Date().toISOString() };
      }
      return c;
    });

    setCitas(updated);
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(updated));

    if (configuracion.alertaSonoraActiva) {
      if (nuevoEstado === 'Confirmada') {
        soundService.playSuccess();
      } else if (nuevoEstado === 'Rechazada') {
        soundService.playReject();
      } else if (nuevoEstado === 'Pendiente') {
        soundService.playPending();
      } else if (nuevoEstado === 'Completada') {
        soundService.playCompleted();
      }
    }

    const target = updated.find((c) => c.id === id);
    if (target) {
      await persistirAccion('set', 'citas', id, target);
    }
  };

  // Eliminar Cita
  const eliminarCita = async (id: string) => {
    const updated = citas.filter((c) => c.id !== id);
    setCitas(updated);
    citasIdsRef.current.delete(id);
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(updated));

    await persistirAccion('delete', 'citas', id);
  };

  // Guardar / Actualizar Servicio
  const guardarServicio = async (servicio: Servicio) => {
    const exists = servicios.some((s) => s.id === servicio.id);
    const updated = exists
      ? servicios.map((s) => (s.id === servicio.id ? servicio : s))
      : [...servicios, servicio];

    setServicios(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(updated));

    await persistirAccion('set', 'servicios', servicio.id, servicio);
  };

  // Eliminar Servicio
  const eliminarServicio = async (id: string) => {
    const updated = servicios.filter((s) => s.id !== id);
    setServicios(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(updated));

    await persistirAccion('delete', 'servicios', id);
  };

  // Guardar / Actualizar Colaborador
  const guardarColaborador = async (colaborador: Colaborador) => {
    const exists = colaboradores.some((t) => t.id === colaborador.id);
    const updated = exists
      ? colaboradores.map((t) => (t.id === colaborador.id ? colaborador : t))
      : [...colaboradores, colaborador];

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));

    await persistirAccion('set', 'colaboradores', colaborador.id, colaborador);
  };

  // Eliminar Colaborador
  const eliminarColaborador = async (id: string) => {
    const updated = colaboradores.filter((t) => t.id !== id);
    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));

    await persistirAccion('delete', 'colaboradores', id);
  };

  // Guardar Especialidad
  const guardarEspecialidad = async (especialidad: Especialidad) => {
    const exists = especialidades.some((e) => e.id === especialidad.id);
    const updated = exists
      ? especialidades.map((e) => (e.id === especialidad.id ? especialidad : e))
      : [...especialidades, especialidad];

    setEspecialidades(updated);
    localStorage.setItem(STORAGE_KEYS.ESPECIALIDADES, JSON.stringify(updated));
  };

  // Eliminar Especialidad
  const eliminarEspecialidad = async (id: string) => {
    const updated = especialidades.filter((e) => e.id !== id);
    setEspecialidades(updated);
    localStorage.setItem(STORAGE_KEYS.ESPECIALIDADES, JSON.stringify(updated));
  };

  // Agregar Bloqueo de Disponibilidad
  const agregarBloqueo = async (bloqueo: Omit<BloqueoDisponibilidad, 'id' | 'creadoEn'>) => {
    const terapeutaIdFinal =
      usuarioSesion?.tipo === 'colaborador' && usuarioSesion.colaboradorId
        ? usuarioSesion.colaboradorId
        : bloqueo.terapeutaId;

    const nuevoBloqueo: BloqueoDisponibilidad = {
      id: `bloq-${Date.now()}`,
      ...bloqueo,
      terapeutaId: terapeutaIdFinal,
      colaboradorId: terapeutaIdFinal,
      creadoEn: new Date().toISOString(),
    };

    const updated = [...bloqueos, nuevoBloqueo];
    setBloqueos(updated);
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(updated));

    await persistirAccion('set', 'bloqueos', nuevoBloqueo.id, nuevoBloqueo);
  };

  // Eliminar Bloqueo
  const eliminarBloqueo = async (id: string) => {
    if (usuarioSesion?.tipo === 'colaborador' && usuarioSesion.colaboradorId) {
      const bloqTarget = bloqueos.find((b) => b.id === id);
      if (
        bloqTarget &&
        bloqTarget.terapeutaId !== usuarioSesion.colaboradorId &&
        bloqTarget.colaboradorId !== usuarioSesion.colaboradorId
      ) {
        console.warn('No tienes permisos para eliminar bloqueos de otra terapeuta');
        return;
      }
    }

    const updated = bloqueos.filter((b) => b.id !== id);
    setBloqueos(updated);
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(updated));

    await persistirAccion('delete', 'bloqueos', id);
  };

  // Desbloquear todos los bloqueos de una fecha para un colaborador o todo el salón
  const desbloquearTodoElDia = async (fecha: string, colaboradorId?: string) => {
    const colabIdFinal =
      usuarioSesion?.tipo === 'colaborador' && usuarioSesion.colaboradorId
        ? usuarioSesion.colaboradorId
        : colaboradorId;

    const toDelete = bloqueos.filter((b) => {
      if (b.fecha !== fecha) return false;
      if (colabIdFinal && colabIdFinal !== 'all') {
        return b.terapeutaId === colabIdFinal || b.colaboradorId === colabIdFinal || b.terapeutaId === 'all';
      }
      return true;
    });

    const updated = bloqueos.filter((b) => {
      if (b.fecha !== fecha) return true;
      if (colabIdFinal && colabIdFinal !== 'all') {
        return b.terapeutaId !== colabIdFinal && b.colaboradorId !== colabIdFinal && b.terapeutaId !== 'all';
      }
      return false;
    });

    setBloqueos(updated);
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(updated));

    for (const b of toDelete) {
      await persistirAccion('delete', 'bloqueos', b.id);
    }
  };

  // Reprogramar / Mover Bloqueo
  const reprogramarBloqueo = async (
    id: string,
    nuevaFecha: string,
    nuevaHoraInicio?: string,
    nuevaHoraFin?: string,
    nuevoColaboradorId?: string
  ) => {
    const updated = bloqueos.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          fecha: nuevaFecha,
          horaInicio: nuevaHoraInicio !== undefined ? nuevaHoraInicio : b.horaInicio,
          horaFin: nuevaHoraFin !== undefined ? nuevaHoraFin : b.horaFin,
          terapeutaId: nuevoColaboradorId || b.terapeutaId,
          colaboradorId: nuevoColaboradorId || b.colaboradorId,
        };
      }
      return b;
    });

    setBloqueos(updated);
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(updated));

    const target = updated.find((b) => b.id === id);
    if (target) {
      await persistirAccion('set', 'bloqueos', id, target);
    }
  };

  // Reprogramar Cita
  const reprogramarCita = async (
    citaId: string,
    nuevaFecha: string,
    nuevaHoraInicio: string,
    nuevoColaboradorId?: string
  ) => {
    const updated = citas.map((c) => {
      if (c.id === citaId) {
        return {
          ...c,
          fecha: nuevaFecha,
          horaInicio: nuevaHoraInicio,
          colaboradorId: nuevoColaboradorId || c.colaboradorId,
          terapeutaId: nuevoColaboradorId || c.terapeutaId,
          actualizadoEn: new Date().toISOString(),
        };
      }
      return c;
    });

    setCitas(updated);
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(updated));

    const target = updated.find((c) => c.id === citaId);
    if (target) {
      await persistirAccion('set', 'citas', citaId, target);
    }
  };

  // Actualizar Configuración
  const actualizarConfiguracion = async (nuevaConfig: Partial<ConfiguracionSalon>) => {
    const updated: ConfiguracionSalon = { ...configuracion, ...nuevaConfig };
    setConfiguracion(updated);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    await persistirAccion('set', 'configuracion', 'general', updated);

    if (nuevaConfig.firebaseConfig) {
      const { db } = initFirebase(nuevaConfig.firebaseConfig);
      if (db) {
        dbRef.current = db;
        setIsFirebaseConnected(true);
        setupFirebaseListeners(db);
      } else {
        setIsFirebaseConnected(false);
      }
    }
  };

  const resetearADatosPorDefecto = () => {
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(CITAS_INICIALES));
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(SERVICIOS_INICIALES));
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(COLABORADORES_INICIALES));
    localStorage.setItem(STORAGE_KEYS.ESPECIALIDADES, JSON.stringify(ESPECIALIDADES_INICIALES));
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(BLOQUEOS_INICIALES));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(CONFIG_INICIAL));
    sessionStorage.removeItem(STORAGE_KEYS.SESION);

    setCitas(CITAS_INICIALES);
    setServicios(SERVICIOS_INICIALES);
    setColaboradores(COLABORADORES_INICIALES);
    setEspecialidades(ESPECIALIDADES_INICIALES);
    setBloqueos(BLOQUEOS_INICIALES);
    setConfiguracion(CONFIG_INICIAL);
    setUsuarioSesion(null);
  };

  return (
    <SalonContext.Provider
      value={{
        citas,
        servicios,
        colaboradores,
        terapeutas: colaboradores, // Alias
        especialidades,
        bloqueos,
        configuracion,
        isFirebaseConnected,
        isOnline,
        pendingSyncCount,
        isSyncingOffline,
        cargando,
        usuarioSesion,
        loginPorPin,
        logout,
        nuevaSolicitudNotificacion,
        descartarNotificacion,
        limpiarCacheLocal7Dias,
        crearCita,
        actualizarEstadoCita,
        eliminarCita,
        guardarServicio,
        eliminarServicio,
        guardarColaborador,
        guardarTerapeuta: guardarColaborador, // Alias
        eliminarColaborador,
        eliminarTerapeuta: eliminarColaborador, // Alias
        cambiarPinColaborador,
        actualizarFotoColaborador,
        resetearPasswordColaborador,
        toggleRestriccionColaborador,
        cambiarPinAdmin,
        guardarAdministrador,
        eliminarAdministrador,
        guardarEspecialidad,
        eliminarEspecialidad,
        agregarBloqueo,
        eliminarBloqueo,
        desbloquearTodoElDia,
        reprogramarBloqueo,
        reprogramarCita,
        actualizarConfiguracion,
        resetearADatosPorDefecto,
      }}
    >
      {children}
    </SalonContext.Provider>
  );
}

export function useSalon() {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon debe utilizarse dentro de un SalonProvider');
  }
  return context;
}
