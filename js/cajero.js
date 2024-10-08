// URL del backend para productos y ventas
const productosUrl = 'http://localhost:8080/productos';
const ventasUrl = 'http://localhost:8080/ventas';

// Variables para el carrito
let cart = [];

// Obtener los productos del backend
async function fetchProductos() {
    try {
        const response = await fetch(productosUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`  // Incluir el token JWT
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener los productos');
        }

        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron cargar los productos.');
    }
}

// Renderizar productos en el contenedor de productos
function renderProducts(products) {
    const productContainer = document.getElementById("products");
    productContainer.innerHTML = "";

    products.forEach(product => {
        const productItem = document.createElement("div");
        productItem.classList.add("product-item");
        productItem.innerHTML = `
            <span>${product.nombre} - $${product.precioUnitario} (Stock: ${product.cantidadDisponible})</span>
            <button onclick="addToCart(${product.id})">Agregar</button>
        `;
        productContainer.appendChild(productItem);
    });
}

// Agregar un producto al carrito
function addToCart(productId) {
    fetch(`${productosUrl}/${productId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(product => {
        if (product.cantidadDisponible > 0) {
            cart.push({...product, cantidad: 1});  // Agregar con cantidad inicial de 1
            renderCart();
        } else {
            alert("Producto sin stock disponible");
        }
    })
    .catch(error => {
        console.error('Error al agregar producto:', error);
    });
}

// Renderizar el carrito
function renderCart() {
    const cartContainer = document.getElementById("cart");
    cartContainer.innerHTML = "";  // Limpiar el carrito

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>El carrito está vacío.</p>";
        return;
    }

    cart.forEach((product, index) => {
        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <span>${product.nombre} - $${product.precioUnitario} (x${product.cantidad})</span>
            <button onclick="removeFromCart(${index})">Eliminar</button>
        `;
        cartContainer.appendChild(cartItem);
    });
}

// Eliminar producto del carrito
function removeFromCart(index) {
    cart.splice(index, 1);  // Eliminar producto del carrito
    renderCart();
}

// Generar factura
async function generateInvoice() {
    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    let total = 0;
    const ventaProductos = [];

    for (const product of cart) {
        total += product.precioUnitario * product.cantidad;
        ventaProductos.push({
            producto_id: product.id,
            cantidad: product.cantidad,
            precio: product.precioUnitario
        });
    }

    const iva = total * 0.16;
    const totalConIva = total + iva;

    // Mostrar la factura
    const invoiceContainer = document.getElementById("invoice");
    invoiceContainer.innerHTML = '';  // Limpiar factura previa
    cart.forEach(product => {
        const invoiceItem = document.createElement("div");
        invoiceItem.innerHTML = `${product.nombre} - $${product.precioUnitario} (x${product.cantidad})`;
        invoiceContainer.appendChild(invoiceItem);
    });

    const totalElement = document.createElement("div");
    totalElement.innerHTML = `
        <strong>Subtotal: $${total.toFixed(2)}</strong><br>
        <strong>IVA: $${iva.toFixed(2)}</strong><br>
        <strong>Total: $${totalConIva.toFixed(2)}</strong>
    `;
    invoiceContainer.appendChild(totalElement);

    // Registrar la venta en el backend
    const ventaData = {
        numeroVenta: `VENTA-${Date.now()}`,  // Generar un número de venta único
        total: totalConIva,
        empleado_id: localStorage.getItem('loggedInUserId'),
        productos: ventaProductos
    };

    try {
        const response = await fetch(ventasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify(ventaData)
        });

        if (!response.ok) {
            throw new Error('Error al registrar la venta');
        }

        const venta = await response.json();

        // Registrar detalles de la venta
        await Promise.all(ventaProductos.map(async (producto) => {
            const detalleData = {
                venta_id: venta.id,
                producto_id: producto.producto_id,
                cantidad: producto.cantidad,
                precio: producto.precio
            };

            const detalleResponse = await fetch(`${ventasUrl}/detalle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                },
                body: JSON.stringify(detalleData)
            });

            if (!detalleResponse.ok) {
                throw new Error('Error al registrar el detalle de la venta');
            }
        }));

        alert('Venta registrada exitosamente');
        cart = [];
        renderCart();
    } catch (error) {
        console.error('Error al registrar la venta:', error);
        alert('Hubo un error al registrar la venta');
    }
}

// Cargar productos cuando la página esté lista
window.onload = function() {
    fetchProductos();
    renderCart();
};
