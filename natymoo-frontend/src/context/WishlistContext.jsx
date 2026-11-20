import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { listaDeseosApi } from "../api/resources";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { usuario } = useAuth();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario) {
      setItems([]);
      return;
    }
    setCargando(true);
    try {
      const todos = await listaDeseosApi.list();
      setItems(todos.filter((i) => i.usuario?.id === usuario.id));
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function estaEnFavoritos(productoId) {
    return items.some((i) => i.producto?.id === productoId);
  }

  async function alternarFavorito(producto) {
    if (!usuario) return;
    const existente = items.find((i) => i.producto?.id === producto.id);
    if (existente) {
      await listaDeseosApi.remove(existente.id);
      setItems((prev) => prev.filter((i) => i.id !== existente.id));
    } else {
      const creado = await listaDeseosApi.create({
        usuario: { id: usuario.id },
        producto: { id: producto.id },
      });
      setItems((prev) => [...prev, { ...creado, producto }]);
    }
  }

  return (
    <WishlistContext.Provider
      value={{ items, cargando, estaEnFavoritos, alternarFavorito, recargar: cargar }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist debe usarse dentro de WishlistProvider");
  return ctx;
}
