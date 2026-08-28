import { Cita, Servicio, Terapeuta, ConfiguracionSalon } from '@/types/salon';

/**
 * Limpia y normaliza números de teléfono para la API de WhatsApp
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Elimina espacios, guiones, paréntesis y signos +
  let clean = phone.replace(/[^0-9]/g, '');
  // Si es número mexicano de 10 dígitos sin código de país, agregar 52
  if (clean.length === 10) {
    clean = '52' + clean;
  }
  return clean;
}

/**
 * Genera el enlace directo para que el cliente contacte al salón tras solicitar cita
 */
export function getWhatsAppClientToSalonLink(
  cita: Cita,
  servicios: Servicio[],
  salonConfig: ConfiguracionSalon
): string {
  const salonPhone = formatWhatsAppNumber(salonConfig.telefonoSalon);
  const nombresServicios = cita.servicioIds
    .map(id => servicios.find(s => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `✨ *Solicitud de Cita - ${salonConfig.nombreSalon}*
Hola, acabo de solicitar una cita desde la app web:

📋 *Código:* ${cita.codigo}
👤 *Nombre:* ${cita.clienteNombre}
💆‍♀️ *Servicio(s):* ${nombresServicios}
📅 *Fecha:* ${cita.fecha}
⏰ *Hora:* ${cita.horaInicio} hrs
${cita.clienteNotas ? `📝 *Nota:* ${cita.clienteNotas}\n` : ''}
¡Quedo a la espera de su confirmación! 💖`;

  return `https://wa.me/${salonPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para que la terapeuta/admin envíe confirmación directa al cliente
 */
export function getWhatsAppConfirmationLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map(id => servicios.find(s => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `🌸 *¡CITA CONFIRMADA! - ${salonConfig.nombreSalon}* 🌸

Hola *${cita.clienteNombre}*, te confirmamos con mucho gusto tu cita:

✨ *Código:* ${cita.codigo}
💆‍♀️ *Tratamiento:* ${nombresServicios}
👩‍⚕️ *Especialista:* ${terapeuta?.nombre || 'Especialista asignada'}
📅 *Fecha:* ${cita.fecha}
⏰ *Hora:* ${cita.horaInicio} - ${cita.horaFin} hrs
📍 *Ubicación:* ${salonConfig.direccion}
💵 *Total estimado:* ${salonConfig.moneda}${cita.precioTotal}

Te recomendamos llegar 5 minutos antes. Si necesitas reprogramar, por favor avísanos con anticipación. ¡Será un placer consentirte! 💖`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para que la terapeuta/admin notifique al cliente sobre rechazo de cita
 */
export function getWhatsAppRejectionLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `Hola *${cita.clienteNombre}*, te saludamos de *${salonConfig.nombreSalon}*. 

Con respecto a tu solicitud de cita para *${nombresServicios}* el día *${cita.fecha}* a las *${cita.horaInicio}*, lamentablemente en esa franja no contamos con espacio disponible con *${terapeuta?.nombre || 'el equipo'}*.

¿Te gustaría que te ofrezcamos las siguientes opciones de horarios libres para atenderte con gusto? Quedamos a tu disposición. 🌸`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para notificar al cliente que su cita está en estado PENDIENTE / EN REVISIÓN
 */
export function getWhatsAppPendingLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `⏳ *SOLICITUD EN REVISIÓN - ${salonConfig.nombreSalon}*

Hola *${cita.clienteNombre}*, recibimos tu solicitud de cita para:
💆‍♀️ *Tratamiento:* ${nombresServicios}
👩‍⚕️ *Especialista:* ${terapeuta?.nombre || 'Por asignar'}
📅 *Fecha:* ${cita.fecha}
⏰ *Horario:* ${cita.horaInicio} - ${cita.horaFin} hrs

Estamos validando la disponibilidad de la cabina y te confirmaremos a la brevedad. ¡Gracias por tu paciencia! 💖`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para agradecer al cliente cuando su cita ha sido COMPLETADA
 */
export function getWhatsAppCompletedLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `💖 *¡GRACIAS POR TU VISITA! - ${salonConfig.nombreSalon}* 💖

Hola *${cita.clienteNombre}*, ha sido un auténtico placer atenderte hoy para tu servicio de *${nombresServicios}* con *${terapeuta?.nombre || 'nuestro equipo'}*.

Esperamos que hayas disfrutado tu experiencia al máximo. ✨ Si tienes alguna duda sobre el cuidado posterior o deseas agendar tu próximo mantenimiento, no dudes en escribirnos.

¡Esperamos verte muy pronto de nuevo! 🌸`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para notificar al cliente sobre una REPROGRAMACIÓN de su cita
 */
export function getWhatsAppRescheduledLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon,
  nuevaFecha: string,
  nuevaHoraInicio: string,
  nuevaHoraFin: string
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `🗓️ *ACTUALIZACIÓN DE CITA - ${salonConfig.nombreSalon}* 🗓️

Hola *${cita.clienteNombre}*, te informamos que tu cita para *${nombresServicios}* ha sido reprogramada con éxito:

📅 *Nueva Fecha:* ${nuevaFecha}
⏰ *Nuevo Horario:* ${nuevaHoraInicio} - ${nuevaHoraFin} hrs
👩‍⚕️ *Especialista:* ${terapeuta?.nombre || 'Especialista asignada'}
📍 *Ubicación:* ${salonConfig.direccion}

Por favor confírmanos si este nuevo horario te queda cómodo. ¡Agradecemos mucho tu comprensión! 💖`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}
