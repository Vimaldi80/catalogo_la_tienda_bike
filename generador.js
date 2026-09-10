/* ============================================================
   Referencias a cada campo del formulario, usando su "id"
   ============================================================ */
const campoId = document.getElementById("campo-id");
const campoNombre = document.getElementById("campo-nombre");
const campoCategoria = document.getElementById("campo-categoria");
const campoPrecio = document.getElementById("campo-precio");
const campoDescripcion = document.getElementById("campo-descripcion");
const campoCaracteristicas = document.getElementById("campo-caracteristicas");
const campoMedidas = document.getElementById("campo-medidas");
const campoImagen = document.getElementById("campo-imagen");
const campoTalla = document.getElementById("campo-talla");
const campoColor = document.getElementById("campo-color");
const campoStock = document.getElementById("campo-stock");

const btnGenerar = document.getElementById("btnGenerar");
const btnCopiar = document.getElementById("btnCopiar");
const btnLimpiar = document.getElementById("btnLimpiar");
const elResultado = document.getElementById("resultado");

/* ============================================================
   MEMORIA DE CÓDIGOS POR CATEGORÍA
   Usamos localStorage: una "memoria" que el navegador guarda
   para este archivo, y que NO se borra aunque cierres la
   pestaña o el computador. Así, cada vez que abras este
   generador, se acuerda por dónde ibas.
   ============================================================ */
const PREFIJOS_CATEGORIA = {
  "Herramientas": "h",
  "Vestuario": "v",
  "Seguridad": "s",
  "Niños": "n",
  "Accesorios": "ac",
  "Alianzas": "al",
};

// Lee la memoria guardada (o un objeto vacío si es la primera vez que se usa)
function obtenerContadores() {
  const guardado = localStorage.getItem("contadoresId");
  return guardado ? JSON.parse(guardado) : {};
}

// Guarda la memoria actualizada
function guardarContadores(contadores) {
  localStorage.setItem("contadoresId", JSON.stringify(contadores));
}

// Calcula cuál sería el siguiente código para una categoría dada
function sugerirSiguienteId(categoria) {
  const prefijo = PREFIJOS_CATEGORIA[categoria] || "x";
  const contadores = obtenerContadores();
  const siguienteNumero = (contadores[prefijo] || 0) + 1;
  const numeroConCeros = String(siguienteNumero).padStart(3, "0");
  return prefijo + numeroConCeros;
}

/* ============================================================
   Arma la ruta completa de la imagen.
   Si el usuario solo escribió "guantes.jpg", le agregamos
   automáticamente la carpeta "assets/productos/" adelante.
   Si ya escribió la ruta completa, la dejamos tal cual.
   ============================================================ */
function armarRutaImagen(valor) {
  const limpio = valor.trim();
  if (limpio === "") return "";
  if (limpio.startsWith("assets/")) return limpio;
  return `assets/productos/${limpio}`;
}

/* ============================================================
   Convierte el texto del textarea de características (una
   línea por característica) en una lista de textos.
   Ignora líneas vacías, por si el usuario dejó espacios de más.
   ============================================================ */
function armarListaCaracteristicas(texto) {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea !== "");
}

/* ============================================================
   BOTÓN "GENERAR CÓDIGO"
   Lee todos los campos, arma un objeto JavaScript con la
   misma forma que un producto en products.json, y lo convierte
   a texto con JSON.stringify (que se encarga solo de poner
   bien las comillas, comas, etc. — así evitamos errores de
   tipeo manuales).
   ============================================================ */
btnGenerar.addEventListener("click", () => {

  // Armamos el objeto del producto
  const producto = {
    id: campoId.value.trim(),
    nombre: campoNombre.value.trim(),
    categoria: campoCategoria.value,
    precio: Number(campoPrecio.value) || 0,
    descripcion: campoDescripcion.value.trim(),
    caracteristicas: armarListaCaracteristicas(campoCaracteristicas.value),
    medidas: campoMedidas.value.trim(),
    imagen: armarRutaImagen(campoImagen.value),
    talla: campoTalla.value.trim(),
    color: campoColor.value.trim(),
    stock: campoStock.value,
  };

  // Validación simple: avisa si falta lo esencial, antes de generar código con errores
  if (!producto.id || !producto.nombre || !producto.precio) {
    elResultado.textContent = "⚠️ Falta llenar ID, Nombre o Precio — esos 3 son obligatorios.";
    return;
  }

  // JSON.stringify convierte el objeto a texto, con 2 espacios de sangría (el "2" del final)
  const textoGenerado = JSON.stringify(producto, null, 2);

  elResultado.textContent = textoGenerado + ",";
  // (el "," al final es porque este bloque va a ir DENTRO de una lista junto a otros productos)

  // Actualiza la memoria: guarda el número que se acaba de usar para esta categoría
  const prefijo = PREFIJOS_CATEGORIA[producto.categoria] || "x";
  const numeroUsado = parseInt(producto.id.replace(prefijo, ""), 10);

  if (!isNaN(numeroUsado)) {
    const contadores = obtenerContadores();
    // Solo actualiza si el número usado es MAYOR al que ya tenía guardado
    // (por si alguna vez escribes un código manual más bajo, no retrocede la memoria)
    if (!contadores[prefijo] || numeroUsado > contadores[prefijo]) {
      contadores[prefijo] = numeroUsado;
      guardarContadores(contadores);
    }
  }
});

/* ============================================================
   BOTÓN "COPIAR CÓDIGO"
   Copia directo al portapapeles, para pegarlo en products.json
   sin tener que seleccionar el texto a mano.
   ============================================================ */
btnCopiar.addEventListener("click", () => {
  const texto = elResultado.textContent;

  navigator.clipboard.writeText(texto).then(() => {
    btnCopiar.textContent = "✓ Copiado";
    setTimeout(() => {
      btnCopiar.textContent = "Copiar código";
    }, 1500);
  });
});

/* ============================================================
   BOTÓN "NUEVO PRODUCTO" (limpiar formulario)
   Vacía todos los campos de texto y vuelve los desplegables
   a su primera opción, para cargar el siguiente producto
   sin tener que borrar cada campo a mano.
   ============================================================ */
btnLimpiar.addEventListener("click", () => {
  campoId.value = sugerirSiguienteId(campoCategoria.value);
  campoNombre.value = "";
  campoPrecio.value = "";
  campoDescripcion.value = "";
  campoCaracteristicas.value = "";
  campoMedidas.value = "";
  campoImagen.value = "";
  campoTalla.value = "";
  campoColor.value = "";
  campoStock.selectedIndex = 0;

  elResultado.textContent = "Acá va a aparecer el código generado...";

  campoNombre.focus();
});

/* ============================================================
   Cuando cambias la categoría, actualiza el ID sugerido
   automáticamente (útil si cambiaste de categoría antes de
   generar el producto).
   ============================================================ */
campoCategoria.addEventListener("change", () => {
  campoId.value = sugerirSiguienteId(campoCategoria.value);
});

// Al abrir el archivo por primera vez, sugiere el ID inicial también
campoId.value = sugerirSiguienteId(campoCategoria.value);