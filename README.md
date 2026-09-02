# 🌸 Pierina Salón - Cejas, Pestañas y Más (Web App & PWA)

Aplicación Web Progresiva (PWA / Web App) responsive, moderna y de lujo para la gestión integral de citas en el salón de belleza **Pierina Salón**.

Desarrollada con **Next.js 15**, **React 19**, **Tailwind CSS v4**, **TypeScript**, y soporte de sincronización dual con **Firebase Firestore** o **Modo Reactivo Local**.

---

## ✨ Características Principales

### 1. Portal del Cliente (Flujo Rápido & Elegante)
- **Sin registros tediosos:** La clienta no necesita crear contraseñas.
- **Paso 1 - Tratamientos:** Catálogo interactivo categorizado (Pestañas & Cejas, Uñas, Cabello, Faciales, Depilación, Masajes).
- **Paso 2 - Colaboradora:** Elección de colaboradora favorita o asignación automática de mayor disponibilidad.
- **Paso 3 - Fecha y Hora:** Cálculo en tiempo real de huecos libres sin solapamientos.
- **Paso 4 - Formulario Express:** Nombre, WhatsApp y opción para **adjuntar foto de referencia** del diseño o estilo deseado.
- **Paso 5 - Seguimiento en Vivo (`/cita/[id]`):** Estado de la cita en tiempo real, enlace de WhatsApp directo con el salón, descarga de archivo `.ics` y sincronización con Google Calendar.

### 2. Portal de Colaboradoras & Administración (`/admin`)
- **Detección Inteligente por Contraseña / Nombre:** Un único formulario seguro de acceso que detecta automáticamente quién ingresa según la clave personal o nombre asignado:
  - **Superadministrador:** Clave `onix1974` (creación de roles administrativos, control total y límite de cupos)
  - **Administradora General:** Clave configurada (por defecto `admin123` o `admin`)
  - **Colaboradoras / Terapeutas:** Contraseña o nombre (por defecto `[nombre]123` o el nombre de la colaboradora, ej. `pierina` / `pierina123` para Pierina, `valentina` / `valentina123` para Valentina)
- **Modo Offline Integral (Superusuario, Administrador y Colaboradoras):**
  - Permite inicio de sesión, navegación y creación/gestión de citas, bloqueos, tarifas, inventario y finanzas aún sin conexión a internet.
  - Guarda automáticamente los datos en el dispositivo (`localStorage`) y encola las acciones para sincronizarlas con Firebase Firestore apenas se recupere la conexión a internet.
- **Gestión Exclusiva de Clientas:** Cada colaboradora visualiza y gestiona únicamente las solicitudes y citas de sus propias clientas.
- **Cambio de Contraseña:** Cada colaboradora puede modificar su PIN personal en cualquier momento desde la barra superior.
- **Calendario Multivista:** Vistas conmutables por **Día** (columnas por colaboradora), **Semana** y **Mes**.
- **Bloqueos de Disponibilidad:** Botón prominente con atajos de 1 solo clic (Almuerzo 1h, Permiso 2h, Tarde Libre, Día Completo).
- **Precios y Tratamientos por Colaboradora:** Configuración de tratamientos específicos y tarifas personalizadas por colaboradora.
- **Logo del Salón:** Logo oficial de Pierina con aro rosado elegante y fondo transparente.

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Instalar dependencias
corepack pnpm install

# 2. Compilar producción
corepack pnpm build

# 3. Iniciar servidor
node server.js
# o en modo desarrollo:
corepack pnpm dev
```

- **Portal Cliente:** [http://localhost:3000](http://localhost:3000)
- **Portal Colaboradoras:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📱 PWA (Progressive Web App)
Incluye `manifest.json` y `sw.js` para instalación como aplicación nativa en iOS, Android y escritorio.
