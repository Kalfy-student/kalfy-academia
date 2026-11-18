# KALFY — Rediseño Compacto con Pantallas Android Interactivas

Rediseñar la página pública principal (`/`) hacia una vitrina limpia, directa y sin scroll excesivo: dos pantallas interactivas de Android mostrando la interfaz real de la app (las **8 Rutas de Aprendizaje** y los **12 Rangos Oficiales** con sus sprites pixel-art recortados), junto al botón directo de descarga de la versión actual, manteniendo el panel administrativo `/admin` totalmente independiente.

## Decisiones Confirmadas y Alcance

> [!IMPORTANT]
> Se aplican las preferencias confirmadas en la entrevista de diseño junto con los ajustes directos solicitados para simplificar la experiencia pública.

- **Contenido de las dos pantallas Android**: Pantalla 1 dedicada a las **8 Rutas de Aprendizaje** y Pantalla 2 dedicada a los **12 Rangos Oficiales**, ambas interactivas al tocar cada tarjeta dentro del dispositivo.
- **Eliminación de scroll largo y consolas**: Se retiran la simulación de terminal Linux del Hero, la sección extensa de Misiones CTF con mini-consola web, las cuadrículas largas de página completa y el historial completo de versiones en la vista pública.
- **Información de descarga minimalista**: Se elimina por completo el hash SHA-256 y detalles técnicos complejos de la vista del usuario final. Solo se muestra el botón principal para descargar el archivo APK junto a la versión actual activa, su tamaño y compatibilidad Android 8.0+.
- **Panel administrativo aparte (`/admin`)**: Se conserva íntegro en su propia ruta privada para subir archivos `.apk` (hasta 150 MB), editar versión/novedades, activar o pausar descargas y consultar estadísticas.

---

## 1. Visión General y Concepto Central

- **Propósito**: Presentar **KALFY** de un solo vistazo como una academia móvil táctica para Android, permitiendo que cualquier visitante entienda en segundos qué ofrece la app (rutas, clases y rangos) y descargue el archivo APK sin distracciones ni bloques densos de texto.
- **Público objetivo**: Estudiantes y entusiastas de ciberseguridad desde dispositivos móviles Android o escritorio que buscan descargar la aplicación rápidamente tras ver una muestra visual clara de su interfaz.
- **Valor clave**: Reducir la fricción de entrada mostrando la interfaz móvil real de la app en lugar de largos listados de texto o terminales simuladas.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujo Principal en `/`
1. **Barra superior compacta**: Logo de **KALFY**, indicador discreto de versión actual (`vX.X.X`), selector de tema (**Modo Oscuro Galaxia** / **Modo Claro Alto Contraste**) y enlace directo al botón de descarga.
2. **Escenario único sin scroll largo (Desktop 1440px / Responsive)**:
   - **Columna izquierda (Descarga directa)**: Titular claro, resumen breve en 1–2 líneas, tarjeta limpia con el botón principal **Descargar APK (`vX.X.X`)**, tamaño del archivo, notas breves de la versión actual únicamente, y guía rápida opcional de instalación en Android.
   - **Columna derecha (Dos pantallas Android lado a lado)**: Dos marcos realistas de teléfono Android sobre el fondo de **Galaxia Pixel-Art** con contraste medido:
     - **Teléfono 1 — Interfaz de Las 8 Rutas**: Barra superior móvil de KALFY, progreso general y lista/cuadrícula táctil de las 8 rutas con sus sprites pixel-art recortados (icono nítido + fondo difuminado dentro de cada tarjeta móvil). Al tocar una ruta dentro del teléfono, se despliega su detalle compacto (24 clases, comandos clave y Proyecto Final) dentro de la misma pantalla móvil.
     - **Teléfono 2 — Interfaz de Los 12 Rangos**: Barra superior móvil de KALFY, barra de nivel/XP y cuadrícula táctil de los 12 escudos pixel-art (`NOVATO` hasta `LEYENDA`) con sus etiquetas inferiores pixeladas y requisito de XP (`0 XP` a `52,000+ XP`). Al tocar un rango dentro del teléfono, muestra su especialidad y nivel de acceso.
3. **Pie de página discreto**: Copyright de KALFY y enlace separado para acceder a `/admin`.

### Identidad Visual y Tipografía
- **Atmósfera y Paleta**: Fondo negro táctico (`#05080D` / `#0D131C`) sobre el arte espacial de la **Galaxia Pixel-Art** en modo oscuro, y pizarra clara de alto contraste (`#F4F7FA` / `#FFFFFF`) en modo claro, con verde esmeralda táctico (`#10B981`) concentrado en el botón de descarga y estados activos.
- **Tipografía (Regla 2+1)**: `Outfit` para titulares, `Plus Jakarta Sans` para lectura limpia y `JetBrains Mono` únicamente para versiones, tamaños y valores XP tabulares (`tabular-nums`).
- **Ergonomía móvil**: Áreas táctiles cómodas dentro de ambas pantallas Android (`>= 44px`), encabezados internos compactos (`sticky top-0`) y navegación inferior móvil estilo app nativa en cada teléfono simulado.

---

## 3. Decisiones Clave de Producto

- **Decisión 1 — Rutas y Rangos encapsulados dentro de los dos dispositivos Android**
  - *Enfoque elegido*: Renderizar las 8 rutas y los 12 rangos dentro de dos componentes interactivos con proporción de smartphone Android en el escenario principal.
  - *Por qué*: Cumple la petición de evitar tanto scroll y reemplaza los bloques extensos de consola con una vista inmediata y atractiva de cómo luce la app real.
  - *Alternativas descartadas*: Mantener secciones apiladas debajo del Hero, lo cual duplicaría contenido y alargaría innecesariamente la página.
- **Decisión 2 — Ocultar SHA-256 en `/` manteniendo el cálculo en `/admin`**
  - *Enfoque elegido*: El servidor y el panel `/admin` continúan calculando y almacenando el SHA-256 automáticamente al subir un `.apk`, pero la vista pública solo muestra versión actual, tamaño, notas vigentes y el botón de descarga directa.
  - *Por qué*: Mantiene la seguridad y trazabilidad para el administrador sin confundir al usuario final con hashes técnicos en la portada.

---

## 4. Arquitectura Técnica y Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR EXPRESS + VITE (Puerto 3000)                │
│                                                                         │
│  • Persistencia en disco: versión activa, historial, notas y APKs       │
│  • Eventos SSE en vivo: notifica cambios de /admin a / al instante      │
│  • Descarga directa: incrementa contador y entrega el archivo .apk      │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │ GET estado + SSE                        │ Auth + Upload 150MB
                ▼                                         ▼
┌───────────────────────────────────────┐   ┌─────────────────────────────┐
│        PÁGINA PÚBLICA (/)             │   │   PANEL PRIVADO (/admin)    │
│                                       │   │                             │
│  [Navbar Compacto + Tema]             │   │  • Login Administrador      │
│  [Hero: Titular + Botón Descargar]    │   │  • Drag & Drop .apk (150MB) │
│  [Solo Versión Actual + Tamaño]       │   │  • Editor Versión y Notas   │
│                                       │   │  • Switch Mantenimiento     │
│  ┌─────────────┐   ┌─────────────┐    │   │  • Historial y Estadísticas │
│  │  Android 1  │   │  Android 2  │    │   └─────────────────────────────┘
│  │  8 Rutas    │   │  12 Rangos  │    │
│  │ (Táctil)    │   │  (Táctil)   │    │
│  └─────────────┘   └─────────────┘    │
└───────────────────────────────────────┘
```

- **Mapeo interactivo**:
  - **Botón Descargar APK**: Consume `activeRelease` desde el estado público sincronizado por SSE; si `maintenanceMode` está activo, muestra aviso de mantenimiento en curso en lugar del enlace de descarga.
  - **Android 1 (8 Rutas)**: Estado local `selectedRouteId` permite alternar entre la lista de las 8 rutas y la vista de detalle interna sin salir de la pantalla del teléfono.
  - **Android 2 (12 Rangos)**: Estado local `selectedRankTier` actualiza la tarjeta destacada de XP y especialidad dentro de la interfaz del teléfono.
  - **Ruta `/admin`**: Mantiene el flujo autenticado completo con subida multipart, barra de progreso XHR, activación de versiones en un clic y actualización instantánea de `/` sin recargar.
