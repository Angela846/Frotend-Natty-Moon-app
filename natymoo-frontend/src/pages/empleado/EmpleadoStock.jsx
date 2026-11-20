import { useEffect, useState } from "react";
import { variantesApi, productosApi } from "../../api/resources";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";

export default function EmpleadoStock() {
  const [variantes, setVariantes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    Promise.all([variantesApi.list(), productosApi.list()])
      .then(([v, p]) => {
        setVariantes(v);
        setProductos(p);
      })
      .finally(() => setCargando(false));
  }, []);

  async function handleActualizarStock(variante, nuevoStock) {
    setError("");
    const stock = Number(nuevoStock);
    if (isNaN(stock) || stock < 0) {
      setError("El stock debe ser un número mayor o igual a cero.");
      return;
    }
    try {
      const actualizada = await variantesApi.update(variante.id, { ...variante, stock });
      setVariantes((prev) => prev.map((v) => (v.id === variante.id ? actualizada : v)));
    } catch {
      setError("No se pudo actualizar el stock.");
    }
  }

  if (cargando) return <Loader texto="Cargando inventario..." />;

  const filtradas = busqueda
    ? variantes.filter((v) =>
        v.producto?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.sku.toLowerCase().includes(busqueda.toLowerCase())
      )
    : variantes;

  return (
    <div>
      <h2 className="text-lg mb-4">Inventario</h2>

      <input
        placeholder="Buscar por producto o SKU..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-plum/20 bg-white/60 mb-6"
      />

      <ErrorMessage mensaje={error} />

      <div className="space-y-2 mt-2">
        {filtradas.map((v) => (
          <div
            key={v.id}
            className={`flex items-center justify-between border rounded-xl p-4 ${
              v.stock === 0
                ? "border-rose/40 bg-rose/5"
                : v.stock <= 5
                ? "border-rose/20 bg-rose/5"
                : "border-plum/10 bg-white/40"
            }`}
          >
            <div>
              <p className="font-medium text-sm">{v.producto?.nombre}</p>
              <p className="text-sm text-plum-ink/50">
                {v.talla} / {v.color} · SKU {v.sku}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {v.stock === 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-rose text-white font-medium">Agotado</span>
              )}
              {v.stock > 0 && v.stock <= 5 && (
                <span className="text-xs px-2 py-1 rounded-full bg-rose/15 text-rose font-medium">Stock bajo</span>
              )}
              <input
                type="number"
                min="0"
                defaultValue={v.stock}
                onBlur={(e) => handleActualizarStock(v, e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg border border-plum/20 text-sm"
              />
            </div>
          </div>
        ))}
        {filtradas.length === 0 && (
          <p className="text-plum-ink/50 py-8">No se encontraron resultados.</p>
        )}
      </div>
    </div>
  );
}
