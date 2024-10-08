// URL del backend para la autenticación
const loginUrl = 'http://localhost:8080/auth/login';

// Función para hacer la solicitud POST de autenticación
function login(loginData) {
    fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)  // Convertir el objeto loginData a formato JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();  // Parsear la respuesta JSON solo una vez
    })
    .then(data => {
        // Guardar el token JWT en localStorage
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('empleado', JSON.stringify(data.empleado));  // Guardar la información del empleado

        // Obtener el rol del usuario
        const userRole = data.rol;
        console.log('Contenido completo del token decodificado:', userRole);

        // Redirigir según el rol del usuario
        if (userRole === 'Cajero') {
            localStorage.setItem("loggedInUser", "cajero");
            window.location.href = './view/cajero.html';  // Redirigir a la página del cajero
        } else if (userRole === 'Gerente') {
            localStorage.setItem("loggedInUser", "gerente");
            window.location.href = './view/gerente.html';  // Redirigir a la página del gerente
        } else if (userRole === 'Administrador') {
            localStorage.setItem("loggedInUser", "administrador");
            window.location.href = './view/administrador.html';  // Redirigir a la página del administrador
        } else {
            document.getElementById('error').textContent = 'Rol no válido';
        }
    })
    .catch(error => {
        alert('Error: No se pudo conectar al servidor');
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.textContent = '*  Usuario o contraseña incorrectos';
        }
    });
}

const boton = document.getElementById('button');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

boton.addEventListener('click', function() {
    const username = usernameInput.value;
    const password = passwordInput.value;

    const loginData = {
        usuario: username,
        contrasena: password
    };

    login(loginData);
});

usernameInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        boton.click();
    }
});


function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}