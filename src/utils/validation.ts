const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]{3,24}$/;

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) {
    return 'Ingresa tu email.';
  }
  if (!emailPattern.test(email)) {
    return 'Ingresa un email valido.';
  }
  return null;
}

export function validatePassword(value: string) {
  if (!value) {
    return 'Ingresa tu contrasena.';
  }
  if (value.length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres.';
  }
  return null;
}

export function validateDisplayName(value: string) {
  if (!value.trim()) {
    return 'Ingresa un nombre visible.';
  }
  if (value.trim().length < 2) {
    return 'El nombre visible es demasiado corto.';
  }
  return null;
}

export function validateUsername(value: string) {
  const username = value.trim();
  if (!username) {
    return null;
  }
  if (!usernamePattern.test(username)) {
    return 'El username debe tener 3 a 24 caracteres: letras, numeros o guion bajo.';
  }
  return null;
}

export function validateOptionalUrl(value: string, fieldLabel: string) {
  const url = value.trim();
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return `${fieldLabel} debe ser una URL http o https.`;
    }
    return null;
  } catch {
    return `${fieldLabel} no tiene formato de URL valido.`;
  }
}

export function validateBirthYear(value: string) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  if (!/^\d{4}$/.test(raw)) {
    return 'El anio de nacimiento debe tener 4 digitos.';
  }

  const year = Number.parseInt(raw, 10);
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear - 13) {
    return 'Ingresa un anio de nacimiento valido.';
  }
  return null;
}
