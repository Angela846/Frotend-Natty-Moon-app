export const CUENTAS_PAGO = {
  NEQUI: {
    numero: "3001234567",
    titular: "Natymoo SAS",
  },
  DAVIPLATA: {
    numero: "3009876543",
    titular: "Natymoo SAS",
  },
  NU: {
    numero: "3005551234",
    titular: "Natymoo SAS",
  },
};

/**
 * Arma el texto que se codifica en el QR. Como Nequi/Daviplata/Nu no tienen
 * un esquema de deep-link publico y unificado, el QR codifica un texto claro
 * con los datos de pago: el cliente lo escanea con la camara, ve los datos,
 * y hace la transferencia manualmente desde su app. Es el mismo patrón que
 * usan los QR "estáticos" que muchos negocios pequeños pegan en el mostrador.
 */
export function generarTextoQr(metodo, monto, referenciaOrden) {
  const cuenta = CUENTAS_PAGO[metodo];
  if (!cuenta) return "";
  return [
    `Pago Natymoo`,
    `Método: ${metodo}`,
    `Número: ${cuenta.numero}`,
    `Titular: ${cuenta.titular}`,
    `Monto: $${Number(monto).toLocaleString("es-CO")}`,
    referenciaOrden ? `Referencia: ${referenciaOrden}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
