# KALFY — Ruta Oculta, Persistencia Reforzada y Fondo Galáctico Vivo

Actualizar la aplicación para ocultar por completo el acceso administrativo bajo la ruta secreta `/kalfy-studio-94x`, renovar la contraseña de administrador sin exponerla en pantalla, reforzar la persistencia combinando almacenamiento en servidor y caché en `localStorage`, dar vida al fondo galáctico con paralaje al cursor y partículas de estrellas animadas, y corregir el espaciado superior para evitar recortes bajo la barra de navegación.

## Decisiones Confirmadas y Alcance

> [!IMPORTANT]
> Estas actualizaciones reflejan las respuestas confirmadas para seguridad, persistencia y estética interactiva, además de corregir el recorte superior observado en pantallas de portátil.

- **Ruta secreta de administración**: El panel privado se mueve exclusivamente a `/kalfy-studio-94x`. Se elimina el enlace de administrador del pie de página público y la ruta `/admin` dejará de exponer el panel.
- **Credenciales renovadas**: Usuario `admin` y contraseña por defecto `Kalfy2026!` (también configurable vía variables de entorno `ADMIN_USER` / `ADMIN_PASSWORD`), eliminando cualquier texto o pista que revele credenciales en la pantalla de acceso.
- **Persistencia híbrida (Servidor + `localStorage`)**: Se conserva el almacenamiento en servidor (con ruta configurable `DATA_DIR`) sincronizado en tiempo real por SSE, sumado a persistencia automática en `localStorage` para mantener en caché la versión activa, notas, enlace de descarga y respaldo de configuración del administrador.
- **Fondo Galáctico Interactivo**: Paralaje suave siguiendo el movimiento del puntero junto a un lienzo animado de partículas y estrellas pixel-art en varias profundidades.
- **Corrección de encuadre superior**: Ajuste de margen superior y proporciones de los marcos Android para que el titular y ambos teléfonos queden completamente visibles debajo de la barra fija incluso en pantallas de menor altura.

---

## 1. Visión General y Concepto Central

- **Seguridad por ruta privada**: Ningún visitante verá enlaces ni pistas hacia el panel de gestión; únicamente quien conozca `/kalfy-studio-94x` e ingrese usuario y contraseña accederá al gestor de APKs.
- **Continuidad de versiones**: La versión publicada y sus metadatos permanecen guardados tanto en el servidor como respaldados en `localStorage`, garantizando carga instantánea en `/` y recuperación rápida en el panel privado si el hosting reinicia su sistema de archivos temporal.
- **Atmósfera viva**: El cielo espacial detrás de la vitrina cobra profundidad real al reaccionar suavemente al cursor con estrellas parpadeantes y partículas tácticas.

---

## 2. Experiencia de Usuario y Diseño Visual

### Cambios en la Vista Pública (`/`)
- **Pie de página limpio**: Solo muestra la marca **KALFY**, año y compatibilidad Android 8.0+, sin botón ni enlace al panel admin.
- **Encuadre seguro debajo del Navbar**: Espaciado superior calculado para que el titular principal y las dos pantallas Android nunca queden ocultos detrás de la barra superior fija en resoluciones `1366×768` o `1440×900`.
- **Fondo Galáctico Vivo (`GalaxyBackground`)**:
  - Imagen de galaxia pixel-art con desplazamiento suave interpolado al mover el ratón (`requestAnimationFrame` solo con `transform`).
  - Capa `<canvas>` superpuesta con estrellas pixeladas y partículas brillantes en verde esmeralda, cian y blanco en tres planos de profundidad que responden sutilmente al cursor (respetando `prefers-reduced-motion`).
  - Mantiene legibilidad WCAG AA tanto en **Modo Oscuro (Galaxia)** como en **Modo Claro (Alto Contraste)**.

### Cambios en el Panel Privado (`/kalfy-studio-94x`)
- **Acceso limpio**: Formulario de usuario y contraseña sin mostrar ninguna pista de la contraseña en la interfaz.
- **Respaldo y Sincronización con `localStorage`**: Al subir un archivo `.apk` o registrar una URL directa y notas de versión, se guarda la copia en el servidor y se actualiza simultáneamente el respaldo en `localStorage`, permitiendo restaurar metadatos o enlaces externos hacia el servidor en un clic si el entorno de hosting se reinicia.

---

## 3. Decisiones Clave de Producto

- **Decisión 1 — Ocultación total de la ruta administrativa**
  - *Enfoque elegido*: Mover el enrutamiento del panel a `/kalfy-studio-94x` y eliminar el enlace en el pie de página; cualquier ruta desconocida o `/admin` muestra la página pública sin pistas.
  - *Por qué*: Cumple la solicitud explícita de privacidad para evitar accesos no deseados o intentos de ingreso desde la web pública.
- **Decisión 2 — Persistencia dual Servidor + `localStorage`**
  - *Enfoque elegido*: Persistir estado y archivos en disco (`DATA_DIR`) para todos los visitantes, acompañado de caché pública y respaldo administrativo en `localStorage` + soporte completo de URL directa.
  - *Por qué*: Combina entrega real del `.apk` a cualquier usuario con conservación inmediata en el navegador y recuperación ágil ante reinicios efímeros en plataformas gratuitas.

---

## 4. Arquitectura Técnica y Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR EXPRESS + VITE (Puerto 3000)                │
│                                                                         │
│  • Auth admin: usuario "admin" / clave "Kalfy2026!" (o env vars)        │
│  • Persistencia: DATA_DIR/releases.json + DATA_DIR/uploads/             │
│  • SSE en vivo: sincroniza publicaciones instantáneamente hacia "/"     │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────────────┐   ┌─────────────────────────────┐
│  VISTA PÚBLICA (/)                    │   │  RUTA SECRETA               │
│                                       │   │  (/kalfy-studio-94x)        │
│  • Sin enlaces ni botones a Admin     │   │                             │
│  • GalaxyBackground (Parallax +       │   │  • Login sin pistas         │
│    partículas/estrellas en Canvas)    │   │  • Subida .apk / URL        │
│  • Hero + 2 Androids sin recorte      │   │  • Respaldo en localStorage │
│  • Cache instantánea en localStorage  │   │  • Sync servidor <-> local  │
└───────────────────────────────────────┘   └─────────────────────────────┘
```

- **Mapeo interactivo**:
  - **Puntero en `/`**: Actualiza coordenadas objetivo normalizadas para interpolar suavemente la capa galáctica y las estrellas del canvas sin provocar reflujos de diseño.
  - **Carga inicial en `/`**: Lee al instante la caché de versión activa desde `localStorage` mientras consulta `/api/public/state` y se suscribe a `/api/events` para actualizaciones en vivo.
  - **Publicación y restauración en `/kalfy-studio-94x`**: Cada subida de `.apk` o cambio de versión actualiza el servidor y guarda el snapshot en `localStorage`; si el servidor detecta estado inicial tras un reinicio, el panel ofrece sincronizar el respaldo guardado.
