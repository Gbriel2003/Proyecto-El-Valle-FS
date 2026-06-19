import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token_valle');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para manejar la caducidad de la sesión
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isLoginRequest = error.config && error.config.url && error.config.url.includes('/login');
            if (!isLoginRequest) {
                // Borrar datos de autenticación
                localStorage.removeItem('token_valle');
                localStorage.removeItem('rol_usuario');
                localStorage.removeItem('valle_notificaciones');

                // Almacenar el mensaje de error para mostrar en el Login
                sessionStorage.setItem('valle_session_error', 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.');

                // Recargar la página para forzar el enrutamiento al Login
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
