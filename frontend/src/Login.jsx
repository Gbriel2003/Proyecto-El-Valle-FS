import { useState } from 'react';
import api from './api';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

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
                // Ahora sí guardamos el rol real (admin, entrenador, atleta)
                localStorage.setItem('rol_usuario', payloadDecodificado.rol);
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200/70 relative overflow-hidden px-4">
            {/* Ambient decorative brand colors blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-valle-green/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-valle-gold/5 blur-3xl pointer-events-none" />

            <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6 relative z-10 transition-all duration-300 hover:shadow-2xl hover:border-valle-gold/30 animate-fade-in-up">

                <div className="text-center flex flex-col items-center">
                    <img 
                        src="/logo.png" 
                        alt="Logo El Valle F.S." 
                        className="w-24 h-24 object-contain mb-4 filter drop-shadow-sm transition-transform duration-500 hover:scale-105" 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} 
                    />
                    <div className="w-16 h-16 bg-valle-green rounded-2xl hidden items-center justify-center mb-4 shadow-md border-2 border-valle-gold/30">
                        <ShieldCheck size={32} className="text-valle-gold" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                        El Valle <span className="text-valle-gold font-medium">F.S.</span>
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-1.5">
                        Plataforma de Gestión Inteligente
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Correo Electrónico
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                                placeholder="ejemplo@correo.com"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Contraseña
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
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
            </div>
        </div>
    );
}