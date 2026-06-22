import { useState, useEffect } from 'react';
import api from './api';
import ChangePassword from './ChangePassword';
import CustomSelect from './components/ui/CustomSelect';
import { User, Lock, ShieldAlert, Loader2, Calendar, Mail, KeyRound, Award } from 'lucide-react';

export default function AdministrarPerfil({ rolUsuario, crearNotificacion, debeCambiarPassword, onPasswordChanged }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nombre: '', apellido: '', cedula: '', telefono: '' });
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const cargarUsuarioMe = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await api.get('/usuarios/me');
      setUsuario(res.data);
      setFormData({
        nombre: res.data.nombre || '',
        apellido: res.data.apellido || '',
        cedula: res.data.cedula || '',
        telefono: res.data.telefono || ''
      });
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setGuardando(true);
      const res = await api.put(`/usuarios/${usuario.id}`, formData);
      setUsuario(res.data);
      crearNotificacion("Perfil actualizado", "Tus datos personales fueron guardados.", "success");
    } catch (err) {
      crearNotificacion("Error al guardar", err.response?.data?.detail || "No se pudo actualizar el perfil", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      crearNotificacion("Error", "La imagen no puede pesar más de 5MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setSubiendoFoto(true);
      const res = await api.post('/usuarios/me/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUsuario({ ...usuario, foto_perfil: res.data.foto_perfil });
      crearNotificacion("¡Excelente!", "Tu foto de perfil se ha actualizado correctamente. (Refresca para ver los cambios en la cabecera)", "success");
    } catch (err) {
      crearNotificacion("Error al subir foto", err.response?.data?.detail || "Hubo un problema al subir la imagen.", "error");
    } finally {
      setSubiendoFoto(false);
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center animate-fade-in-up gap-4">
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="shrink-0">
            {usuario?.foto_perfil ? (
              <img 
                src={usuario.foto_perfil.startsWith('http') ? usuario.foto_perfil : `${api.defaults.baseURL}${usuario.foto_perfil.startsWith('/') ? '' : '/'}${usuario.foto_perfil}`} 
                alt="Perfil" 
                className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-valle-gold/30" 
              />
            ) : (
              <div className="w-16 h-16 bg-linear-to-br from-valle-green to-valle-green-light rounded-2xl flex items-center justify-center text-valle-gold font-black text-2xl shadow-md border-2 border-valle-gold/30">
                {usuario?.nombre?.charAt(0).toUpperCase()}{usuario?.apellido?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-valle-black font-display capitalize">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5 mb-2">
              Rol de Acceso: <span className="text-valle-green font-black">{usuario?.rol}</span>
            </p>
            <label className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors border border-slate-200 shadow-sm active:scale-95">
              {subiendoFoto ? <Loader2 className="animate-spin mr-1.5" size={12} /> : null}
              {subiendoFoto ? "Subiendo..." : "Cambiar Foto"}
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} disabled={subiendoFoto} />
            </label>
          </div>
        </div>
        {rolUsuario === 'admin' && (
          <button
            onClick={handleSave}
            disabled={guardando}
            className="w-full sm:w-auto px-6 py-2.5 bg-valle-gold hover:bg-yellow-500 text-valle-black rounded-xl font-black text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {guardando ? <Loader2 className="animate-spin" size={16} /> : null}
            Guardar Cambios
          </button>
        )}
      </div>

      <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Tarjeta de Detalles del Perfil */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 w-full flex flex-col h-full space-y-6">
          <h3 className="text-lg font-black text-slate-800 font-display flex items-center border-b border-slate-100 pb-3">
            <User className="text-valle-green mr-2" size={20} />
            Detalles del Perfil
          </h3>
          
          <div className="space-y-5 max-w-2xl">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={rolUsuario !== 'admin'}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 capitalize shadow-inner ${rolUsuario !== 'admin' ? 'cursor-not-allowed' : 'focus:border-valle-green focus:ring-1 focus:ring-valle-green'}`}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={rolUsuario !== 'admin'}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 capitalize shadow-inner ${rolUsuario !== 'admin' ? 'cursor-not-allowed' : 'focus:border-valle-green focus:ring-1 focus:ring-valle-green'}`}
                />
              </div>
            </div>

            {/* Correo Electrónico y Cédula */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} /> Correo Electrónico
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 cursor-not-allowed shadow-inner select-none truncate">
                  {usuario?.correo || 'Cargando...'}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  disabled={rolUsuario !== 'admin'}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 uppercase shadow-inner ${rolUsuario !== 'admin' ? 'cursor-not-allowed' : 'focus:border-valle-green focus:ring-1 focus:ring-valle-green'}`}
                  placeholder="No registrada"
                />
              </div>
            </div>
            
            {/* Teléfono de Contacto */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={rolUsuario !== 'admin'}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 shadow-inner ${rolUsuario !== 'admin' ? 'cursor-not-allowed' : 'focus:border-valle-green focus:ring-1 focus:ring-valle-green'}`}
                placeholder="No registrado"
              />
            </div>

            {/* Metadatos (Rol y Fecha) */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-linear-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:border-emerald-300 transition-all">
                <div className="absolute right-0 top-0 w-16 h-16 bg-linear-to-bl from-emerald-200/40 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-extrabold text-emerald-800/70 uppercase tracking-widest flex items-center gap-1.5 mb-2 sm:mb-3 z-10">
                  <Award size={14} className="text-emerald-500 drop-shadow-sm" /> 
                  Rol del Sistema
                </span>
                <div className="z-10 mt-auto">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 capitalize tracking-wide">
                    {usuario?.rol}
                  </span>
                </div>
              </div>

              <div className="bg-linear-to-br from-sky-50 to-sky-100/50 border border-sky-200/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md hover:border-sky-300 transition-all">
                <div className="absolute right-0 top-0 w-16 h-16 bg-linear-to-bl from-sky-200/40 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-extrabold text-sky-800/70 uppercase tracking-widest flex items-center gap-1.5 mb-2 sm:mb-3 z-10">
                  <Calendar size={14} className="text-sky-500 drop-shadow-sm" /> 
                  Fecha de Registro
                </span>
                <div className="z-10 mt-auto">
                  <span className="font-black text-sky-950 text-sm sm:text-base tracking-tight">
                    {usuario?.fecha_registro ? new Date(usuario.fecha_registro).toLocaleDateString('es-VE', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Tarjeta de Seguridad */}
        <div className="w-full h-full">
          {esCuerpoTecnico ? (
            // Admin y Entrenador pueden cambiar contraseña directamente
            <ChangePassword
              crearNotificacion={crearNotificacion}
              obligatoria={debeCambiarPassword}
              onPasswordChanged={onPasswordChanged}
            />
          ) : (
            // Atletas y Nutricionistas requieren autorización
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center flex flex-col items-center justify-center space-y-4 h-full">
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
