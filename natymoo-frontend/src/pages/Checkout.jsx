import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  direccionesApi,
  ordenesApi,
  detalleOrdenApi,
  historialOrdenApi,
  cuponesApi,
  variantesApi,
  pagosApi,
} from "../api/resources";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import FieldError from "../components/FieldError";
import PagoQr from "../components/PagoQr";
import { requerido, telefonoValido, soloLetras, soloNumeros, validarFormulario, tieneErrores } from "../utils/validation";

const METODOS_PAGO = [
  { valor: "NEQUI", etiqueta: "Nequi" },
  { valor: "DAVIPLATA", etiqueta: "Daviplata" },
  { valor: "NU", etiqueta: "Nu" },
];

export default function Checkout() {
  const { usuario } = useAuth();
  const { items, total, vaciarCarritoLocal } = useCart();
  const navigate = useNavigate();

  const [direcciones, setDirecciones] = useState([]);
  const [direccionId, setDireccionId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevaDireccion, setNuevaDireccion] = useState({
    alias: "",
    destinatario: `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`,
    telefonoContacto: "",
    calle: "",
    numero: "",
    ciudad: "",
    departamento: "",
    codigoPostal: "",
  });
  const [erroresDireccion, setErroresDireccion] = useState({});

  const [metodoPago, setMetodoPago] = useState("NEQUI");
  const [referenciaPago, setReferenciaPago] = useState("");

  const [codigoCupon, setCodigoCupon] = useState("");
  const [cupon, setCupon] = useState(null);
  const [errorCupon, setErrorCupon] = useState("");

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    direccionesApi
      .list()
      .then((todas) => {
        const propias = todas.filter((d) => d.usuario?.id === usuario.id);
        setDirecciones(propias);
        const principal = propias.find((d) => d.esPrincipal) || propias[0];
        if (principal) setDireccionId(principal.id);
        else setMostrarForm(true);
      })
      .finally(() => setCargando(false));
  }, [usuario.id]);

  async function handleCrearDireccion(e) {
    e.preventDefault();
    const nuevosErrores = validarFormulario(nuevaDireccion, {
      destinatario: [(v) => requerido(v, "El nombre del destinatario")],
      calle: [(v) => requerido(v, "La calle")],
      ciudad: [(v) => requerido(v, "La ciudad")],
      telefonoContacto: [telefonoValido],
    });
    setErroresDireccion(nuevosErrores);
    if (tieneErrores(nuevosErrores)) return;

    const creada = await direccionesApi.create({
      ...nuevaDireccion,
      usuario: { id: usuario.id },
      esPrincipal: direcciones.length === 0,
    });
    setDirecciones((prev) => [...prev, creada]);
    setDireccionId(creada.id);
    setMostrarForm(false);
  }

  async function handleAplicarCupon() {
    setErrorCupon("");
    setCupon(null);
    if (!codigoCupon.trim()) return;
    try {
      const todos = await cuponesApi.list();
      const encontrado = todos.find(
        (c) => c.codigo.toLowerCase() === codigoCupon.trim().toLowerCase() && c.activo
      );
      if (!encontrado) {
        setErrorCupon("Cupón no válido o inactivo.");
        return;
      }
      const ahora = new Date();
      if (new Date(encontrado.fechaInicio) > ahora) {
        setErrorCupon("Este cupón todavía no está vigente.");
        return;
      }
      if (new Date(encontrado.fechaFin) < ahora) {
        setErrorCupon("Este cupón ya venció.");
        return;
      }
      if (encontrado.usoMaximo && encontrado.usosActuales >= encontrado.usoMaximo) {
        setErrorCupon("Este cupón alcanzó su límite de usos.");
        return;
      }
      if (encontrado.montoMinimo && total < Number(encontrado.montoMinimo)) {
        setErrorCupon(
          `Este cupón requiere una compra mínima de $${Number(encontrado.montoMinimo).toLocaleString("es-CO")}.`
        );
        return;
      }
      setCupon(encontrado);
    } catch {
      setErrorCupon("No pudimos validar el cupón.");
    }
  }

  const descuento = cupon
    ? cupon.tipoDescuento === "PORCENTAJE"
      ? (total * Number(cupon.valor)) / 100
      : Number(cupon.valor)
    : 0;

  const totalFinal = Math.max(total - descuento, 0);

  async function handleConfirmar() {
    setError("");

    if (!direccionId) {
      setError("Selecciona o crea una dirección de envío.");
      return;
    }

    setProcesando(true);
    try {
      // 1) Verificar stock disponible en tiempo real antes de confirmar,
      // porque puede haber cambiado desde que se agregó al carrito.
      const variantesActuales = await variantesApi.list();
      for (const item of items) {
        const actual = variantesActuales.find((v) => v.id === item.variante.id);
        if (!actual || actual.stock < item.cantidad) {
          setError(
            `Ya no hay suficiente stock de "${item.variante.producto?.nombre}" (${item.variante.talla}/${item.variante.color}). Ajusta la cantidad en tu carrito.`
          );
          setProcesando(false);
          return;
        }
      }

      // 2) Crear la orden
      const orden = await ordenesApi.create({
        usuario: { id: usuario.id },
        direccion: { id: direccionId },
        cupon: cupon ? { id: cupon.id } : null,
        subtotal: total,
        descuento,
        costoEnvio: 0,
        total: totalFinal,
        estado: "PENDIENTE",
      });

      // 3) Crear el detalle de la orden y descontar el stock de cada variante
      await Promise.all(
        items.map(async (item) => {
          await detalleOrdenApi.create({
            orden: { id: orden.id },
            variante: { id: item.variante.id },
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.precioUnitario * item.cantidad,
          });

          const actual = variantesActuales.find((v) => v.id === item.variante.id);
          await variantesApi.update(item.variante.id, {
            ...actual,
            stock: actual.stock - item.cantidad,
          });
        })
      );

      // 4) Historial inicial de la orden
      await historialOrdenApi.create({
        orden: { id: orden.id },
        estado: "PENDIENTE",
        comentario: "Orden creada",
      });

      // 5) Registrar el pago (queda pendiente hasta que el admin/empleado lo confirme)
      await pagosApi.create({
        orden: { id: orden.id },
        metodoPago,
        monto: totalFinal,
        estado: "PENDIENTE",
        referenciaTransaccion: referenciaPago || null,
      });

      await vaciarCarritoLocal();
      navigate(`/pedidos`);
    } catch (err) {
      setError("No pudimos procesar tu orden. Intenta de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return <Loader texto="Cargando checkout..." />;
  if (items.length === 0) {
    navigate("/carrito");
    return null;
  }

  return (
    <div className="container-natymoo py-12 max-w-3xl">
      <h1 className="text-3xl mb-8">Finalizar compra</h1>

      <section className="mb-10">
        <h2 className="text-lg mb-4">Dirección de envío</h2>

        {direcciones.length > 0 && !mostrarForm && (
          <div className="space-y-3 mb-4">
            {direcciones.map((d) => (
              <label
                key={d.id}
                className={`block border rounded-xl p-4 cursor-pointer transition-colors ${
                  direccionId === d.id ? "border-plum bg-white/60" : "border-plum/15"
                }`}
              >
                <input
                  type="radio"
                  name="direccion"
                  className="mr-2"
                  checked={direccionId === d.id}
                  onChange={() => setDireccionId(d.id)}
                />
                <span className="font-medium">{d.alias || "Dirección"}</span>
                <p className="text-sm text-plum-ink/60 ml-6">
                  {d.calle} {d.numero}, {d.ciudad}
                </p>
              </label>
            ))}
            <button
              onClick={() => setMostrarForm(true)}
              className="text-sm text-plum font-medium hover:text-rose"
            >
              + Agregar otra dirección
            </button>
          </div>
        )}

        {mostrarForm && (
          <form onSubmit={handleCrearDireccion} className="space-y-3 border border-plum/15 rounded-xl p-4">
            <input
              placeholder="Alias (ej. Casa)"
              value={nuevaDireccion.alias}
              onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, alias: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
            />
            <div>
              <input
                placeholder="Nombre del destinatario"
                value={nuevaDireccion.destinatario}
                onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, destinatario: soloLetras(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
              />
              <FieldError mensaje={erroresDireccion.destinatario} />
            </div>
            <div>
              <input
                placeholder="Teléfono de contacto"
                inputMode="numeric"
                value={nuevaDireccion.telefonoContacto}
                onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, telefonoContacto: soloNumeros(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
              />
              <FieldError mensaje={erroresDireccion.telefonoContacto} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  placeholder="Calle"
                  value={nuevaDireccion.calle}
                  onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, calle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
                />
                <FieldError mensaje={erroresDireccion.calle} />
              </div>
              <input
                placeholder="Número"
                value={nuevaDireccion.numero}
                onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, numero: e.target.value })}
                className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  placeholder="Ciudad"
                  value={nuevaDireccion.ciudad}
                  onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, ciudad: soloLetras(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
                />
                <FieldError mensaje={erroresDireccion.ciudad} />
              </div>
              <input
                placeholder="Departamento"
                value={nuevaDireccion.departamento}
                onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, departamento: soloLetras(e.target.value) })}
                className="px-3 py-2 rounded-lg border border-plum/20 bg-white/60"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-plum text-blush text-sm font-medium hover:bg-plum-dark"
              >
                Guardar dirección
              </button>
              {direcciones.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="px-5 py-2 rounded-full border border-plum/20 text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg mb-4">Método de pago</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {METODOS_PAGO.map((m) => (
            <label
              key={m.valor}
              className={`flex items-center gap-2 border rounded-xl p-3 cursor-pointer text-sm transition-colors ${
                metodoPago === m.valor ? "border-plum bg-white/60" : "border-plum/15"
              }`}
            >
              <input
                type="radio"
                name="metodoPago"
                checked={metodoPago === m.valor}
                onChange={() => setMetodoPago(m.valor)}
              />
              {m.etiqueta}
            </label>
          ))}
        </div>

        <PagoQr metodo={metodoPago} monto={totalFinal} />

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Número de referencia de tu pago (opcional)
          </label>
          <input
            placeholder="Ej: M12345678"
            value={referenciaPago}
            onChange={(e) => setReferenciaPago(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-plum/20 bg-white/60"
          />
        </div>

        <p className="text-xs text-plum-ink/40 mt-2">
          Tu pedido queda registrado como "pendiente de pago"; en breve confirmamos la transacción.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg mb-4">Cupón de descuento</h2>
        <div className="flex gap-2">
          <input
            placeholder="Código del cupón"
            value={codigoCupon}
            onChange={(e) => setCodigoCupon(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-plum/20 bg-white/60"
          />
          <button
            onClick={handleAplicarCupon}
            className="px-5 py-2 rounded-full border border-plum/30 text-sm font-medium hover:bg-plum hover:text-blush transition-colors"
          >
            Aplicar
          </button>
        </div>
        {errorCupon && <p className="text-sm text-rose mt-2">{errorCupon}</p>}
        {cupon && (
          <p className="text-sm text-sage mt-2">
            Cupón "{cupon.codigo}" aplicado ✓
          </p>
        )}
      </section>

      <section className="border border-plum/10 rounded-2xl p-6 bg-white/40">
        <h2 className="text-lg mb-4">Resumen</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-plum-ink/70">
            <span>Subtotal</span>
            <span>${total.toLocaleString("es-CO")}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-sage">
              <span>Descuento</span>
              <span>-${descuento.toLocaleString("es-CO")}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-lg mt-3 pt-3 border-t border-plum/10">
            <span>Total</span>
            <span>${totalFinal.toLocaleString("es-CO")}</span>
          </div>
        </div>

        <ErrorMessage mensaje={error} />

        <button
          onClick={handleConfirmar}
          disabled={procesando}
          className="mt-6 w-full py-3 rounded-full bg-plum text-blush font-medium hover:bg-plum-dark transition-colors disabled:opacity-50"
        >
          {procesando ? "Procesando..." : "Confirmar pedido"}
        </button>
      </section>
    </div>
  );
}
