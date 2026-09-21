const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  ALREADY_REGISTERED: 'Ya registrado',
  APPROVED: 'Aprobado',
  CANCELLED: 'Cancelado',
  CHECKIN_STAFF: 'Check-in',
  CONFIRMED: 'Confirmado',
  DRAFT: 'Borrador',
  EMAIL: 'Email',
  ENTITLEMENT_ISSUED: 'Ticket emitido',
  ENTITLEMENT_REVOKED: 'Ticket revocado',
  EXPIRED: 'Vencido',
  IDENTITY: 'Identidad',
  INELIGIBLE: 'No disponible',
  OWNER_ASSISTANT: 'Asistente',
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PUBLISHED: 'Publicado',
  PAYMENT_PENDING: 'Pago pendiente',
  PROCESSING: 'Procesando',
  REGISTERED: 'Registrado',
  REQUEST_CANCELLED: 'Solicitud cancelada',
  REJECTED: 'Rechazado',
  REQUESTED: 'Solicitado',
  REQUIRES_REVIEW: 'Requiere revision',
  SOLD_OUT: 'Agotado',
  USED: 'Usado',
  VERIFIED: 'Verificado',
  WAITLISTED: 'En espera',
  WAITLIST_ACCEPTED: 'Espera aceptada',
  WAITLIST_DECLINED: 'Espera rechazada',
  WAITLIST_OFFERED: 'Lugar ofrecido',
  PUBLIC: 'Publico',
  PRIVATE: 'Privado',
};

export function labelForStatus(value: string | null | undefined) {
  if (!value) {
    return 'Sin estado';
  }

  return statusLabels[value] ?? toTitleCase(value);
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
