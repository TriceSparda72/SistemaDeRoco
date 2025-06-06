// Usuarios predefinidos con roles
const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "empleado1", password: "empleado123", role: "employee" }
];

// Función para manejar el inicio de sesión
document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Evitar el comportamiento por defecto del formulario

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Validar credenciales
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Guardar el rol en localStorage
        localStorage.setItem("role", user.role);
        alert(`Inicio de sesión exitoso. Bienvenido, ${user.role === "admin" ? "Administrador" : "Empleado"}.`);

        // Redirigir según el rol
        if (user.role === "admin") {
            window.location.href = "inicio.html"; // Página principal para el administrador
        } else if (user.role === "employee") {
            window.location.href = "delivery.html"; // Página exclusiva para el empleado
        }
    } else {
        // Mostrar mensaje de error
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.";
    }
});

// Función para manejar el cierre de sesión
function logout() {
    localStorage.removeItem("role"); // Eliminar el rol almacenado
    alert("Has cerrado sesión exitosamente.");
    window.location.href = "login.html"; // Redirigir al inicio de sesión
}
