import { QRCodeSVG } from "qrcode.react";
import { CUENTAS_PAGO, generarTextoQr } from "../config/pagos";

export default function PagoQr({ metodo, monto }) {
  const cuenta = CUENTAS_PAGO[metodo];
  if (!cuenta) return null;

  const textoQr = generarTextoQr(metodo, monto);

  return (
    <div className="border border-plum/15 rounded-2xl p-5 bg-white/60 flex flex-col sm:flex-row items-center gap-5 mt-3">
      <div className="bg-white p-3 rounded-xl shrink-0">
        <QRCodeSVG value={textoQr} size={140} bgColor="#ffffff" fgColor="#241826" level="M" />
      </div>
      <div className="text-sm">
        <p className="font-medium text-plum-ink mb-1">
          Escanea y paga con {metodo === "NU" ? "Nu" : metodo.charAt(0) + metodo.slice(1).toLowerCase()}
        </p>
        <p className="text-plum-ink/70">
          Número: <span className="font-medium">{cuenta.numero}</span>
        </p>
        <p className="text-plum-ink/70">
          Titular: <span className="font-medium">{cuenta.titular}</span>
        </p>
        <p className="text-plum-ink/70">
          Monto a pagar: <span className="font-medium">${Number(monto).toLocaleString("es-CO")}</span>
        </p>
        <p className="text-xs text-plum-ink/40 mt-2">
          Abre tu app, escanea el código o escribe el número manualmente, y guarda el
          comprobante — puedes pegar el número de referencia abajo.
        </p>
      </div>
    </div>
  );
}
