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

const campoTieneVariantes = document.getElementById("campo-tiene-variantes");
const bloqueSimple = document.getElementById("bloque-simple");
const bloqueVariantes = document.getElementById("bloque-variantes");
const listaVariantes = document.getElementById("lista-variantes");
const btnAgregarVariante = document.getElementById("btnAgregarVariante");

/* ============================================================
   MOSTRAR/OCULTAR SEGÚN EL CHECKBOX
   Si el producto tiene variantes, ocultamos los campos
   simples (imagen/talla/color/stock únicos) y mostramos la
   lista de variantes en su lugar.
   ============================================================ */
campoTieneVariantes.addEventListener("change", () => {
  if (campoTieneVariantes.checked) {
    bloqueSimple.style.display = "none";
    bloqueVariantes.style.display = "block";
    // Si activa variantes y todavía no hay ninguna fila, agrega la primera automáticamente
    if (listaVariantes.children.length === 0) {
      agregarFilaVariante();
    }
  } else {
    bloqueSimple.style.display = "block";
    bloqueVariantes.style.display = "none";
  }
});

/* ============================================================
   CREAR UNA FILA DE VARIANTE
   Cada fila junta 4 campos: nombre (color o kit), código de
   color (opcional, solo si es un color de verdad), nombre de
   la foto, y su propio stock — igual que en products.json.
   ============================================================ */
let contadorFilas = 0;

function agregarFilaVariante() {
  contadorFilas++;
  const fila = document.createElement("div");
  fila.className = "fila-variante";
  fila.style.cssText = "border:1px solid #ccc; border-radius:8px; padding:10px; margin-bottom:10px; background:white;";

  fila.innerHTML = `
    <label>Nombre (color o versión, ej: "Rojo" o "Kit reparación 01")</label>
    <input type="text" class="variante-nombre" placeholder="Rojo">

    <label>Código de color (opcional, solo si es un color real, ej: #e53935)</label>
    <input type="text" class="variante-codigo-color" placeholder="#e53935">

    <label>Nombre de la foto</label>
    <input type="text" class="variante-imagen" placeholder="producto_rojo.jpg">

    <label>Stock de esta variante</label>
    <select class="variante-stock">
      <option value="disponible">Disponible</option>
      <option value="pocas">Últimas unidades</option>
      <option value="agotado">Agotado</option>
    </select>

    <button type="button" class="btn-eliminar-variante" style="background:#A64B33; margin-top:8px; padding:6px 12px; font-size:12px;">Eliminar esta variante</button>
  `;

  // El botón "Eliminar" de cada fila borra SOLO esa fila (busca su propio padre)
  fila.querySelector(".btn-eliminar-variante").addEventListener("click", () => {
    fila.remove();
  });

  listaVariantes.appendChild(fila);
}

btnAgregarVariante.addEventListener("click", agregarFilaVariante);

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

  // Datos que TODO producto tiene, tenga o no variantes
  const producto = {
    id: campoId.value.trim(),
    nombre: campoNombre.value.trim(),
    categoria: campoCategoria.value,
    precio: Number(campoPrecio.value) || 0,
    descripcion: campoDescripcion.value.trim(),
    caracteristicas: armarListaCaracteristicas(campoCaracteristicas.value),
    medidas: campoMedidas.value.trim(),
  };

  if (campoTieneVariantes.checked) {
    // ---------------------------------------------------------
    // PRODUCTO CON VARIANTES: junta cada fila en una lista
    // ---------------------------------------------------------
    const filas = listaVariantes.querySelectorAll(".fila-variante");
    const variantes = [];

    filas.forEach((fila) => {
      const nombreVariante = fila.querySelector(".variante-nombre").value.trim();
      const codigoColor = fila.querySelector(".variante-codigo-color").value.trim();
      const imagenVariante = fila.querySelector(".variante-imagen").value.trim();
      const stockVariante = fila.querySelector(".variante-stock").value;

      // Ignora filas vacías (por si agregaste una de más sin llenarla)
      if (nombreVariante === "") return;

      const variante = {
        color: nombreVariante,
        imagen: armarRutaImagen(imagenVariante),
        stock: stockVariante,
      };

      // El código de color solo se agrega si lo llenaste (es opcional)
      if (codigoColor !== "") {
        variante.codigoColor = codigoColor;
      }

      variantes.push(variante);
    });

    if (variantes.length === 0) {
      elResultado.textContent = "⚠️ Marcaste 'tiene variantes' pero no llenaste ninguna fila.";
      return;
    }

    producto.variantes = variantes;

  } else {
    // ---------------------------------------------------------
    // PRODUCTO SIMPLE: los campos de siempre
    // ---------------------------------------------------------
    producto.imagen = armarRutaImagen(campoImagen.value);
    producto.talla = campoTalla.value.trim();
    producto.color = campoColor.value.trim();
    producto.stock = campoStock.value;
  }

  // Validación simple: avisa si falta lo esencial
  if (!producto.id || !producto.nombre || !producto.precio) {
    elResultado.textContent = "⚠️ Falta llenar ID, Nombre o Precio — esos 3 son obligatorios.";
    return;
  }

  const textoGenerado = JSON.stringify(producto, null, 2);
  elResultado.textContent = textoGenerado + ",";

  // Actualiza la memoria de IDs (igual que antes)
  const prefijo = PREFIJOS_CATEGORIA[producto.categoria] || "x";
  const numeroUsado = parseInt(producto.id.replace(prefijo, ""), 10);

  if (!isNaN(numeroUsado)) {
    const contadores = obtenerContadores();
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

  campoTieneVariantes.checked = false;
  bloqueSimple.style.display = "block";
  bloqueVariantes.style.display = "none";
  listaVariantes.innerHTML = "";

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