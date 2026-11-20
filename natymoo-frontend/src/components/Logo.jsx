import { useState } from "react";

/**
 * Muestra el logo de la empresa. Busca el archivo en /public/logo.svg
 * (o cualquier formato que pongas ahí con ese mismo nombre: logo.svg,
 * logo.png, etc. — solo actualiza la ruta abajo si cambias la extensión).
 *
 * CÓMO PONER TU PROPIO LOGO:
 * 1. Consigue tu logo en PNG, SVG o JPG (fondo transparente recomendado).
 * 2. Ponlo en la carpeta natymoo-frontend/public/ con el nombre "logo.svg"
 *    (o "logo.png" si es un PNG — en ese caso cambia RUTA_LOGO abajo).
 * 3. Listo, no hay que tocar nada más de código. Recompila (npm run build)
 *    o si estás en desarrollo (npm run dev) se actualiza solo.
 *
 * Si el archivo no existe o no carga, se muestra el texto "natymoo" en su
 * lugar automáticamente — la app nunca se queda con un ícono roto.
 */
const RUTA_LOGO = "/logo.svg";

export default function Logo({
  className = "h-9 w-auto",
  textClassName = "font-display text-2xl text-plum tracking-tight",
}) {
  const [fallaCarga, setFallaCarga] = useState(false);

  if (fallaCarga) {
    return <span className={textClassName}>natymoo</span>;
  }

  return (
    <img
      src={RUTA_LOGO}
      alt="Natymoo"
      className={className}
      onError={() => setFallaCarga(true)}
    />
  );
}
