// URL del backend para productos y ventas
let globalProducts = [];
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
        globalProducts = products;
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
            <input type="number" id="quantity-${product.id}" min="1" max="${product.cantidadDisponible}" value="1">
            <button onclick="addToCart(${product.id})">Agregar</button>
        `;
        productContainer.appendChild(productItem);
    });
}

// Agregar un producto al carrito
function addToCart(productId) {
    // Obtener la cantidad seleccionada
    const quantity = parseInt(document.getElementById(`quantity-${productId}`).value);
    
    fetch(`${productosUrl}/${productId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(product => {
        if (product.cantidadDisponible >= quantity) {
            cart.push({...product, cantidad: quantity});  // Agregar con la cantidad seleccionada
            renderCart();

            // Actualizar el stock en el backend
            updateProductStock(productId, product.cantidadDisponible - quantity);
        } else {
            alert("Cantidad solicitada no disponible en stock");
        }
    })
    .catch(error => {
        console.error('Error al agregar producto:', error);
    });
}

function updateProductStock(productId, newStock) {
    globalProducts.forEach(function(e){
        if(e.id === productId){
            e.cantidadDisponible = newStock;
            console.log(e.cantidadDisponible);            
        }
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

// Obtener los datos del empleado desde localStorage
function obtenerEmpleadoDesdeLocalStorage() {
    const empleado = JSON.parse(localStorage.getItem('empleado'));  // Obtener la información del empleado desde localStorage
    if (!empleado) {
        alert('No se ha encontrado la información del empleado en localStorage.');
        return null;
    }
    return empleado;  // Retornar la información del empleado directamente
}

// Registrar la venta en el backend
async function registrarVenta(total) {
    const empleado = obtenerEmpleadoDesdeLocalStorage();
    
    if (!empleado) {
        alert('No se pudo obtener la información del empleado.');
        return;
    }

    // Estructura de la venta, con cliente como null por ahora
    const venta = {
        numeroVenta: generarNumeroVenta(),  // Generar un número de venta único
        fechaVenta: new Date().toISOString(),  // Fecha actual en formato ISO
        total: total,
        empleado: empleado,  // Empleado obtenido de localStorage
        cliente: null  // Cliente puede ir como null
    };

    try {
        const response = await fetch(ventasUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(venta)
        });

        if (!response.ok) {
            throw new Error('Error al registrar la venta');
        }

        console.log('Venta registrada exitosamente.');
        alert('Venta registrada exitosamente.');
    } catch (error) {
        console.error('Error al registrar la venta:', error);
        alert('Hubo un error al registrar la venta.');
    }
}

// Generar número de venta único
function generarNumeroVenta() {
    const randomNumber = Math.floor(Math.random() * 10000);
    return `VENTA${randomNumber.toString().padStart(4, '0')}`;
}

// Actualizar stock de cada producto al generar la factura
async function updateStockOnInvoice() {
    try {
        // Recorrer los productos en el carrito
        for (const product of cart) {
            const newStock = product.cantidadDisponible - product.cantidad;

            // Enviar la solicitud PUT al backend con la estructura completa del producto
            await fetch(`${productosUrl}/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: product.id,
                    codigoProducto: product.codigoProducto,
                    nombre: product.nombre,
                    descripcion: product.descripcion,
                    precioUnitario: product.precioUnitario,
                    cantidadDisponible: newStock  // Actualizar la cantidad disponible
                })
            });

            // Actualizar el stock también en la variable globalProducts
            updateProductStock(product.id, newStock);
        }

        console.log('Stock actualizado exitosamente.');
    } catch (error) {
        console.error('Error al actualizar el stock:', error);
        alert('Hubo un error al generar la factura y actualizar el stock.');
    }
}

// Modificar la función de generar factura para actualizar el stock y registrar la venta
async function generateInvoice() {
    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    let total = 0;

    // Calcular el total de la compra
    for (const product of cart) {
        total += product.precioUnitario * product.cantidad;
    }

    const iva = total * 0.19;
    const totalConIva = total + iva;

    // Mostrar la factura en la interfaz
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

    // Actualizar el stock de los productos en el backend
    await updateStockOnInvoice();

    // Registrar la venta
    await registrarVenta(totalConIva);

    // Limpiar el carrito después de generar la factura
    cart = [];
    renderCart();

    // Actualizar la lista de productos
    await fetchProductos(); // <-- Agregar esta línea
}


// Cargar productos cuando la página esté lista
window.onload = function() {
    fetchProductos();
    renderCart();
};