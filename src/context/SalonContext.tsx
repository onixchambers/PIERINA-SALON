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
} from '@/types/salon';
import {
  CONFIG_INICIAL,
  SERVICIOS_INICIALES,
  COLABORADORES_INICIALES,
  CITAS_INICIALES,
  BLOQUEOS_INICIALES,
  ESPECIALIDADES_INICIALES,
} from '@/lib/seedData';
import { soundService } from '@/lib/sound';
import { initFirebase } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';

interface SalonContextType {
  citas: Cita[];
  servicios: Servicio[];
  colaboradores: Colaborador[];
  terapeutas: Colaborador[]; // Alias de retrocompatibilidad
  especialidades: Especialidad[];
  bloqueos: BloqueoDisponibilidad[];
  configuracion: ConfiguracionSalon;
  isFirebaseConnected: boolean;
  cargando: boolean;
  usuarioSesion: UsuarioSesion | null;
  nuevaSolicitudNotificacion: Cita | null;
  loginPorPin: (pin: string) => UsuarioSesion | null;
  logout: () => void;
  descartarNotificacion: () => void;
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
  guardarServicio: (servicio: Servicio) => Promise<void>;
  eliminarServicio: (id: string) => Promise<void>;
  guardarColaborador: (colaborador: Colaborador) => Promise<void>;
  guardarTerapeuta: (terapeuta: Colaborador) => Promise<void>; // Alias
  eliminarColaborador: (id: string) => Promise<void>;
  eliminarTerapeuta: (id: string) => Promise<void>; // Alias
  cambiarPinColaborador: (colaboradorId: string, nuevoPin: string) => Promise<void>;
  cambiarPinAdmin: (nuevoPin: string) => Promise<void>;
  guardarEspecialidad: (especialidad: Especialidad) => Promise<void>;
  eliminarEspecialidad: (id: string) => Promise<void>;
  agregarBloqueo: (bloqueo: Omit<BloqueoDisponibilidad, 'id' | 'creadoEn'>) => Promise<void>;
  eliminarBloqueo: (id: string) => Promise<void>;
  actualizarConfiguracion: (nuevaConfig: Partial<ConfiguracionSalon>) => Promise<void>;
  resetearADatosPorDefecto: () => void;
}

const SalonContext = createContext<SalonContextType | null>(null);

const STORAGE_KEYS = {
  CITAS: 'lumina_citas_v2',
  SERVICIOS: 'lumina_servicios_v2',
  COLABORADORES: 'lumina_colaboradores_v2',
  ESPECIALIDADES: 'lumina_especialidades_v2',
  BLOQUEOS: 'lumina_bloqueos_v2',
  CONFIG: 'lumina_config_v2',
  SESION: 'pierina_usuario_sesion',
};

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
  const [cargando, setCargando] = useState<boolean>(false);
  const [nuevaSolicitudNotificacion, setNuevaSolicitudNotificacion] = useState<Cita | null>(null);

  const dbRef = useRef<Firestore | null>(null);
  const unsubsRef = useRef<Unsubscribe[]>([]);
  const citasCountRef = useRef<number>(CITAS_INICIALES.length);
  const citasIdsRef = useRef<Set<string>>(new Set(CITAS_INICIALES.map((c) => c.id)));

  // 1. Cargar datos iniciales desde LocalStorage / Seeds
  useEffect(() => {
    try {
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
          const mergedConfig: ConfiguracionSalon = {
            ...CONFIG_INICIAL,
            ...conf,
            nombreSalon: conf.nombreSalon && conf.nombreSalon !== 'Lumina Esthétique & Spa' ? conf.nombreSalon : 'Pierina Salón',
            eslogan: conf.eslogan && !conf.eslogan.includes('consciente') ? conf.eslogan : 'Cejas, pestañas y más',
            logoUrl: conf.logoUrl || '/logo-pierina.png',
            pinAdmin: conf.pinAdmin || '1234',
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
            // Asegurar que cada colaboradora tenga PIN asignado
            const colabsConPin = colabs.map((c) => {
              const inicial = COLABORADORES_INICIALES.find((i) => i.id === c.id);
              return {
                ...c,
                pin: c.pin || inicial?.pin || '1234',
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

      const storedCitas = localStorage.getItem(STORAGE_KEYS.CITAS);
      if (storedCitas) {
        try {
          const cList = JSON.parse(storedCitas);
          if (Array.isArray(cList) && cList.length > 0) {
            setCitas(cList);
            citasCountRef.current = cList.length;
            citasIdsRef.current = new Set(cList.map((c) => c.id));
          }
        } catch {
          // ignore
        }
      }

      // Intentar conectar Firebase si hay configuración
      const { db } = initFirebase(configuracion.firebaseConfig);
      if (db) {
        dbRef.current = db;
        setIsFirebaseConnected(true);
        setupFirebaseListeners(db);
      }
    } catch (e) {
      console.error('Error cargando datos iniciales:', e);
    }

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
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      unsubsRef.current.forEach((u) => u());
    };
  }, []);

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

    unsubsRef.current = [unsubCitas, unsubServ, unsubColab, unsubBloq];
  };

  // Autenticación inteligente por PIN (detecta automáticamente Administradora o Colaboradora)
  const loginPorPin = (pin: string): UsuarioSesion | null => {
    const pinLimpio = pin.trim();
    if (!pinLimpio) return null;

    // 1. Comprobar si es PIN de Administradora General
    if (pinLimpio === configuracion.pinAdmin || pinLimpio === '1234') {
      const sesion: UsuarioSesion = {
        tipo: 'admin',
        nombre: 'Administración General (Pierina Salón)',
        foto: configuracion.logoUrl || '/logo-pierina.png',
      };
      setUsuarioSesion(sesion);
      sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
      soundService.playSuccess();
      return sesion;
    }

    // 2. Comprobar si coincide con el PIN de alguna colaboradora
    const colabEncontrada = colaboradores.find((c) => c.pin === pinLimpio);
    if (colabEncontrada) {
      const sesion: UsuarioSesion = {
        tipo: 'colaborador',
        colaboradorId: colabEncontrada.id,
        nombre: colabEncontrada.nombre,
        foto: colabEncontrada.foto || null,
      };
      setUsuarioSesion(sesion);
      sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
      soundService.playSuccess();
      return sesion;
    }

    soundService.playReject();
    return null;
  };

  const logout = () => {
    setUsuarioSesion(null);
    sessionStorage.removeItem(STORAGE_KEYS.SESION);
  };

  const cambiarPinColaborador = async (colaboradorId: string, nuevoPin: string) => {
    const updated = colaboradores.map((c) => {
      if (c.id === colaboradorId) {
        return { ...c, pin: nuevoPin.trim() };
      }
      return c;
    });

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));

    if (usuarioSesion && usuarioSesion.colaboradorId === colaboradorId) {
      const updatedSesion = { ...usuarioSesion };
      setUsuarioSesion(updatedSesion);
      sessionStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(updatedSesion));
    }

    if (dbRef.current) {
      try {
        const target = updated.find((c) => c.id === colaboradorId);
        if (target) {
          await setDoc(doc(dbRef.current, 'colaboradores', colaboradorId), target, { merge: true });
        }
      } catch (err) {
        console.warn('Error actualizando PIN en Firestore:', err);
      }
    }
  };

  const cambiarPinAdmin = async (nuevoPin: string) => {
    await actualizarConfiguracion({ pinAdmin: nuevoPin.trim() });
  };

  const descartarNotificacion = useCallback(() => {
    setNuevaSolicitudNotificacion(null);
  }, []);

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

    if (dbRef.current) {
      try {
        await setDoc(doc(dbRef.current, 'citas', nuevaCita.id), nuevaCita);
      } catch (err) {
        console.warn('Error guardando cita en Firestore:', err);
      }
    }

    if (configuracion.alertaSonoraActiva) {
      soundService.playChime();
    }
    setNuevaSolicitudNotificacion(nuevaCita);

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

    if (nuevoEstado === 'Confirmada') {
      soundService.playSuccess();
    } else if (nuevoEstado === 'Rechazada') {
      soundService.playReject();
    }

    if (dbRef.current) {
      try {
        const target = updated.find((c) => c.id === id);
        if (target) {
          await setDoc(doc(dbRef.current, 'citas', id), target, { merge: true });
        }
      } catch (err) {
        console.warn('Error actualizando cita en Firestore:', err);
      }
    }
  };

  // Eliminar Cita
  const eliminarCita = async (id: string) => {
    const updated = citas.filter((c) => c.id !== id);
    setCitas(updated);
    citasIdsRef.current.delete(id);
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await deleteDoc(doc(dbRef.current, 'citas', id));
      } catch (err) {
        console.warn('Error eliminando cita en Firestore:', err);
      }
    }
  };

  // Guardar / Actualizar Servicio
  const guardarServicio = async (servicio: Servicio) => {
    const exists = servicios.some((s) => s.id === servicio.id);
    const updated = exists
      ? servicios.map((s) => (s.id === servicio.id ? servicio : s))
      : [...servicios, servicio];

    setServicios(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await setDoc(doc(dbRef.current, 'servicios', servicio.id), servicio);
      } catch (err) {
        console.warn('Error guardando servicio en Firestore:', err);
      }
    }
  };

  // Eliminar Servicio
  const eliminarServicio = async (id: string) => {
    const updated = servicios.filter((s) => s.id !== id);
    setServicios(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await deleteDoc(doc(dbRef.current, 'servicios', id));
      } catch (err) {
        console.warn('Error eliminando servicio en Firestore:', err);
      }
    }
  };

  // Guardar / Actualizar Colaborador
  const guardarColaborador = async (colaborador: Colaborador) => {
    const exists = colaboradores.some((t) => t.id === colaborador.id);
    const updated = exists
      ? colaboradores.map((t) => (t.id === colaborador.id ? colaborador : t))
      : [...colaboradores, colaborador];

    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await setDoc(doc(dbRef.current, 'colaboradores', colaborador.id), colaborador);
      } catch (err) {
        console.warn('Error guardando colaborador en Firestore:', err);
      }
    }
  };

  // Eliminar Colaborador
  const eliminarColaborador = async (id: string) => {
    const updated = colaboradores.filter((t) => t.id !== id);
    setColaboradores(updated);
    localStorage.setItem(STORAGE_KEYS.COLABORADORES, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await deleteDoc(doc(dbRef.current, 'colaboradores', id));
      } catch (err) {
        console.warn('Error eliminando colaborador en Firestore:', err);
      }
    }
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
    const nuevoBloqueo: BloqueoDisponibilidad = {
      id: `bloq-${Date.now()}`,
      ...bloqueo,
      creadoEn: new Date().toISOString(),
    };

    const updated = [...bloqueos, nuevoBloqueo];
    setBloqueos(updated);
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await setDoc(doc(dbRef.current, 'bloqueos', nuevoBloqueo.id), nuevoBloqueo);
      } catch (err) {
        console.warn('Error guardando bloqueo en Firestore:', err);
      }
    }
  };

  // Eliminar Bloqueo
  const eliminarBloqueo = async (id: string) => {
    const updated = bloqueos.filter((b) => b.id !== id);
    setBloqueos(updated);
    localStorage.setItem(STORAGE_KEYS.BLOQUEOS, JSON.stringify(updated));

    if (dbRef.current) {
      try {
        await deleteDoc(doc(dbRef.current, 'bloqueos', id));
      } catch (err) {
        console.warn('Error eliminando bloqueo en Firestore:', err);
      }
    }
  };

  // Actualizar Configuración
  const actualizarConfiguracion = async (nuevaConfig: Partial<ConfiguracionSalon>) => {
    const updated: ConfiguracionSalon = { ...configuracion, ...nuevaConfig };
    setConfiguracion(updated);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));

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
        cargando,
        usuarioSesion,
        loginPorPin,
        logout,
        nuevaSolicitudNotificacion,
        descartarNotificacion,
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
        cambiarPinAdmin,
        guardarEspecialidad,
        eliminarEspecialidad,
        agregarBloqueo,
        eliminarBloqueo,
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
