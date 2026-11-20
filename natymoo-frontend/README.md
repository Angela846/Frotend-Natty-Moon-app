# Natymoo Frontend

Frontend en React + Vite + Tailwind que consume el backend de Spring Boot. La
autenticación usa la cookie httpOnly del JWT (no hay tokens en localStorage).

## 1. Instalar dependencias

```bash
cd natymoo-frontend
npm install
```

## 2. Configurar la URL del backend

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Por defecto apunta a `http://localhost:8080/api`, que es donde corre el
backend de Spring Boot con la configuración que ya tienes.

## 3. Correr en desarrollo

```bash
npm run dev
```

Se abre en `http://localhost:5173`. **Importante:** el backend debe estar
corriendo al mismo tiempo (`mvn spring-boot:run` en la carpeta del backend),
y su `application.properties` debe tener `http://localhost:5173` en
`app.cors.allowed-origins` (ya viene así por defecto).

## 4. Qué incluye

**Tienda (público / usuarios):**
- Catálogo con filtro por categoría (`/`)
- Detalle de producto con selección de talla/color y reseñas (`/productos/:id`)
- Carrito de compras (`/carrito`)
- Checkout con direcciones y cupones (`/checkout`)
- Registro e inicio de sesión (`/registro`, `/login`)
- Mis pedidos con seguimiento de estado (`/pedidos`)
- Mi cuenta: editar perfil y direcciones (`/cuenta`)

**Panel de administración** (solo usuarios con rol `ADMIN`, en `/admin`):
- Gestión de productos y sus variantes (talla/color/stock)
- Gestión de categorías
- Gestión de cupones de descuento

## 5. Cómo crear tu primer usuario ADMIN

Por defecto, `/api/auth/register` siempre asigna el rol `USER`. Para tener un
administrador:

1. Regístrate normalmente desde `/registro`.
2. Entra a tu base de datos y cambia el rol de ese usuario a mano:
   ```sql
   UPDATE usuarios SET rol_id = (SELECT id FROM roles WHERE nombre = 'ADMIN')
   WHERE email = 'tu-correo@ejemplo.com';
   ```
3. Cierra sesión y vuelve a iniciar sesión en el frontend (el JWT se regenera
   con el rol actualizado). Ahora verás el link "Panel admin" en la barra de
   navegación.

## 6. Notas de implementación

- El backend no expone un endpoint para "carrito activo del usuario" ni
  filtros por usuario en las órdenes/direcciones/reseñas — sus controladores
  son CRUD genéricos (`GET /recurso` trae todo). El frontend compensa esto
  trayendo la lista completa del recurso y filtrando en el cliente por
  `usuario.id`. Esto funciona bien para un catálogo de tamaño normal, pero si
  el volumen de datos crece mucho, lo ideal sería agregar endpoints
  específicos en el backend como `GET /api/ordenes-compra/usuario/{id}`.
- El precio del carrito se "congela" al agregar el producto (se guarda
  `precioUnitario` en el momento), tal como está diseñada la base de datos.
- Las imágenes de producto están representadas con un placeholder de marca
  (el diseño está listo para conectar URLs reales en cuanto tengas fotos:
  el campo `imagenesApi` en `src/api/resources.js` ya existe para eso).

## 7. Build de producción

```bash
npm run build
```

Los archivos estáticos quedan en `dist/`, listos para desplegar en
Vercel, Netlify, o servirlos desde el propio backend.
