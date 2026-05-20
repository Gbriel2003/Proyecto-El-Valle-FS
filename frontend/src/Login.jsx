import React, { useState } from 'react';
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">

                <div className="text-center flex flex-col items-center">
                    <img src="/logo.png" alt="Logo El Valle F.S." className="w-24 h-24 object-contain mb-4" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <div className="w-16 h-16 bg-valle-green rounded-xl hidden items-center justify-center mb-4 shadow-sm">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">El Valle F.S.</h2>
                    <p className="text-sm text-slate-500 mt-1">Plataforma de Gestión Inteligente</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={manejarEnvio} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="w-full pl-10 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green transition"
                                placeholder="ejemplo@correo.com"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full pl-10 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green transition"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full py-3 mt-2 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-sm font-bold transition active:scale-[0.98] disabled:opacity-70 shadow-sm"
                    >
                        {cargando ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
}