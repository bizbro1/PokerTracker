// Unambiguous characters only (no O/0, I/1, etc.)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 4): string {
  let code = '';
  const random = crypto.getRandomValues(new Uint32Array(length));
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[random[i] % CODE_CHARS.length];
  }
  return code;
}

export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase();
}
