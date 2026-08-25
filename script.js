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

// Estado actual de la vista (qué categoría y qué texto de búsqueda hay activos)
let categoriaActiva = "Todas";
let textoBusqueda = "";
let todosLosProductos = []; // se llena al cargar products.json

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
function crearLinkWhatsapp(producto, variante = null) {

  let mensaje = `Hola! Me interesa el producto: ${producto.nombre}`;

  if (variante) {
    mensaje += ` - Color: ${variante.color}`;
  }

  mensaje += ` (${formatearPrecio(producto.precio)})`;

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
document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);

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

        const estaAgotado = variante.stock === 0;

        const claseAgotado =
          estaAgotado ? "color-agotado" : "";

        const atributoDisabled =
          estaAgotado ? "disabled" : "";

        return `
          <button
            type="button"
            class="color-selector ${
              varianteSeleccionada === variante ? "color-activo" : ""
            } ${claseAgotado}"
            style="background-color: ${variante.codigoColor};"
            title="${variante.color}${estaAgotado ? " - Agotado" : ""}"
            data-producto="${producto.id}"
            data-indice="${indice}"
            ${atributoDisabled}
          ></button>
        `;

    }).join("");


      bloqueColores = `
        <div class="variantes">

          <span class="variantes-titulo">
            Colores:
          </span>

          <div class="colores-container">
            ${botonesColores}
          </div>

          <span class="color-seleccionado">
            ${varianteSeleccionada.color}
          </span>

        </div>
      `;
    }


    // ---------------------------------------------------------
    // STOCK
    // ---------------------------------------------------------

    let estadoStock;

    if (varianteSeleccionada) {

      if (varianteSeleccionada.stock === 0) {

        estadoStock = {
          clase: "agotado",
          texto: "Agotado"
        };

      } else if (varianteSeleccionada.stock <= 2) {

        estadoStock = {
          clase: "pocas",
          texto: "Últimas unidades"
        };

      } else {

        estadoStock = {
          clase: "disponible",
          texto: "Disponible"
        };

      }

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


        <a
          class="whatsapp-btn"
          href="${crearLinkWhatsapp(producto, varianteSeleccionada)}"
          target="_blank"
          rel="noopener"
        >
           <svg
              class="whatsapp-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M20.52 3.48A11.87 11.87 0 0 0 12.05 0C5.49 0 .16 5.33.16 11.89c0 2.1.55 4.15 1.6 5.96L.05 24l6.3-1.65a11.85 11.85 0 0 0 5.69 1.45h.01c6.56 0 11.89-5.33 11.89-11.89 0-3.17-1.23-6.15-3.42-8.43ZM12.05 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.23-.37a9.89 9.89 0 0 1-1.52-5.28C2.16 6.42 6.59 2 12.05 2c2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.9 6.99c0 5.46-4.43 9.9-9.89 9.91Zm5.42-7.42c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.24-.25-.59-.5-.51-.68-.52h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35Z"
              />
            </svg>

            <span>Pedir por WhatsApp</span>
          </a>

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
      tarjeta.querySelectorAll(".color-selector");


    botonesColor.forEach((boton) => {

      boton.addEventListener("click", () => {

        const indice =
          Number(boton.dataset.indice);

        const variante =
          producto.variantes[indice];

    
    // ---------------------------------------------------------
    // ACTUALIZAR WHATSAPP CON EL COLOR SELECCIONADO
    // ---------------------------------------------------------

        const botonWhatsapp =
          tarjeta.querySelector(".whatsapp-btn");

        if (botonWhatsapp) {

          botonWhatsapp.href =
            crearLinkWhatsapp(producto, variante);

}

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
            variante.color;

        }


    // ---------------------------------------------------------
    // CAMBIAR STOCK
    // ---------------------------------------------------------    // Cambiar stock

        const etiquetaStock =
          tarjeta.querySelector(".stock-tag");


        let nuevoEstado;


        if (variante.stock === 0) {

          nuevoEstado = {
            clase: "agotado",
            texto: "Agotado"
          };

        } else if (variante.stock <= 2) {

          nuevoEstado = {
            clase: "pocas",
            texto: "Últimas unidades"
          };

        } else {

          nuevoEstado = {
            clase: "disponible",
            texto: "Disponible"
          };

        }


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

// Arrancamos todo cuando carga la página
cargarProductos();
