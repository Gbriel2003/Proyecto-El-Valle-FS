import { useState, useEffect } from 'react';
import api from './api';
import ChangePassword from './ChangePassword';
import CustomSelect from './components/ui/CustomSelect';
import { User, Lock, ShieldAlert, Loader2, Calendar, Mail, KeyRound, Award } from 'lucide-react';

export default function AdministrarPerfil({ rolUsuario, crearNotificacion, debeCambiarPassword, onPasswordChanged }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados del número de teléfono
  const [prefijo, setPrefijo] = useState('');
  const [numero, setNumero] = useState('');
  const [guardandoTel, setGuardandoTel] = useState(false);

  const cargarUsuarioMe = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await api.get('/usuarios/me');
      setUsuario(res.data);
      if (res.data.telefono && res.data.telefono.length === 11) {
        setPrefijo(res.data.telefono.substring(0, 4));
        setNumero(res.data.telefono.substring(4));
      } else {
        setPrefijo('');
        setNumero('');
      }
    } catch (err) {
      console.error("Error al cargar datos de usuario:", err);
      setError("No se pudieron cargar los detalles de tu perfil.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarioMe();
  }, []);

  const guardarTelefono = async () => {
    if (!prefijo || numero.length !== 7) {
      if (crearNotificacion) {
        crearNotificacion("Error de validación", "Selecciona una operadora válida y escribe los 7 dígitos de tu número.", "error");
      } else {
        alert("Selecciona una operadora válida y escribe los 7 dígitos de tu número.");
      }
      return;
    }

    try {
      setGuardandoTel(true);
      const telCompleto = `${prefijo}${numero}`;
      await api.put('/usuarios/me/profile', { telefono: telCompleto });
      if (crearNotificacion) {
        crearNotificacion("Teléfono actualizado", "Tu número de teléfono se ha guardado correctamente.", "success");
      }
      setUsuario(prev => ({ ...prev, telefono: telCompleto }));
    } catch (err) {
      console.error("Error al guardar teléfono:", err);
      const detail = err.response?.data?.detail || "No se pudo actualizar tu número de teléfono.";
      if (crearNotificacion) {
        crearNotificacion("Error", detail, "error");
      } else {
        alert(detail);
      }
    } finally {
      setGuardandoTel(false);
    }
  };

  const esCuerpoTecnico = rolUsuario === 'admin' || rolUsuario === 'entrenador';

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Loader2 className="animate-spin mb-3 text-valle-green" size={36} />
        <p className="text-sm font-medium">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-xl text-sm text-red-700 font-medium max-w-lg mx-auto">
        <p className="font-bold mb-1">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full mx-auto pb-8 px-2 sm:px-4 lg:px-6">
      
      {/* Cabecera del Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center animate-fade-in-up">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-valle-green to-valle-green-light rounded-2xl flex items-center justify-center text-valle-gold font-black text-xl shadow-md border-2 border-valle-gold/30">
            {usuario?.nombre?.charAt(0).toUpperCase()}{usuario?.apellido?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-valle-black font-display capitalize">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Rol de Acceso: <span className="text-valle-green font-black">{usuario?.rol}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up space-y-6">
        
        {/* Tarjeta de Detalles del Perfil */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 w-full space-y-6">
          <h3 className="text-lg font-black text-slate-800 font-display flex items-center border-b border-slate-100 pb-3">
            <User className="text-valle-green mr-2" size={20} />
            Detalles del Perfil
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nombre</span>
              <span className="font-semibold text-slate-800 block capitalize">{usuario?.nombre}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Apellido</span>
              <span className="font-semibold text-slate-800 block capitalize">{usuario?.apellido}</span>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1"><Mail size={12} /> Correo Electrónico</span>
              <span className="font-semibold text-slate-800 block">{usuario?.correo}</span>
            </div>
            
            {/* Teléfono con validación de operadora venezolana */}
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Teléfono de Contacto</span>
              <div className="flex gap-2 items-center mt-1">
                <CustomSelect
                  value={prefijo}
                  onChange={(e) => setPrefijo(e.target.value)}
                  options={["0424", "0414", "0416", "0426", "0412", "0422"]}
                  placeholder="Prefijo"
                  className="w-28 shrink-0"
                />
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Solo números
                    if (val.length <= 7) setNumero(val);
                  }}
                  placeholder="1234567"
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2.5 flex-1 focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green font-semibold"
                />
                <button
                  onClick={guardarTelefono}
                  disabled={guardandoTel}
                  className="px-4 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-xs font-black transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {guardandoTel ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Formatos permitidos: 0424, 0414, 0416, 0426, 0412, 0422 seguido de 7 dígitos.</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1"><Award size={12} /> Rol del Sistema</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-valle-green/10 text-valle-green border border-valle-green/20 capitalize">
                {usuario?.rol}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1"><Calendar size={12} /> Fecha de Registro</span>
              <span className="font-semibold text-slate-800 block">
                {usuario?.fecha_registro ? new Date(usuario.fecha_registro).toLocaleDateString('es-VE', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Separador visual para scroll */}
        <div className="w-full border-t border-slate-200/60 my-6" />

        {/* Tarjeta de Seguridad (al final de la página) */}
        <div className="w-full">
          {esCuerpoTecnico ? (
            // Admin y Entrenador pueden cambiar contraseña directamente
            <ChangePassword
              crearNotificacion={crearNotificacion}
              obligatoria={debeCambiarPassword}
              onPasswordChanged={onPasswordChanged}
            />
          ) : (
            // Atletas y Nutricionistas requieren autorización
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                Cambio de Contraseña Restringido
              </h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-md">
                Por políticas de seguridad y control interno del club <strong>El Valle F.S.</strong>, los atletas y el personal de nutrición no pueden modificar su contraseña de acceso directamente.
              </p>
              <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-lg text-left text-xs font-bold text-amber-800 w-full flex items-start gap-2.5">
                <KeyRound size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Si requieres restablecer o cambiar tu clave de acceso, por favor solicita la modificación a un <strong>Administrador</strong> del sistema o al <strong>Director Técnico</strong> en el club.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
