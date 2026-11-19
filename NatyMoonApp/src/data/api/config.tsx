// URL del backend. Se toma de EXPO_PUBLIC_API_URL (archivo .env.local) y, si no
// existe, usa la IP de desarrollo. En producción debe ser una URL https://.
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.69.86.32:8080';
