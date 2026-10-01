/* ============================================================
   CONFIGURACIÓN
   Cambia este número por tu WhatsApp real, con código de país,
   sin el "+" ni espacios. Ejemplo Chile: 56 9 1234 5678 -> 56912345678
   ============================================================ */
const WHATSAPP_NUMERO = "56981540050";

// Referencias a elementos del HTML que vamos a manipular
const elCatalogo = document.getElementById("catalogo");
const elBuscador = document.getElementById("buscador");
const elFiltrosCategoria = document.getElementById("filtros-categoria");
const elContador = document.getElementById("contador-resultados");
const elSinResultados = document.getElementById("sin-resultados");

// Referencias al modal de descripción (del index.html)
const elModal = document.getElementById("modal-detalle");
const elModalTitulo = document.getElementById("modal-titulo");
const elModalDescripcion = document.getElementById("modal-descripcion");
const elModalCaracteristicas = document.getElementById("modal-caracteristicas");
const elModalCerrar = document.getElementById("modal-cerrar");

// Estado actual de la vista (qué categoría y qué texto de búsqueda hay activos)
let categoriaActiva = "Todas";
let textoBusqueda = "";
let todosLosProductos = []; // se llena al cargar products.json
// Guarda qué variante (color) tiene seleccionada cada producto en pantalla.
// Ejemplo: { "s002": 2 } significa "el producto s002 tiene elegida la variante índice 2"
const varianteSeleccionada = {};

/* ============================================================
   1. CARGAR LOS DATOS
   fetch() le pide el archivo products.json al navegador.
   IMPORTANTE: esto solo funciona sirviendo el sitio por http
   (con Vercel, o un servidor local) — NO abriendo el
   index.html directamente con doble clic desde tu computador,
   porque los navegadores bloquean fetch() en archivos locales.
   ============================================================ */
async function cargarProductos() {
  try {
    const respuesta = await fetch("products.json");
    const datos = await respuesta.json();

    todosLosProductos = datos.productos;
    cargarCarrito();
    dibujarCarrito();

    dibujarFiltrosCategoria(datos.categorias);
    dibujarProductos(todosLosProductos);
  } catch (error) {
    console.error("Error cargando products.json:", error);
    elCatalogo.innerHTML = "<p style='padding:24px'>No se pudo cargar el catálogo. Si estás probando el archivo localmente, usa un servidor local en vez de abrir el HTML directo.</p>";
  }
}

/* ============================================================
   2. DIBUJAR LOS BOTONES DE CATEGORÍA
   Los genera automáticamente a partir de la lista "categorias"
   que viene en products.json — si agregas una categoría nueva
   ahí, el botón aparece solo, sin tocar este archivo.
   ============================================================ */
function dibujarFiltrosCategoria(categorias) {
  elFiltrosCategoria.innerHTML = "";

  categorias.forEach((categoria) => {
    const boton = document.createElement("button");
    boton.className = "category-chip";
    boton.textContent = categoria;

    if (categoria === categoriaActiva) {
      boton.classList.add("activo");
    }

    // Al hacer clic, esa categoría pasa a ser la activa y se re-dibuja todo
    boton.addEventListener("click", () => {
      categoriaActiva = categoria;
      aplicarFiltros();

      // Actualiza visualmente cuál botón está "activo"
      document.querySelectorAll(".category-chip").forEach((b) => b.classList.remove("activo"));
      boton.classList.add("activo");
    });

    elFiltrosCategoria.appendChild(boton);
  });
}

/* ============================================================
   3. FORMATEAR PRECIO EN PESOS CHILENOS
   Intl.NumberFormat es una función nativa del navegador,
   no necesita librerías externas.
   ============================================================ */
function formatearPrecio(numero) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(numero);
}

/* ============================================================
   TRADUCE EL ESTADO DE STOCK A TEXTO Y CLASE CSS
   ============================================================ */
function obtenerEstadoStock(estado) {
  const estados = {
    disponible: { clase: "disponible", texto: "Disponible" },
    pocas: { clase: "pocas", texto: "Últimas unidades" },
    agotado: { clase: "agotado", texto: "Agotado" },
  };
  // Si el valor no coincide con ninguno (por error de tipeo), muestra "Agotado" por seguridad
  return estados[estado] || estados.agotado;
}



/* ============================================================
   4. CREAR EL LINK DE WHATSAPP PARA UN PRODUCTO
   Genera un link que abre WhatsApp con un mensaje pre-escrito,
   mencionando el producto exacto que el cliente vio.
   ============================================================ */
function crearLinkWhatsapp(producto, variante) {
  let mensaje = `Hola! Me interesa el producto: ${producto.nombre} (${formatearPrecio(producto.precio)})`;
  if (variante && variante.color) {
    mensaje += ` — Color: ${variante.color}`;
  }

  const mensajeCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeCodificado}`;
}

/* ============================================================
   5. ABRIR Y CERRAR EL MODAL DE DESCRIPCIÓN
   Recibe el id del producto, busca sus datos completos en
   todosLosProductos y llena el modal antes de mostrarlo.
   ============================================================ */
function abrirModal(idProducto) {
  const producto = todosLosProductos.find((p) => p.id === idProducto);
  if (!producto) return;

  elModalTitulo.textContent = producto.nombre;
  elModalDescripcion.textContent = producto.descripcion;
  elModalCaracteristicas.innerHTML = producto.caracteristicas
    .map((item) => `<li>${item}</li>`)
    .join("");

  elModal.classList.add("activo");
}

function cerrarModal() {
  elModal.classList.remove("activo");
}

// Cerrar con el botón "✕"
elModalCerrar.addEventListener("click", cerrarModal);

// Cerrar al hacer clic fuera de la caja (en el fondo oscuro)
elModal.addEventListener("click", (evento) => {
  if (evento.target === elModal) cerrarModal();
});

// Cerrar con la tecla Escape
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") cerrarModal();
});

/* ============================================================
   6. DIBUJAR LAS TARJETAS DE PRODUCTO
   Recibe una lista de productos (ya filtrada) y crea el HTML
   de cada tarjeta.
   ============================================================ */
function dibujarProductos(lista) {
  elCatalogo.innerHTML = "";

  elContador.textContent =
    `${lista.length} producto${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;

  if (lista.length === 0) {
    elSinResultados.hidden = false;
    return;
  }

  elSinResultados.hidden = true;

  lista.forEach((producto) => {

    const tarjeta = document.createElement("article");
    tarjeta.className = "product-card";

    // ---------------------------------------------------------
    // PRODUCTOS CON VARIANTES
    // ---------------------------------------------------------

    let varianteSeleccionada = null;

    if (producto.variantes && producto.variantes.length > 0) {
      varianteSeleccionada = producto.variantes[0];
    }

    // ---------------------------------------------------------
    // IMAGEN PRINCIPAL
    // ---------------------------------------------------------

    const imagenInicial = varianteSeleccionada
      ? varianteSeleccionada.imagen
      : producto.imagen;

    const bloqueImagen = imagenInicial
      ? `<img 
          class="producto-imagen-principal"
          src="${imagenInicial}" 
          alt="${producto.nombre}" 
          loading="lazy"
        >`
      : `<div class="image-placeholder">Foto próximamente</div>`;


    // ---------------------------------------------------------
    // COLORES
    // ---------------------------------------------------------

    let bloqueColores = "";

    if (producto.variantes && producto.variantes.length > 0) {

            const botonesColores = producto.variantes.map((variante, indice) => {

        const estaAgotado = variante.stock === "agotado";
        const claseAgotado = estaAgotado ? "color-agotado" : "";
        const atributoDisabled = estaAgotado ? "disabled" : "";
        const esActivo = varianteSeleccionada === variante ? "color-activo" : "";
        const etiqueta = variante.color || variante.kit || "";

        // Si tiene código de color, dibuja el círculo de color de siempre
        if (variante.codigoColor) {
          return `
            <button
              type="button"
              class="color-selector ${esActivo} ${claseAgotado}"
              style="background-color: ${variante.codigoColor};"
              title="${etiqueta}${estaAgotado ? " - Agotado" : ""}"
              data-producto="${producto.id}"
              data-indice="${indice}"
              ${atributoDisabled}
            ></button>
          `;
        }

        // Si NO tiene color (ej: "Kit 01", "Kit 02"), dibuja un botón de texto
        return `
          <button
            type="button"
            class="variante-texto-selector ${esActivo} ${claseAgotado}"
            title="${etiqueta}${estaAgotado ? " - Agotado" : ""}"
            data-producto="${producto.id}"
            data-indice="${indice}"
            ${atributoDisabled}
          >${etiqueta}</button>
        `;

    }).join("");

            const etiquetaVarianteInicial = varianteSeleccionada.color || varianteSeleccionada.kit || "";

      bloqueColores = `
        <div class="variantes">

          <span class="variantes-titulo">
            Colores:
          </span>

          <div class="colores-container">
            ${botonesColores}
          </div>

          <span class="color-seleccionado">
            ${etiquetaVarianteInicial}
          </span>

        </div>
      `;
    }


    // ---------------------------------------------------------
    // STOCK
    // ---------------------------------------------------------

    let estadoStock;

    if (varianteSeleccionada) {
      estadoStock = obtenerEstadoStock(varianteSeleccionada.stock);
    } else {
      estadoStock = obtenerEstadoStock(producto.stock);
    }

    // ---------------------------------------------------------
    // TARJETA COMPLETA
    // ---------------------------------------------------------

    tarjeta.innerHTML = `

      <div class="product-image">

        ${bloqueImagen}

      </div>


      <div class="product-body">

        <span class="product-category">
          ${producto.categoria}
        </span>


        <h3 class="product-name">
          ${producto.nombre}
        </h3>


        <button
          class="ver-descripcion-btn"
          type="button"
        >
          Ver descripción
        </button>


        ${bloqueColores}


        <div class="product-footer">

          <span class="product-price">
            ${formatearPrecio(producto.precio)}
          </span>

          <span class="stock-tag ${estadoStock.clase}">
            ${estadoStock.texto}
          </span>

        </div>


        <button
          class="add-cart-btn"
          type="button"
          ${estaAgotado(producto, varianteSeleccionada) ? "disabled" : ""}
        >
          Agregar al carrito
        </button>

      </div>


    `;


    // ---------------------------------------------------------
    // BOTÓN DESCRIPCIÓN
    // ---------------------------------------------------------

    tarjeta
      .querySelector(".ver-descripcion-btn")
      .addEventListener("click", () => {

        abrirModal(producto.id);

      });


    // ---------------------------------------------------------
    // BOTONES DE COLORES
    // ---------------------------------------------------------

        const botonesColor =
      tarjeta.querySelectorAll(".color-selector, .variante-texto-selector");


    botonesColor.forEach((boton) => {

      boton.addEventListener("click", () => {

        const indice =
          Number(boton.dataset.indice);

        const variante =
          producto.variantes[indice];

    
    // ---------------------------------------------------------
    // ACTUALIZAR WHATSAPP CON EL COLOR SELECCIONADO
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // RECORDAR LA VARIANTE ELEGIDA Y BLOQUEAR SI ESTÁ AGOTADA
    // ---------------------------------------------------------
      // Cuando el cliente cambia de color:
      // 1) anotamos qué color eligió, para agregar ese al carrito (no el primero)
      // 2) si ese color está agotado, apagamos el botón "Agregar al carrito"
        varianteSeleccionada = variante;
        tarjeta.querySelector(".add-cart-btn").disabled = estaAgotado(producto, variante);

    // ---------------------------------------------------------
    // CAMBIAR IMAGEN
    // ---------------------------------------------------------

        const imagen =
          tarjeta.querySelector(".producto-imagen-principal");

        if (imagen) {

          imagen.src =
            variante.imagen;

        }


    // ---------------------------------------------------------
    // CAMBIAR NOMBRE DEL COLOR
    // ---------------------------------------------------------

        const textoColor =
          tarjeta.querySelector(".color-seleccionado");

        if (textoColor) {

          textoColor.textContent =
             variante.color || variante.kit || "";
        }


        // ---------------------------------------------------------
    // CAMBIAR STOCK
    // ---------------------------------------------------------

        const etiquetaStock =
          tarjeta.querySelector(".stock-tag");

        const nuevoEstado = obtenerEstadoStock(variante.stock);

        etiquetaStock.className =
          `stock-tag ${nuevoEstado.clase}`;

        etiquetaStock.textContent =
          nuevoEstado.texto;

    // ---------------------------------------------------------
    // MARCAR COLOR SELECCIONADO
    // ---------------------------------------------------------  // Marcar color seleccionado

        botonesColor.forEach((b) => {

          b.classList.remove("color-activo");

        });

        boton.classList.add("color-activo");

      });

    });

    tarjeta.querySelector(".add-cart-btn").addEventListener("click", () => {
      if (estaAgotado(producto, varianteSeleccionada)) return;
      agregarAlCarrito(producto.id, varianteSeleccionada);
    });

    elCatalogo.appendChild(tarjeta);

  });
}

/* ============================================================
   6. APLICAR FILTROS (categoría + búsqueda de texto)
   Esta función se llama cada vez que el usuario escribe algo
   o cambia de categoría. Filtra la lista completa y vuelve
   a dibujar solo lo que corresponde.
   ============================================================ */
function aplicarFiltros() {
  let resultado = todosLosProductos;

  // Filtro por categoría (si no está en "Todas")
  if (categoriaActiva !== "Todas") {
    resultado = resultado.filter((p) => p.categoria === categoriaActiva);
  }

  // Filtro por texto de búsqueda (ignora mayúsculas/minúsculas)
  if (textoBusqueda.trim() !== "") {
    const busquedaMinuscula = textoBusqueda.toLowerCase();
    resultado = resultado.filter((p) =>
      p.nombre.toLowerCase().includes(busquedaMinuscula)
    );
  }

  dibujarProductos(resultado);
}

/* ============================================================
   7. EVENTOS
   Escuchamos lo que el usuario escribe en el buscador.
   ============================================================ */
elBuscador.addEventListener("input", (evento) => {
  textoBusqueda = evento.target.value;
  aplicarFiltros();
});

/* ============================================================
   CARRITO
   Guarda solo { id, variante, cantidad }. El nombre y el precio
   se buscan siempre en products.json al dibujar, así el carrito
   nunca queda con precios viejos.
   ============================================================ */
const CLAVE_CARRITO = "carrito_la_tienda_bike";
const MAX_POR_PRODUCTO = 10;
let carrito = [];

const elCarritoOverlay = document.getElementById("carrito-overlay");
const elCarritoItems = document.getElementById("carrito-items");
const elCarritoTotal = document.getElementById("carrito-total");
const elCarritoCantidad = document.getElementById("carrito-cantidad");
const elCarritoContinuar = document.getElementById("carrito-continuar");

function guardarCarrito() {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) {}
}

function cargarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    if (Array.isArray(guardado)) carrito = guardado;
  } catch (e) {
    carrito = [];
  }
}

function estaAgotado(producto, variante) {
  const stock = variante ? variante.stock : producto.stock;
  return obtenerEstadoStock(stock).clase === "agotado";
}

function agregarAlCarrito(idProducto, variante) {
  const etiqueta = variante ? (variante.color || variante.kit || "") : "";
  const existente = carrito.find((i) => i.id === idProducto && i.variante === etiqueta);

  if (existente) {
    if (existente.cantidad < MAX_POR_PRODUCTO) existente.cantidad++;
  } else {
    carrito.push({ id: idProducto, variante: etiqueta, cantidad: 1 });
  }

  dibujarCarrito();
  abrirCarrito();
}

function dibujarCarrito() {
  // Si un producto ya no existe en products.json, lo saca del carrito
  carrito = carrito.filter((i) => todosLosProductos.some((p) => p.id === i.id));

  let total = 0;
  let unidades = 0;
  elCarritoItems.innerHTML = "";

  if (carrito.length === 0) {
    elCarritoItems.innerHTML = '<p class="cart-vacio">Tu carrito está vacío.</p>';
  }

  carrito.forEach((item, indice) => {
    const p = todosLosProductos.find((x) => x.id === item.id);
    const subtotal = p.precio * item.cantidad;
    total += subtotal;
    unidades += item.cantidad;

    const fila = document.createElement("div");
    fila.className = "cart-item";
    fila.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-nombre">${p.nombre}</span>
        ${item.variante ? `<span class="cart-item-variante">${item.variante}</span>` : ""}
        <span class="cart-item-precio">${formatearPrecio(subtotal)}</span>
      </div>
      <div class="cart-item-cantidad">
        <button type="button" data-accion="restar" data-indice="${indice}" aria-label="Quitar una unidad">−</button>
        <span>${item.cantidad}</span>
        <button type="button" data-accion="sumar" data-indice="${indice}" aria-label="Agregar una unidad">+</button>
      </div>
      <button type="button" class="cart-item-quitar" data-accion="quitar" data-indice="${indice}" aria-label="Eliminar">🗑</button>
    `;
    elCarritoItems.appendChild(fila);
  });

  elCarritoTotal.textContent = formatearPrecio(total);
  elCarritoCantidad.textContent = unidades;
  elCarritoContinuar.disabled = carrito.length === 0;
  guardarCarrito();
}

function abrirCarrito() { elCarritoOverlay.classList.add("activo"); }
function cerrarCarrito() { elCarritoOverlay.classList.remove("activo"); }

// Un solo listener para todos los botones +, − y 🗑 (delegación de eventos)
elCarritoItems.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const indice = Number(boton.dataset.indice);
  const item = carrito[indice];
  if (!item) return;

  const accion = boton.dataset.accion;
  if (accion === "sumar" && item.cantidad < MAX_POR_PRODUCTO) item.cantidad++;
  if (accion === "restar") item.cantidad--;
  if (accion === "quitar" || item.cantidad <= 0) carrito.splice(indice, 1);

  dibujarCarrito();
});

document.getElementById("btn-carrito").addEventListener("click", abrirCarrito);
document.getElementById("carrito-cerrar").addEventListener("click", cerrarCarrito);
elCarritoOverlay.addEventListener("click", (e) => {
  if (e.target === elCarritoOverlay) cerrarCarrito();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarCarrito();
});

/* ============================================================
   CHECKOUT (datos del cliente y envío)
   Aquí solo mostramos el total para que el cliente sepa cuánto
   pagará. El cobro oficial lo va a calcular el servidor.
   ============================================================ */
let configEnvio = null;

const elCheckoutOverlay = document.getElementById("checkout-overlay");
const elCheckoutForm = document.getElementById("checkout-form");
const elCheckoutRegion = document.getElementById("checkout-region");
const elCheckoutResumen = document.getElementById("checkout-resumen");
const elCheckoutError = document.getElementById("checkout-error");

let comunasPorRegion = {};
const elCheckoutComuna = document.getElementById("checkout-comuna");

async function cargarEnvio() {
  try {
    const [resEnvio, resComunas] = await Promise.all([
      fetch("envio.json"),
      fetch("comunas.json"),
    ]);
    configEnvio = await resEnvio.json();
    comunasPorRegion = await resComunas.json();
    llenarRegiones();
  } catch (error) {
    console.error("Error cargando envio.json o comunas.json:", error);
  }
}

function llenarRegiones() {
  elCheckoutRegion.innerHTML = '<option value="">Selecciona tu región</option>';

  Object.keys(comunasPorRegion).forEach((region) => {
    const opcion = document.createElement("option");
    opcion.value = region;
    opcion.textContent = region;
    elCheckoutRegion.appendChild(opcion);
  });
}

function llenarComunas() {
  const comunas = (comunasPorRegion[elCheckoutRegion.value] || [])
    .slice()
    .sort((a, b) => a.localeCompare(b, "es"));

  elCheckoutComuna.innerHTML = '<option value="">Selecciona tu comuna</option>';
  comunas.forEach((comuna) => {
    const opcion = document.createElement("option");
    opcion.value = comuna;
    opcion.textContent = comuna;
    elCheckoutComuna.appendChild(opcion);
  });

  elCheckoutComuna.disabled = comunas.length === 0;
}

function calcularSubtotal() {
  return carrito.reduce((suma, item) => {
    const p = todosLosProductos.find((x) => x.id === item.id);
    return suma + (p ? p.precio * item.cantidad : 0);
  }, 0);
}

// Devuelve el costo de envío, o null si aún no hay región elegida
function calcularEnvio(region, subtotal) {
  if (!configEnvio || !region) return null;

  const zona = configEnvio.zonas.find((z) => z.regiones.includes(region));
  if (!zona) return null;

  if (configEnvio.envioGratisDesde > 0 && subtotal >= configEnvio.envioGratisDesde) {
    return 0;
  }
  return zona.precio;
}

function dibujarResumenCheckout() {
  const subtotal = calcularSubtotal();
  const envio = calcularEnvio(elCheckoutRegion.value, subtotal);
  const total = envio === null ? subtotal : subtotal + envio;

  let textoEnvio = "Elige tu región";
  if (envio === 0) textoEnvio = "Gratis";
  if (envio > 0) textoEnvio = formatearPrecio(envio);

  elCheckoutResumen.innerHTML = `
    <div><span>Productos</span><span>${formatearPrecio(subtotal)}</span></div>
    <div><span>Envío</span><span>${textoEnvio}</span></div>
    <div class="checkout-total"><span>Total a pagar</span><span>${formatearPrecio(total)}</span></div>
  `;
}

function abrirCheckout() {
  cerrarCarrito();
  dibujarResumenCheckout();
  elCheckoutOverlay.classList.add("activo");
}

function cerrarCheckout() {
  elCheckoutOverlay.classList.remove("activo");
}

elCarritoContinuar.addEventListener("click", abrirCheckout);
elCheckoutRegion.addEventListener("change", dibujarResumenCheckout);
elCheckoutRegion.addEventListener("change", llenarComunas);
document.getElementById("checkout-cerrar").addEventListener("click", cerrarCheckout);
document.getElementById("checkout-volver").addEventListener("click", () => {
  cerrarCheckout();
  abrirCarrito();
});
elCheckoutOverlay.addEventListener("click", (e) => {
  if (e.target === elCheckoutOverlay) cerrarCheckout();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarCheckout();
});

elCheckoutForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  elCheckoutError.textContent = "";

  const datos = Object.fromEntries(new FormData(elCheckoutForm));

  const telefono = datos.telefono.replace(/[\s+()-]/g, "");
  if (!/^(56)?9\d{8}$/.test(telefono)) {
    elCheckoutError.textContent = "Revisa tu teléfono: debe ser un celular chileno, por ejemplo 9 1234 5678.";
    return;
  }

  const botonPagar = elCheckoutForm.querySelector("button[type=submit]");
  botonPagar.disabled = true;
  botonPagar.textContent = "Creando tu pago...";

  try {
    const respuesta = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrito, datosCliente: datos }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      elCheckoutError.textContent = "No se pudo generar el pago. Intenta de nuevo.";
      botonPagar.disabled = false;
      botonPagar.textContent = "Ir a pagar";
      return;
    }

    // Lo mandamos a pagar. Mercado Pago se encarga desde aquí.
    localStorage.setItem("ultimoPedidoNombre", datos.nombre);
    window.location.href = resultado.linkPago;

  } catch (error) {
    console.error("Error al crear el pago:", error);
    elCheckoutError.textContent = "Error de conexión. Revisa tu internet e intenta de nuevo.";
    botonPagar.disabled = false;
    botonPagar.textContent = "Ir a pagar";
  }
});

// Arrancamos todo cuando carga la página
cargarProductos();
cargarEnvio();