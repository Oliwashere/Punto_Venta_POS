const ventasUrl = 'http://172.16.101.164:8080/demo-0.0.1-SNAPSHOT/ventas';

// Obtener el registro de ventas
async function fetchVentas() {
    try {
        const response = await fetch(ventasUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el registro de ventas');
        }

        const ventas = await response.json();
        renderVentas(ventas);
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron cargar las ventas.');
    }
}

// Renderizar el registro de ventas
function renderVentas(ventas) {
    const ventasContainer = document.getElementById("ventas");
    ventasContainer.innerHTML = "";

    ventas.forEach(venta => {
        const ventaItem = document.createElement("div");
        ventaItem.classList.add("venta-item");
        ventaItem.innerHTML = `
            <span>Venta #${venta.numeroVenta} - Total: $${venta.total} - Fecha: ${venta.fechaVenta}</span>
        `;
        ventasContainer.appendChild(ventaItem);
    });
}

// Cargar ventas cuando la página esté lista
window.onload = function() {
    fetchVentas();
};
