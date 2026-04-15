# CLAUDE.md — productos-huesped

Sitio de compras para huéspedes de alquileres temporarios. El huésped ingresa un código de reserva (del PMS) y puede pedir productos/servicios antes del check-in.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Estilos | Tailwind CSS 3 |
| Base de datos | Supabase (PostgreSQL compartida con el PMS) |
| Cliente DB | `@supabase/supabase-js` v2 |
| Pagos | MercadoPago (public key en config.js) |
| Notificaciones al host | WhatsApp vía CallMeBot API |

No hay backend propio. Todo corre en el browser con llamadas directas a Supabase.

---

## Variables de entorno (.env)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

El cliente Supabase está en [src/supabase.js](src/supabase.js). Si las variables no están definidas, usa placeholders y muestra un warning — la app no explota.

---

## Estructura de archivos clave

```
src/
  App.jsx             # Orquestador principal, maneja vistas y estado global
  booking.js          # Lookup de reserva por bookingCode → Supabase
  db.js               # CRUD de reservas (Supabase + fallback localStorage) y saveOrder()
  config.js           # Constantes editables por el host (markup, WhatsApp, etc.)
  i18n.js             # Traducciones EN/ES (objeto plano, sin librería)
  notify.js           # Envío de notificación WhatsApp al host via CallMeBot
  supabase.js         # createClient con placeholders seguros
  useExchangeRate.js  # Polling del tipo de cambio USD→ARS cada 5 min
  LangContext.jsx     # Context para idioma (EN/ES)
  components/
    CodeEntry.jsx     # Pantalla de ingreso del código de reserva
    CheckinBlocked.jsx  # Bloqueo si el check-in está lejos
    ProductCard.jsx
    PackSection.jsx / PackModal.jsx
    Cart.jsx
    Checkout.jsx
    LoadingScreen.jsx
    SearchBar.jsx
    Portal.jsx
    HostPanel.jsx     # Panel de administración — ya NO se usa en el sitio de huéspedes
                      # (se gestiona exclusivamente desde el PMS)
```

---

## Flujo de la app

1. URL con `?g=<CODE>` → App.jsx llama `fetchBooking(code)` → si OK, `bookingToGuestInfo()` → setGuestInfo
2. Sin `?g=` → muestra `<CodeEntry>` para que el huésped ingrese el código manualmente
3. Con guestInfo → muestra productos, carrito, checkout
4. Al confirmar pedido → `saveOrder(...)` guarda en tabla `GuestOrder` de Supabase + `notifyHost()` por WhatsApp

---

## Tablas Supabase

### Tablas del PMS (Prisma — nombres PascalCase, generados con `@@map`)
Estas tablas son **read-only** desde el sitio de huéspedes. El PMS (Next.js + Prisma) las gestiona.

| Tabla | Campos relevantes |
|---|---|
| `"Reservation"` | `id`, `bookingCode` (8 chars, ej: `RS4U9HX5`), `guestId`, `propertyId`, `checkIn`, `checkOut`, `checkInTime`, `checkOutTime`, `nights`, `status` |
| `"Guest"` | `id`, `firstName`, `lastName` |
| `"Property"` | `id`, `name`, `address`, `city` |

**IMPORTANTE:** Los nombres de tabla son PascalCase (comillas necesarias en SQL). El JOIN de Supabase JS con tablas PascalCase falla silenciosamente — siempre usar **3 queries separadas**: una para `Reservation`, luego `Guest` y `Property` en paralelo con `Promise.all`.

### Tabla del sitio de huéspedes (creada con SQL directo, no Prisma)

**`GuestOrder`** — pedidos confirmados por huéspedes:
```sql
CREATE TABLE "GuestOrder" (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bookingCode"  text NOT NULL,
  "guestName"    text NOT NULL,
  "propertyName" text NOT NULL,
  "checkinDate"  date NOT NULL,
  items          jsonb NOT NULL DEFAULT '[]',
  notes          text,
  "totalARS"     numeric NOT NULL,
  "createdAt"    timestamptz DEFAULT now()
);
```

Estructura de `items` (JSONB array):
```json
[{ "productId": "...", "productName": "...", "quantity": 2, "unitPriceARS": 1500 }]
```

### Tablas legacy del sitio de huéspedes (snake_case, pueden coexistir)
`reservations`, `orders`, `order_items` — son del sistema anterior, no se usan activamente.

---

## Permisos RLS en Supabase

El rol `anon` (usado por la app) necesita:

```sql
-- Schema
GRANT USAGE ON SCHEMA public TO anon;

-- Tablas PMS (solo SELECT)
GRANT SELECT ON "Reservation", "Guest", "Property" TO anon;

-- Tabla de pedidos (INSERT)
GRANT INSERT ON "GuestOrder" TO anon;

-- Políticas RLS (una por tabla)
CREATE POLICY "guest site read reservations" ON "Reservation" FOR SELECT TO anon USING (true);
CREATE POLICY "guest site read guests"       ON "Guest"       FOR SELECT TO anon USING (true);
CREATE POLICY "guest site read properties"   ON "Property"    FOR SELECT TO anon USING (true);
CREATE POLICY "guest site insert orders"     ON "GuestOrder"  FOR INSERT TO anon WITH CHECK (true);
```

---

## Internacionalización (i18n)

Sin librería externa. `src/i18n.js` exporta un objeto `{ en: {...}, es: {...} }`. El hook `useLang()` del `LangContext` da `{ lang, t }` donde `t('key')` resuelve la traducción. Idioma por defecto: `'es'`.

Al agregar texto nuevo, siempre agregar la clave en **ambos** idiomas en `i18n.js`.

---

## Patrones y convenciones

- **Sin backend propio**: todas las operaciones son directas a Supabase o a APIs externas (CallMeBot, MercadoPago). No crear endpoints intermedios.
- **`isSupabaseReady()`** en `db.js`: siempre verificar antes de queries. Si no está configurado, la app cae a localStorage (modo demo).
- **`useExchangeRate`**: usa un flag `alive` para evitar llamadas después del unmount. Mantener ese patrón en cualquier hook con `setInterval` o polling.
- **Precios**: los productos se almacenan en USD, se muestran en ARS con el tipo de cambio del momento. `MARKUP_PERCENTAGE` (default 20%) se aplica encima.
- **`bookingCode`**: siempre normalizar a mayúsculas con `.trim().toUpperCase()` antes de cualquier query.
- **`status === 'CANCELLED'`** en una reserva: mostrar advertencia roja y ocultar el botón de ingreso.

---

## Sistema de dos apps (PMS + sitio de huéspedes)

- **PMS**: Next.js 14 + Prisma, corre localmente en la PC del host. Gestiona reservas, huéspedes, propiedades. Genera los `bookingCode`.
- **Sitio de huéspedes**: este repo. Corre en producción (Vercel u otro hosting). Lee las reservas del PMS vía Supabase compartida.
- **Comunicación**: NO hay llamadas HTTP entre los dos sistemas. Comparten la misma base de datos Supabase.
- El PMS tiene (o tendrá) una sección "Pedidos" que lee la tabla `GuestOrder` para ver los pedidos confirmados por huéspedes.

---

## Comandos frecuentes

```bash
npm run dev      # Servidor de desarrollo en localhost:5173
npm run build    # Build de producción en /dist
npm run preview  # Previsualizar el build
```
