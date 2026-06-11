import { useState } from 'react';
import api from './api';
import { Lock, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

export default function ResetPassword({ token, onResetSuccess, crearNotificacion }) {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito(false);

    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);

    try {
      await api.post('/usuarios/reset-password', {
        token: token,
        new_password: nuevaPassword
      });

      setExito(true);
      if (crearNotificacion) {
        crearNotificacion(
          "Contraseña Restablecida",
          "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.",
          "success"
        );
      }

      setNuevaPassword('');
      setConfirmarPassword('');

      setTimeout(() => {
        if (onResetSuccess) {
          onResetSuccess();
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('El token es inválido o ha expirado. Por favor, solicita otro enlace de recuperación.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200/70 relative overflow-hidden px-4">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-valle-green/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-valle-gold/5 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6 relative z-10 transition-all duration-300 hover:shadow-2xl">
        
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-valle-green/10 border border-valle-green/20 rounded-2xl flex items-center justify-center mb-4 shadow-md">
            <Lock size={32} className="text-valle-green" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Restablecer Contraseña
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
          </p>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-3.5 rounded-lg text-sm text-red-700 font-semibold flex items-center gap-2 animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        {exito && (
          <div className="bg-emerald-50/80 backdrop-blur-sm border-l-4 border-emerald-500 p-3.5 rounded-lg text-sm text-emerald-700 font-semibold flex items-center gap-2 animate-fade-in-up">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>¡Contraseña restablecida! Redirigiendo a inicio de sesión...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nueva Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                disabled={exito}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                placeholder="Repite la contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                disabled={exito}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando || exito}
            className="w-full py-3.5 mt-2 bg-linear-to-r from-valle-green to-valle-green-light hover:from-valle-green-light hover:to-valle-green text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-valle-green/10 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 group cursor-pointer"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Restableciendo contraseña...</span>
              </>
            ) : (
              <span>Restablecer Contraseña</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onResetSuccess}
            className="text-xs font-bold text-valle-green hover:text-valle-green-light transition cursor-pointer"
          >
            Volver a inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
