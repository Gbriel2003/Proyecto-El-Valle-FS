import { useState } from 'react';
import api from './api';
import { Lock, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

export default function ChangePassword({ crearNotificacion, onPasswordChanged, obligatoria = False }) {
  const [passwordActual, setPasswordActual] = useState('');
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
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (passwordActual === nuevaPassword) {
      setError('La nueva contraseña no puede ser igual a la contraseña actual.');
      return;
    }

    setCargando(true);

    try {
      await api.put('/usuarios/me/password', {
        current_password: passwordActual,
        new_password: nuevaPassword
      });

      setExito(true);
      if (crearNotificacion) {
        crearNotificacion(
          "Contraseña Actualizada",
          "Tu contraseña se ha cambiado exitosamente.",
          "success"
        );
      }
      
      // Limpiar campos
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');

      if (onPasswordChanged) {
        // Ejecutar callback para notificar al contenedor padre que el cambio se hizo
        setTimeout(() => {
          onPasswordChanged();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Ocurrió un error al cambiar la contraseña. Por favor, verifica tus datos.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={`w-full ${obligatoria ? 'max-w-md mx-auto my-8' : ''} animate-fade-in-up`}>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col space-y-4">
        <div className="text-center flex flex-col items-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm border ${
            obligatoria 
              ? 'bg-amber-50 border-amber-300 text-amber-600 animate-pulse' 
              : 'bg-valle-green/10 border-valle-green/20 text-valle-green'
          }`}>
            {obligatoria ? <ShieldAlert size={24} /> : <Lock size={24} />}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
            {obligatoria ? 'Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
            {obligatoria 
              ? 'Por motivos de seguridad, debes cambiar la contraseña temporal asignada por el administrador antes de acceder al sistema.' 
              : 'Actualiza tu contraseña periódicamente para mantener tu cuenta segura.'}
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
            <span>¡Contraseña actualizada con éxito! Redirigiendo...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Contraseña Actual
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                placeholder="••••••••"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 my-3 pt-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400 group-focus-within:text-valle-green transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 transition placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-valle-green focus:ring-4 focus:ring-valle-green/10"
                  placeholder="Repite la nueva contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando || exito}
            className="w-full py-2.5 mt-2 bg-linear-to-r from-valle-green to-valle-green-light hover:from-valle-green-light hover:to-valle-green text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-valle-green/10 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 group cursor-pointer"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Actualizando contraseña...</span>
              </>
            ) : (
              <span>Actualizar Contraseña</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
