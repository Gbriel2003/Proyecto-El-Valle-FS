import { useState } from 'react';
import api from './api';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [vista, setVista] = useState('login'); // 'login' o 'forgot'
    const [correoRecuperar, setCorreoRecuperar] = useState('');
    const [mensajeRecuperacion, setMensajeRecuperacion] = useState('');
    const [error, setError] = useState(() => {
        const sessionError = sessionStorage.getItem('valle_session_error');
        if (sessionError) {
            sessionStorage.removeItem('valle_session_error');
            return sessionError;
        }
        return '';
    });
    const [cargando, setCargando] = useState(false);
    const [cargandoRecuperacion, setCargandoRecuperacion] = useState(false);

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            // OAuth2 requiere los datos en formato Form-Data, no JSON
            const data = new URLSearchParams();
            data.append('username', formData.username);
            data.append('password', formData.password);

            const respuesta = await api.post('/login', data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (respuesta.data.access_token) {
                const token = respuesta.data.access_token;

                // MAGIA: Decodificamos el Token JWT para extraer el rol que viene desde FastAPI
                const payloadBase64 = token.split('.')[1];
                const payloadDecodificado = JSON.parse(atob(payloadBase64));

                localStorage.setItem('token_valle', token);
                localStorage.setItem('rol_usuario', payloadDecodificado.rol);
                localStorage.setItem('debe_cambiar_password', respuesta.data.debe_cambiar_password ? 'true' : 'false');
                sessionStorage.setItem('reciente_logueado', 'true');
                onLoginSuccess();
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('El correo o la contraseña son incorrectos.');
            } else {
                setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
            }
        } finally {
            setCargando(false);
        }
    };

    const manejarRecuperar = async (e) => {
        e.preventDefault();
        setError('');
        setMensajeRecuperacion('');
        setCargandoRecuperacion(true);

        try {
            const res = await api.post('/usuarios/solicitud-password', { correo: correoRecuperar });
            setMensajeRecuperacion(res.data.mensaje || 'Tu solicitud ha sido enviada al administrador. Una vez aprobada, se te asignará una contraseña temporal.');
            setCorreoRecuperar('');
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                setError('El correo electrónico ingresado no está registrado.');
            } else {
                setError('Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.');
            }
        } finally {
            setCargandoRecuperacion(false);
        }
    };

    return (
        <div className="min-h-screen lg:h-screen flex w-full bg-white overflow-x-hidden lg:overflow-hidden">
            {/* Mitad Izquierda - Imagen */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
                    style={{ backgroundImage: 'url(/equipo_login.png?v=3)' }}
                />
                <div className="absolute inset-0 bg-valle-green-dark/60 mix-blend-multiply" />
                <div className="absolute inset-0 bg-slate-900/60" />
                <div className="relative z-10 p-12 text-white max-w-2xl flex flex-col items-center text-center justify-center h-full">
                    <img 
                        src="/logo.png" 
                        alt="Escudo El Valle F.S." 
                        className="w-48 h-48 object-contain mb-8 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-110" 
                    />
                    <h1 className="text-5xl md:text-6xl font-black font-display tracking-tight leading-tight mb-6 drop-shadow-lg">
                        El Valle F.S.
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-100 font-bold leading-relaxed mb-8 drop-shadow-md">
                        "Un equipo, un sueño, un respeto inquebrantable, Somos El Valle F.S"
                    </p>
                    <div className="flex flex-col items-center gap-3 text-sm font-bold text-valle-gold tracking-widest uppercase">
                        <span className="w-16 h-1 bg-valle-gold rounded-full" />
                        Plataforma de Gestión Deportiva
                    </div>
                </div>
            </div>

            {/* Mitad Derecha - Formulario */}
            <div className="w-full lg:w-1/2 flex items-center justify-center relative px-4 sm:px-12 lg:px-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-valle-green/5 blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-valle-gold/5 blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

                <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                    {vista === 'login' ? (
                        <>
                            <div className="text-center lg:text-left mb-10">
                                <img 
                                    src="/logo.png" 
                                    alt="Escudo El Valle F.S." 
                                    className="w-28 h-28 object-contain mx-auto mb-6 block lg:hidden drop-shadow-[0_5px_15px_rgba(0,0,0,0.15)]" 
                                />
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                                    ¡Bienvenido de vuelta!
                                </h2>
                                <p className="text-sm font-medium text-slate-500">
                                    Ingresa tus credenciales para acceder a tu panel
                                </p>
                            </div>

                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-3.5 rounded-lg text-sm text-red-700 font-semibold flex items-center gap-2 animate-fade-in-up">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={manejarEnvio} className="space-y-5">
                            <div>
                                <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                                    Correo Electrónico
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-valle-green/50 hover:border-valle-green rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                                        placeholder="ejemplo@correo.com"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-black text-slate-900 uppercase tracking-wider">
                                        Contraseña
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => { setVista('forgot'); setError(''); }}
                                        className="text-xs font-bold text-valle-green hover:text-valle-green-light transition cursor-pointer"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-valle-green/50 hover:border-valle-green rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full py-3.5 mt-2 bg-linear-to-r from-valle-green to-valle-green-light hover:from-valle-green-light hover:to-valle-green text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-valle-green/10 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 group cursor-pointer"
                            >
                                {cargando ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Iniciando sesión...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Ingresar al Sistema</span>
                                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-valle-green/10 border-2 border-valle-green/20 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                                <Lock size={32} className="text-valle-green" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                                Solicitar Clave
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mt-1.5">
                                Ingresa tu correo para solicitar un restablecimiento al administrador.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-3.5 rounded-lg text-sm text-red-700 font-semibold flex items-center gap-2 animate-fade-in-up">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                {error}
                            </div>
                        )}

                        {mensajeRecuperacion ? (
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl text-sm text-emerald-800 font-semibold flex flex-col gap-2">
                                <span>{mensajeRecuperacion}</span>
                                <button
                                    type="button"
                                    onClick={() => { setVista('login'); setMensajeRecuperacion(''); }}
                                    className="mt-2 text-xs font-bold text-valle-green hover:underline text-left cursor-pointer"
                                >
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={manejarRecuperar} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-valle-green/50 hover:border-valle-green rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                                            placeholder="ejemplo@correo.com"
                                            value={correoRecuperar}
                                            onChange={(e) => setCorreoRecuperar(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={cargandoRecuperacion}
                                    className="w-full py-3.5 bg-linear-to-r from-valle-green to-valle-green-light hover:from-valle-green-light hover:to-valle-green text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 group cursor-pointer"
                                >
                                    {cargandoRecuperacion ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Enviando solicitud...</span>
                                        </>
                                    ) : (
                                        <span>Solicitar Recuperación</span>
                                    )}
                                </button>

                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setVista('login'); setError(''); }}
                                        className="text-xs font-bold text-slate-500 hover:text-valle-green transition cursor-pointer"
                                    >
                                        Volver a inicio de sesión
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
}