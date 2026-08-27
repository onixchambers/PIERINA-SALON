export type CategoriaServicio = string;

export interface Especialidad {
  id: string;
  nombre: string;
  icono?: string;
  color?: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  categoria: string; // ID de la especialidad
  duracionMin: number; // Duración base en minutos
  precio: number; // Precio base en salón
  descripcion: string;
  icono?: string;
  activo: boolean;
}

export interface HorarioBase {
  dias: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  horaInicio: string; // "09:00"
  horaFin: string; // "19:00"
  descansoInicio?: string; // "14:00"
  descansoFin?: string; // "15:00"
}

export interface ServicioColaborador {
  servicioId: string;
  precioPersonalizado?: number;
  duracionPersonalizadaMin?: number;
  activo: boolean;
}

export interface Colaborador {
  id: string;
  nombre: string;
  foto?: string | null; // DataURL de la foto real o null para avatar de iniciales
  pin?: string; // PIN personal de acceso (ej. "1111", "2222")
  especialidades: string[]; // IDs de especialidades asignadas
  serviciosAsignados?: ServicioColaborador[]; // Tratamientos y precios configurados específicamente para esta colaboradora
  telefono: string;
  horarioBase: HorarioBase;
  color: string; // Color distintivo para el calendario
  activo: boolean;
  biografia?: string;
}

export interface UsuarioSesion {
  tipo: 'admin' | 'colaborador';
  colaboradorId?: string;
  nombre: string;
  foto?: string | null;
}

// Alias de retrocompatibilidad
export type Terapeuta = Colaborador;

export type EstadoCita = 'Pendiente' | 'Confirmada' | 'Rechazada' | 'Completada';

export interface Cita {
  id: string;
  codigo: string; // Ej: "LUM-8492"
  clienteNombre: string;
  clienteTelefono: string;
  clienteNotas?: string;
  fotoReferencia?: string | null; // Foto de referencia o diseño subida por la clienta/colaboradora
  terapeutaId: string; // ID de la colaboradora
  colaboradorId?: string; // Alias
  servicioIds: string[];
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  precioTotal: number;
  duracionTotalMin: number;
  estado: EstadoCita;
  creadoEn: string; // ISO String
  actualizadoEn?: string; // ISO String
  origen: 'web_cliente' | 'admin_manual';
}

export type TipoBloqueo = 'dia_completo' | 'franja_horaria';

export interface BloqueoDisponibilidad {
  id: string;
  terapeutaId: string; // "all" o ID de la colaboradora
  colaboradorId?: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoBloqueo;
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  motivo: string;
  creadoEn: string;
}

export interface ConfiguracionSalon {
  nombreSalon: string;
  eslogan: string;
  logoUrl?: string | null; // DataURL o enlace del logo del salón
  telefonoSalon: string;
  direccion: string;
  horarioApertura: string;
  horarioCierre: string;
  intervaloMinutos: number;
  pinAdmin: string;
  alertaSonoraActiva: boolean;
  moneda: string;
  especialidades?: Especialidad[];
  firebaseConfig?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}
