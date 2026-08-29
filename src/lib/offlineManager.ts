import { Cita } from '@/types/salon';
import { doc, setDoc, deleteDoc, Firestore } from 'firebase/firestore';

export interface AccionSyncOffline {
  id: string;
  tipo: 'set' | 'delete';
  coleccion: 'citas' | 'servicios' | 'colaboradores' | 'bloqueos' | 'configuracion' | 'productos' | 'transacciones';
  docId: string;
  datos?: any;
  timestamp: number;
}

export const STORAGE_KEYS = {
  CITAS: 'pierina_citas_v1',
  SERVICIOS: 'pierina_servicios_v1',
  COLABORADORES: 'pierina_colaboradores_v1',
  ESPECIALIDADES: 'pierina_especialidades_v1',
  BLOQUEOS: 'pierina_bloqueos_v1',
  CONFIG: 'pierina_config_v1',
  PRODUCTOS: 'pierina_productos_v1',
  TRANSACCIONES: 'pierina_transacciones_v1',
  SESION: 'pierina_usuario_sesion',
  OFFLINE_QUEUE: 'pierina_offline_sync_queue_v1',
  ULTIMA_LIMPIEZA: 'pierina_last_storage_cleanup_v1',
};

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export function obtenerColaOffline(): AccionSyncOffline[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function encolarAccionOffline(accion: Omit<AccionSyncOffline, 'id' | 'timestamp'>): number {
  if (typeof window === 'undefined') return 0;
  try {
    const cola = obtenerColaOffline();
    const nueva: AccionSyncOffline = {
      ...accion,
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    const actualizada = [...cola, nueva];
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(actualizada));
    return actualizada.length;
  } catch (err) {
    console.warn('Error encolando acción offline:', err);
    return 0;
  }
}

export function vaciarColaOffline() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  } catch {
    // ignore
  }
}

export async function sincronizarColaConFirestore(
  db: Firestore,
  onProgreso?: (restantes: number) => void
): Promise<{ sincronizadas: number; fallidas: number }> {
  const cola = obtenerColaOffline();
  if (cola.length === 0) return { sincronizadas: 0, fallidas: 0 };

  let sincronizadas = 0;
  let fallidas = 0;
  const noSincronizadas: AccionSyncOffline[] = [];

  for (let i = 0; i < cola.length; i++) {
    const item = cola[i];
    try {
      if (item.tipo === 'set' && item.datos) {
        await setDoc(doc(db, item.coleccion, item.docId), item.datos, { merge: true });
      } else if (item.tipo === 'delete') {
        await deleteDoc(doc(db, item.coleccion, item.docId));
      }
      sincronizadas++;
    } catch (err) {
      console.warn(`Error al sincronizar elemento ${item.id}:`, err);
      fallidas++;
      noSincronizadas.push(item);
    }
    if (onProgreso) {
      onProgreso(cola.length - (i + 1));
    }
  }

  if (noSincronizadas.length > 0) {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(noSincronizadas));
  } else {
    vaciarColaOffline();
  }

  return { sincronizadas, fallidas };
}

/**
 * Borrado y poda inteligente de almacenamiento local cada 7 días para no saturar
 * los teléfonos de las colaboradoras ni navegadores de clientes.
 * Mantiene intactas las citas pendientes, confirmadas o futuras, y purga del caché local
 * citas históricas completadas/rechazadas de más de 7 días de antigüedad.
 */
export function ejecutarMantenimientoLocalStorage7Dias(
  citasActuales: Cita[],
  forzar: boolean = false
): { citasFiltradas: Cita[]; purgadas: number; espacioLiberadoAprox: string } {
  if (typeof window === 'undefined') {
    return { citasFiltradas: citasActuales, purgadas: 0, espacioLiberadoAprox: '0 KB' };
  }

  try {
    const ultimaLimpiezaStr = localStorage.getItem(STORAGE_KEYS.ULTIMA_LIMPIEZA);
    const ultimaLimpieza = ultimaLimpiezaStr ? parseInt(ultimaLimpiezaStr, 10) : 0;
    const ahora = Date.now();

    // Solo ejecutar si pasaron 7 días o si se solicita forzado
    if (!forzar && ahora - ultimaLimpieza < SIETE_DIAS_MS) {
      return { citasFiltradas: citasActuales, purgadas: 0, espacioLiberadoAprox: '0 KB' };
    }

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const hace7DiasStr = hace7Dias.toISOString().split('T')[0];

    const tamanoAntes = JSON.stringify(citasActuales).length;

    // Filtrar: Conservar todas las citas activas/futuras/pendientes, y solo purgar
    // citas terminadas/rechazadas que tengan más de 7 días de antigüedad
    const citasLimpias = citasActuales.filter((c) => {
      const esHistorica = c.estado === 'Completada' || c.estado === 'Rechazada';
      if (esHistorica && c.fecha < hace7DiasStr) {
        return false; // Purgar del almacenamiento local
      }
      return true; // Conservar en dispositivo
    });

    const purgadas = citasActuales.length - citasLimpias.length;
    const tamanoDespues = JSON.stringify(citasLimpias).length;
    const bytesLiberados = Math.max(0, tamanoAntes - tamanoDespues);
    const kbLiberados = (bytesLiberados / 1024).toFixed(1);

    // Guardar citas limpias y registrar timestamp del ciclo de 7 días
    localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(citasLimpias));
    localStorage.setItem(STORAGE_KEYS.ULTIMA_LIMPIEZA, ahora.toString());

    // Limpiar claves temporales viejas huérfanas
    const keysToPrune = ['temp_booking_draft', 'debug_log', 'temp_preview_image'];
    keysToPrune.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

    console.info(`[Storage Pruner] Optimización de 7 días: ${purgadas} citas antiguas purgadas localmente (~${kbLiberados} KB liberados).`);

    return {
      citasFiltradas: citasLimpias,
      purgadas,
      espacioLiberadoAprox: `${kbLiberados} KB`,
    };
  } catch (err) {
    console.warn('Error en mantenimiento de localStorage:', err);
    return { citasFiltradas: citasActuales, purgadas: 0, espacioLiberadoAprox: '0 KB' };
  }
}
