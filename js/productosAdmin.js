// URL del backend para productos y ventas
const productosUrl = 'http://localhost:8080/productos';
let globalProducts = [];

// Obtener productos y renderizarlos
async function fetchProductos() {
    try {
        const response = await fetch(productosUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
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

// Renderizar productos en la lista
function renderProducts(products) {
    const productContainer = document.getElementById("products");
    if (productContainer) { // Verifica si el contenedor existe
        productContainer.innerHTML = "";

        products.forEach(product => {
            const productItem = document.createElement("div");
            productItem.classList.add("product-item");
            productItem.innerHTML = `
                <span>${product.nombre} - $${product.precioUnitario} (Stock: ${product.cantidadDisponible})</span>
                <button onclick="editProduct(${product.id})">Editar</button>
                <button onclick="deleteProduct(${product.id})">Eliminar</button>
            `;
            productContainer.appendChild(productItem);
        });
    }
}

// Eliminar producto
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`${productosUrl}/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el producto');
        }

        alert('Producto eliminado exitosamente.');
        fetchProductos();
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al eliminar el producto.');
    }
}

// Redirigir a página de edición
function editProduct(productId) {
    window.location.href = `./registrarProductoAdmin.html?id=${productId}`;
}

// Obtener parámetros de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Obtener un producto por ID
async function fetchProductoById(productId) {
    try {
        const response = await fetch(`${productosUrl}/${productId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el producto');
        }

        const product = await response.json();
        populateForm(product);
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo cargar la información del producto.');
    }
}

function populateForm(product) {
    document.getElementById("nombre").value = product.nombre;
    document.getElementById("descripcion").value = product.descripcion;
    document.getElementById("precio").value = product.precioUnitario;
    document.getElementById("cantidad").value = product.cantidadDisponible;
    document.getElementById("codigoProducto").value = product.codigoProducto; // Agregando el campo de código
    document.getElementById("form-title").innerText = "Editar Producto";
    document.getElementById("submit-button").innerText = "Actualizar Producto";
}

// Registrar o actualizar producto
document.getElementById("product-form")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const productId = getQueryParam('id');
    const isEditMode = !!productId;

    const productData = {
        codigoProducto: document.getElementById("codigoProducto").value, // Agregando el campo de código
        nombre: document.getElementById("nombre").value,
        descripcion: document.getElementById("descripcion").value,
        precioUnitario: parseFloat(document.getElementById("precio").value),
        cantidadDisponible: parseInt(document.getElementById("cantidad").value)
    };

    try {
        let response;
        if (isEditMode) {
            // Actualizar producto existente
            response = await fetch(`${productosUrl}/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Registrar nuevo producto
            response = await fetch(productosUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigoProducto: productData.codigoProducto,
                    nombre: productData.nombre,
                    descripcion: productData.descripcion,
                    precioUnitario: productData.precioUnitario,
                    cantidadDisponible: productData.cantidadDisponible
                })
            });
        }

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción.');
            } else {
                throw new Error('Error al guardar el producto');
            }
        }

        if (isEditMode) {
            alert('Producto actualizado exitosamente.');
        } else {
            alert('Producto registrado exitosamente.');
        }

        window.location.href = "./productosAdmin.html";
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
});

// Inicializar la página de registrar/editar producto
window.onload = function() {
    const productId = getQueryParam('id');
    if (productId) {
        fetchProductoById(productId);
    }
    
    // Cargar productos solo si estamos en la página de gestión de productos
    if (document.getElementById("products")) {
        fetchProductos();
    }
};