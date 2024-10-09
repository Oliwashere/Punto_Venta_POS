// URL del backend para empleados y usuarios
const empleadosUrl = 'http://localhost:8080/empleados';
const usuariosUrl = 'http://localhost:8080/usuarios'; // URL para obtener usuarios
let globalEmployees = [];

// Obtener empleados y renderizarlos
async function fetchEmpleados() {
    try {
        const response = await fetch(empleadosUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener los empleados');
        }

        const employees = await response.json();
        renderEmployees(employees);
        globalEmployees = employees;
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron cargar los empleados.');
    }
}

// Renderizar empleados en la lista
function renderEmployees(employees) {
    const employeeContainer = document.getElementById("employees");
    if (employeeContainer) { // Verifica si el contenedor existe
        employeeContainer.innerHTML = "";

        employees.forEach(employee => {
            const employeeItem = document.createElement("div");
            employeeItem.classList.add("employee-item");
            employeeItem.innerHTML = `
                <span>${employee.nombres} ${employee.apellidos} - ${employee.telefono} (Estado: ${employee.estado})</span>
                <button onclick="editEmployee(${employee.id})">Editar</button>
                <button onclick="deleteEmployee(${employee.id})">Eliminar</button>
            `;
            employeeContainer.appendChild(employeeItem);
        });
    }
}

// Eliminar empleado
async function deleteEmployee(employeeId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
        return;
    }

    try {
        const response = await fetch(`${empleadosUrl}/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el empleado');
        }

        alert('Empleado eliminado exitosamente.');
        fetchEmpleados();
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al eliminar el empleado.');
    }
}

// Redirigir a página de edición
function editEmployee(employeeId) {
    window.location.href = `./registrarEmpleado.html?id=${employeeId}`;
}

// Obtener parámetros de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Obtener un empleado por ID
async function fetchEmpleadoById(employeeId) {
    try {
        const response = await fetch(`${empleadosUrl}/${employeeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el empleado');
        }

        const employee = await response.json();
        populateForm(employee);
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo cargar la información del empleado.');
    }
}

// Poner los datos del empleado en el formulario
function populateForm(employee) {
    document.getElementById("identificacion").value = employee.identificacion;
    document.getElementById("nombres").value = employee.nombres;
    document.getElementById("apellidos").value = employee.apellidos;
    document.getElementById("direccion").value = employee.direccion;
    document.getElementById("telefono").value = employee.telefono;
    document.getElementById("estado").value = employee.estado;

    // Seleccionar el usuario correspondiente en el select
    const usuarioSelect = document.getElementById("usuario-select");
    usuarioSelect.value = employee.usuario.id;

    // Seleccionar el rol correspondiente en el select
    document.getElementById("rol").value = employee.rol.id;

    // Cambiar el título y el texto del botón
    document.getElementById("form-title").innerText = "Editar Empleado";
    document.getElementById("submit-button").innerText = "Actualizar Empleado";
}

// Función para cargar los usuarios en el select
async function loadUsuarios() {
    try {
        console.log("Iniciando carga de usuarios...");

        const usuarioSelect = document.getElementById('usuario-select');

        // Verificar si el elemento usuarioSelect existe
        if (!usuarioSelect) {
            console.error('Elemento usuario-select no encontrado en el DOM');
            return; // Salir de la función si no existe el select
        }

        console.log("Elemento usuario-select encontrado:", usuarioSelect);

        const response = await fetch(usuariosUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });
        
        console.log("Respuesta obtenida del servidor:", response);

        // Verificar si la respuesta es correcta
        if (!response.ok) {
            throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`);
        }

        const usuarios = await response.json();
        console.log("Datos de usuarios recibidos:", usuarios);

        // Verificar si los datos de usuarios están en el formato correcto
        if (!Array.isArray(usuarios)) {
            throw new Error('La respuesta del servidor no es una lista de usuarios');
        }

        // Limpiar el select antes de agregar los usuarios
        usuarioSelect.innerHTML = '<option value="">Seleccionar usuario</option>';
        
        usuarios.forEach(usuario => {
            if (usuario && usuario.id && usuario.usuario) { // Verificar que cada usuario tenga los campos necesarios
                const option = document.createElement('option');
                option.value = usuario.id; // El ID del usuario
                option.textContent = usuario.usuario; // El nombre del usuario
                usuarioSelect.appendChild(option);
            } else {
                console.warn('Usuario con datos incompletos:', usuario);
            }
        });
    } catch (error) {
        console.error('Error al cargar los usuarios:', error);
        alert(`No se pudieron cargar los usuarios. Detalle: ${error.message}`);
    }
}

// Registrar o actualizar empleado
document.getElementById("employee-form")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const employeeId = getQueryParam('id');
    const isEditMode = !!employeeId;

    const employeeData = {
        identificacion: document.getElementById("identificacion").value,
        nombres: document.getElementById("nombres").value,
        apellidos: document.getElementById("apellidos").value,
        direccion: document.getElementById("direccion").value,
        telefono: document.getElementById("telefono").value,
        estado: document.getElementById("estado").value,
        usuario: {
            id: document.getElementById("usuario-select").value // Obtener el ID del usuario seleccionado
        },
        rol: {
            id: document.getElementById("rol").value, // El valor aquí debe ser el ID del rol
            nombre: document.getElementById("rol").options[document.getElementById("rol").selectedIndex].text // Nombre del rol
        }
    };

    try {
        let response;

        if (isEditMode) {
            // Actualizar empleado existente
            response = await fetch(`${empleadosUrl}/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            });
        } else {
            // Registrar nuevo empleado
            response = await fetch(empleadosUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            });
        }

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción.');
            } else {
                throw new Error('Error al guardar el empleado');
            }
        }

        if (isEditMode) {
            alert('Empleado actualizado exitosamente.');
        } else {
            alert('Empleado registrado exitosamente.');
        }

        window.location.href = "./administrador.html";
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
});

// Inicializar la página de registrar/editar empleado
window.onload = function() {
    console.log("Cargando página...");
    loadUsuarios(); // Cargar usuarios en el select

    const employeeId = getQueryParam('id');
    if (employeeId) {
        fetchEmpleadoById(employeeId);
    }

    // Cargar empleados solo si estamos en la página de gestión de empleados
    if (document.getElementById("employees")) {
        fetchEmpleados();
    }
};