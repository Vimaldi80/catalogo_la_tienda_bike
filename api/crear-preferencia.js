// api/crear-preferencia.js
//
// Esta función corre en el servidor de Vercel, no en el navegador del cliente.
// Su trabajo es el más importante de todo el proyecto: recibe qué productos
// quiere el cliente, y ELLA MISMA calcula el precio real leyendo products.json
// y envio.json del propio proyecto. Nunca confía en un precio que venga desde
// el navegador, porque cualquiera podría manipularlo antes de que llegue.

export default async function handler(req, res) {
  // Solo aceptamos POST. Cualquier otro método (alguien probando la URL
  // directo en el navegador, por ejemplo) se rechaza.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { carrito, datosCliente } = req.body;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }
    if (!datosCliente || !datosCliente.region) {
      return res.status(400).json({ error: "Faltan datos del cliente" });
    }

    // -----------------------------------------------------------
    // 1. Leer los precios REALES desde el propio sitio publicado,
    //    nunca desde lo que mandó el navegador.
    // -----------------------------------------------------------
    const origen = `https://${req.headers.host}`;

    const [resProductos, resEnvio] = await Promise.all([
      fetch(`${origen}/products.json`),
      fetch(`${origen}/envio.json`),
    ]);
    const dataProductos = await resProductos.json();
    const dataEnvio = await resEnvio.json();

    const todosLosProductos = dataProductos.productos;

    // -----------------------------------------------------------
    // 2. Armar la lista de items con el precio real de cada uno.
    // -----------------------------------------------------------
    const items = [];

    for (const item of carrito) {
      const producto = todosLosProductos.find((p) => p.id === item.id);
      if (!producto) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.id}` });
      }

      const cantidad = Number(item.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) {
        return res.status(400).json({ error: `Cantidad inválida para ${item.id}` });
      }

      items.push({
        title: item.variante ? `${producto.nombre} (${item.variante})` : producto.nombre,
        quantity: cantidad,
        unit_price: producto.precio,
        currency_id: "CLP",
      });
    }

    // -----------------------------------------------------------
    // 3. Calcular el envío real, según la región del cliente.
    // -----------------------------------------------------------
    const zona = dataEnvio.zonas.find((z) => z.regiones.includes(datosCliente.region));
    if (!zona) {
      return res.status(400).json({ error: "Región no válida" });
    }

    const subtotal = items.reduce((suma, i) => suma + i.unit_price * i.quantity, 0);
    const envioGratis = dataEnvio.envioGratisDesde > 0 && subtotal >= dataEnvio.envioGratisDesde;
    const costoEnvio = envioGratis ? 0 : zona.precio;

    if (costoEnvio > 0) {
      items.push({
        title: `Envío (${zona.nombre})`,
        quantity: 1,
        unit_price: costoEnvio,
        currency_id: "CLP",
      });
    }

    // -----------------------------------------------------------
    // 4. Crear la preferencia de pago en Mercado Pago.
    // -----------------------------------------------------------
    const respuestaMP = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        payer: {
          name: datosCliente.nombre,
          email: datosCliente.email,
          phone: { number: datosCliente.telefono },
        },
        back_urls: {
          success: `${origen}/gracias.html`,
          failure: `${origen}/pago-fallido.html`,
          pending: `${origen}/pago-pendiente.html`,
        },
        auto_return: "approved",
        metadata: {
          direccion: datosCliente.direccion,
          comuna: datosCliente.comuna,
          region: datosCliente.region,
          referencias: datosCliente.referencias || "",
        },
      }),
    });

    const dataMP = await respuestaMP.json();

    if (!respuestaMP.ok) {
      console.error("Error de Mercado Pago:", dataMP);
      return res.status(502).json({ error: "No se pudo crear el pago" });
    }

    // Le devolvemos al navegador solo el link, nada de credenciales.
    return res.status(200).json({ linkPago: dataMP.init_point });

  } catch (error) {
    console.error("Error en crear-preferencia:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}