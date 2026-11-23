// Utilidades simples de validación para formularios.
// Cada validador devuelve un string con el mensaje de error, o null si es válido.

export function requerido(valor, etiqueta = "Este campo") {
  if (valor === null || valor === undefined) return `${etiqueta} es obligatorio.`;
  if (typeof valor === "string" && valor.trim() === "") return `${etiqueta} es obligatorio.`;
  return null;
}

export function esEmailValido(valor) {
  if (!valor) return "El correo es obligatorio.";
  const regex = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
  if (!regex.test(valor)) return "Ingresa un correo electrónico válido.";
  return null;
}

export function longitudMinima(valor, min, etiqueta = "Este campo") {
  if (!valor || valor.length < min) {
    return `${etiqueta} debe tener al menos ${min} caracteres.`;
  }
  return null;
}

export function numeroPositivo(valor, etiqueta = "Este valor") {
  const n = Number(valor);
  if (valor === "" || valor === null || valor === undefined || Number.isNaN(n)) {
    return `${etiqueta} debe ser un número.`;
  }
  if (n <= 0) return `${etiqueta} debe ser mayor a cero.`;
  return null;
}

export function numeroNoNegativo(valor, etiqueta = "Este valor") {
  const n = Number(valor);
  if (valor === "" || valor === null || valor === undefined || Number.isNaN(n)) {
    return `${etiqueta} debe ser un número.`;
  }
  if (n < 0) return `${etiqueta} no puede ser negativo.`;
  return null;
}

export function telefonoValido(valor) {
  if (!valor) return null; // opcional en la mayoría de formularios
  const regex = /^[0-9+()\-\s]{7,20}$/;
  if (!regex.test(valor)) return "Ingresa un teléfono válido.";
  return null;
}

/**
 * Filtros para usar EN VIVO dentro de un onChange, para que el campo
 * literalmente no deje escribir caracteres que no correspondan.
 * Uso: onChange={(e) => setForm({ ...form, nombre: soloLetras(e.target.value) })}
 */

// Deja pasar solo letras (con tildes/ñ) y espacios. Para nombres, ciudades, etc.
export function soloLetras(valor) {
  return valor.replace(/[^A-Za-zÀ-ÖØ-öø-ÿñÑ\s]/g, "");
}

// Deja pasar solo dígitos. Para teléfonos, código postal, cantidades enteras.
export function soloNumeros(valor) {
  return valor.replace(/[^0-9]/g, "");
}

// Quita el signo "-" que el usuario intente escribir, para campos como
// stock, precio, monto o cantidad que nunca deben ser negativos. A
// diferencia de soloNumeros, sí deja pasar el punto decimal.
export function soloNoNegativo(valor) {
  return valor.replace(/-/g, "");
}

// Deja pasar solo dígitos y un punto decimal. Para precios/montos escritos a mano
// (normalmente no hace falta porque esos inputs ya son type="number", pero sirve
// como refuerzo si en algún punto se cambia a texto libre).
export function soloNumeroDecimal(valor) {
  const limpio = valor.replace(/[^0-9.]/g, "");
  const partes = limpio.split(".");
  if (partes.length <= 2) return limpio;
  return partes[0] + "." + partes.slice(1).join("");
}

export function fechaFinDespuesDeInicio(inicio, fin) {
  if (!inicio || !fin) return "Ambas fechas son obligatorias.";
  if (new Date(fin) <= new Date(inicio)) {
    return "La fecha de fin debe ser posterior a la fecha de inicio.";
  }
  return null;
}

/**
 * Corre un objeto { campo: [validadores...] } contra un objeto de valores
 * y devuelve { campo: "mensaje de error" } solo para los campos con error.
 *
 * Ejemplo:
 *   validarFormulario(
 *     { email: form.email, password: form.password },
 *     { email: [esEmailValido], password: [(v) => longitudMinima(v, 6, "La contraseña")] }
 *   )
 */
export function validarFormulario(valores, reglas) {
  const errores = {};
  for (const campo of Object.keys(reglas)) {
    for (const validador of reglas[campo]) {
      const mensaje = validador(valores[campo]);
      if (mensaje) {
        errores[campo] = mensaje;
        break;
      }
    }
  }
  return errores;
}

export function tieneErrores(errores) {
  return Object.keys(errores).length > 0;
}

/**
 * El backend devuelve errores de dos formas distintas segun el caso:
 * - { mensaje: "..." } para errores de negocio (ej. "ya existe una cuenta con ese email")
 * - { errores: { campo: "mensaje" } } para errores de validacion de formulario (Bean Validation)
 * Esta funcion revisa ambas para no perder el detalle real del error.
 */
export function extraerMensajeError(err, mensajePorDefecto = "Ocurrió un error inesperado.") {
  const data = err?.response?.data;
  if (!data) return mensajePorDefecto;
  if (data.mensaje) return data.mensaje;
  if (data.errores) {
    const primero = Object.values(data.errores)[0];
    if (primero) return primero;
  }
  return mensajePorDefecto;
}
