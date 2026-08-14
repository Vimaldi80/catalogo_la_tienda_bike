# Catálogo Online — Guía de uso

## Qué archivos hay y qué hace cada uno

| Archivo | Para qué sirve | ¿Lo edito seguido? |
|---|---|---|
| `products.json` | Tus productos: nombre, precio, categoría, características, foto | **Sí, este es el que vas a tocar todo el tiempo** |
| `index.html` | Estructura de la página | No, casi nunca |
| `styles.css` | Colores, tipografía, diseño | Solo si quieres cambiar look (colores, logo, etc.) |
| `script.js` | La lógica: búsqueda, filtros, botón de WhatsApp | Solo para cambiar tu número de WhatsApp |

## Paso 1 — Configura tu WhatsApp

Abre `script.js`, línea 5:
```js
const WHATSAPP_NUMERO = "56900000000";
```
Cámbialo por tu número real (código de país + número, sin "+" ni espacios).

## Paso 2 — Agrega tus productos

Abre `products.json` y agrega un bloque por cada producto, siguiendo el mismo formato de los ejemplos. Los campos importantes:

- `imagen`: aquí va el **link** de la foto (ver Paso 3, cómo subir fotos)
- Si `"imagen": ""` (vacío), el catálogo muestra automáticamente "Foto próximamente" en vez de romperse

## Paso 3 — Sube tus fotos a Cloudinary (gratis)

Como tienes 100+ productos, necesitas un lugar donde alojar las fotos que no sea tu computador. Recomiendo **Cloudinary**:

1. Crea una cuenta gratis en cloudinary.com
2. Sube tus fotos desde el panel (arrastrar y soltar, se puede subir varias a la vez)
3. Por cada foto, Cloudinary te da un link público (termina en .jpg o .png)
4. Copia ese link y pégalo en el campo `"imagen"` del producto correspondiente en `products.json`

Cloudinary además comprime las fotos automáticamente, así que tu catálogo carga rápido aunque tengas cientos de imágenes.

## Paso 4 — Súbelo a GitHub

GitHub va a ser el lugar donde vive tu código, y Vercel se conecta a él para publicarlo.

1. Crea una cuenta en github.com (si no tienes)
2. Crea un repositorio nuevo (botón verde "New")
3. Sube estos 4 archivos (`index.html`, `styles.css`, `script.js`, `products.json`) — puedes arrastrarlos directo en la web de GitHub, no necesitas usar la terminal

## Paso 5 — Conecta con Vercel

1. Crea una cuenta en vercel.com (puedes entrar directo con tu cuenta de GitHub, un clic)
2. Botón "Add New" → "Project"
3. Selecciona el repositorio que acabas de crear
4. Vercel detecta automáticamente que es un sitio estático — no toques ninguna configuración, solo dale "Deploy"
5. En segundos te da un link tipo `tu-catalogo.vercel.app` — ese es el que compartes con tus clientes

## Cómo actualizar el catálogo después

Cada vez que quieras agregar o cambiar un producto:
1. Edita `products.json` directo en GitHub (botón del lápiz ✏️ en la página del archivo)
2. Guarda el cambio ("Commit changes")
3. Vercel detecta el cambio solo y republica el sitio en segundos — no tienes que hacer nada más

## Probar el catálogo en tu computador antes de subirlo

Como el catálogo carga `products.json` con `fetch()`, no puedes simplemente abrir `index.html` con doble clic (el navegador bloquea esa carga por seguridad). Para probarlo localmente:

- Si tienes Python instalado: abre una terminal en la carpeta del proyecto y ejecuta `python3 -m http.server`, luego abre `http://localhost:8000` en tu navegador
- O más simple: sube directo a Vercel (Paso 5) y pruébalo ahí — el deploy es gratis e instantáneo, puedes hacerlo las veces que quieras
