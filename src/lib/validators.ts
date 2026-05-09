export function isRequired(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPassword(password: string) {
  return password.trim().length >= 6;
}

export function passwordsMatch(password: string, confirmation: string) {
  return password.length > 0 && password === confirmation;
}

export function isValidCpfBasic(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  return digits.length === 11 && !/^(\d)\1{10}$/.test(digits);
}

export function isValidChildAge(age: number) {
  return Number.isInteger(age) && age >= 6 && age <= 14;
}
