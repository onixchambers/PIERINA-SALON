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
  pin?: string; // Contraseña personal de acceso (ej. "valentina123")
  passwordOriginal?: string; // Contraseña por defecto para reseteo
  especialidades: string[]; // IDs de especialidades asignadas
  serviciosAsignados?: ServicioColaborador[]; // Tratamientos y precios configurados específicamente para esta colaboradora
  telefono: string;
  horarioBase: HorarioBase;
  color: string; // Color distintivo para el calendario
  activo: boolean;
  accesoRestringido?: boolean; // Bloqueo de acceso al portal por falta de pago o decisión administrativa
  motivoRestriccion?: string; // Motivo mostrado al intentar ingresar
  rol?: 'admin' | 'colaborador';
  biografia?: string;
}

export interface AdministradorAdicional {
  id: string;
  nombre: string;
  pin: string;
  password?: string;
  activo: boolean;
  creadoEn: string;
}

export interface UsuarioSesion {
  tipo: 'superadmin' | 'admin' | 'colaborador';
  colaboradorId?: string;
  nombre: string;
  foto?: string | null;
  esSuperAdmin?: boolean;
}

// Alias de retrocompatibilidad
export type Terapeuta = Colaborador;

export type EstadoCita = 'Pendiente' | 'Confirmada' | 'Rechazada' | 'Completada';

export interface Cita {
  id: string;
  codigo: string; // Ej: "PIER-8492"
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
  pinSuperAdmin?: string; // Contraseña de superusuario (por defecto "onix1974")
  administradores?: AdministradorAdicional[]; // Administradores creados por el superusuario
  alertaSonoraActiva: boolean;
  moneda: string;
  maxColaboradores?: number; // Límite máximo de colaboradoras (1 a 50) configurado por el superusuario
  maxAdministradores?: number; // Límite máximo de administradores adicionales (1 a 50) configurado por el superusuario
  zonaHoraria?: string; // Huso horario del salón (por defecto "America/Panama")
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
