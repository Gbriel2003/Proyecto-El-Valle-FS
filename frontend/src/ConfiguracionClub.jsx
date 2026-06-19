import { useState, useEffect } from 'react';
import api from './api';
import { Shield, UserPlus, Trash2, Mail, Lock, X, Pencil } from 'lucide-react';
import CustomSelect from './components/ui/CustomSelect';

const getCedulaParts = (cedula) => {
  if (!cedula) return { tipo: 'V', numero: '' };
  if (cedula.includes('-')) {
    const parts = cedula.split('-');
    return { tipo: parts[0], numero: parts[1] };
  }
  return { tipo: 'V', numero: cedula };
};

const getTelefonoParts = (telefono) => {
  if (!telefono) return { prefijo: '0414', numero: '' };
  if (telefono.includes('-')) {
    const parts = telefono.split('-');
    return { prefijo: parts[0], numero: parts[1] };
  }
  if (telefono.length === 11) {
    return { prefijo: telefono.substring(0, 4), numero: telefono.substring(4) };
  }
  return { prefijo: '0414', numero: telefono };
};

export default function ConfiguracionClub({ crearNotificacion = null }) {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    rol: 'atleta'
  });
  const [cedulaTipo, setCedulaTipo] = useState('V');
  const [cedulaNumero, setCedulaNumero] = useState('');
  const [prefijo, setPrefijo] = useState('0414');
  const [numeroTel, setNumeroTel] = useState('');
  const [cargando, setCargando] = useState(false);
  const [restableciendoUsuario, setRestableciendoUsuario] = useState(null);
  const [nuevaPasswordUsuario, setNuevaPasswordUsuario] = useState('');
  const [guardandoPasswordUsuario, setGuardandoPasswordUsuario] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const restablecerPasswordUsuario = async (e) => {
    e.preventDefault();
    if (!restableciendoUsuario || !nuevaPasswordUsuario.trim()) return;
    if (nuevaPasswordUsuario.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setGuardandoPasswordUsuario(true);
    try {
      await api.put(`/usuarios/${restableciendoUsuario.id}/reset-password`, {
        new_password: nuevaPasswordUsuario
      });
      if (crearNotificacion) {
        crearNotificacion(
          "Contraseña Restablecida",
          `Se restableció la contraseña de ${restableciendoUsuario.nombre} ${restableciendoUsuario.apellido}. Deberá cambiarla al iniciar sesión.`,
          "warning"
        );
      }
      setRestableciendoUsuario(null);
      setNuevaPasswordUsuario('');
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      if (crearNotificacion) crearNotificacion("Error", error.response?.data?.detail || 'Error al restablecer contraseña.', "error");
    } finally {
      setGuardandoPasswordUsuario(false);
    }
  };

  const guardarEdicionUsuario = async (e) => {
    e.preventDefault();
    if (!editandoUsuario) return;
    setGuardandoEdicion(true);
    try {
      await api.put(`/usuarios/${editandoUsuario.id}`, editandoUsuario);
      if (crearNotificacion) {
        crearNotificacion("Usuario Actualizado", "Los datos del usuario se actualizaron correctamente.", "success");
      }
      setEditandoUsuario(null);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      if (crearNotificacion) crearNotificacion("Error", error.response?.data?.detail || 'Error al actualizar usuario.', "error");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios/');
      setUsuarios(res.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      if (crearNotificacion) crearNotificacion("Error", "Error al cargar la lista de usuarios.", "error");
    }
  };

  const cargarSolicitudes = async () => {
    try {
      setCargandoSolicitudes(true);
      const res = await api.get('/usuarios/solicitudes-password');
      setSolicitudes(res.data);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  const aprobarSolicitud = async (id) => {
    try {
      await api.put(`/usuarios/solicitudes-password/${id}/aprobar`);
      if (crearNotificacion) {
        crearNotificacion("Solicitud Aprobada", "La nueva contraseña asignada es 12345678", "success");
      }
      cargarSolicitudes();
    } catch (error) {
      if (crearNotificacion) crearNotificacion("Error", "Error al aprobar la solicitud.", "error");
    }
  };

  const rechazarSolicitud = async (id) => {
    try {
      await api.put(`/usuarios/solicitudes-password/${id}/rechazar`);
      if (crearNotificacion) crearNotificacion("Solicitud Rechazada", "La solicitud fue rechazada correctamente.", "info");
      cargarSolicitudes();
    } catch (error) {
      if (crearNotificacion) crearNotificacion("Error", "Error al rechazar la solicitud.", "error");
    }
  };

  useEffect(() => {
    setTimeout(() => {
      cargarUsuarios();
      cargarSolicitudes();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crearUsuario = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      // Usar endpoint público para crear (por cómo está el backend ahora mismo)
      const dataAEnviar = {
        ...formulario,
        cedula: `${cedulaTipo}-${cedulaNumero}`,
        telefono: `${prefijo}-${numeroTel}`
      };
      await api.post('/usuarios/', dataAEnviar);
      if (crearNotificacion) {
        crearNotificacion("Usuario Creado", `Se agregó a ${formulario.nombre} ${formulario.apellido} como ${formulario.rol}`, "success");
      }
      setFormulario({ nombre: '', apellido: '', correo: '', password: '', rol: 'atleta' });
      setCedulaNumero('');
      setNumeroTel('');
      cargarUsuarios();
    } catch (error) {
      if (crearNotificacion) crearNotificacion("Error", error.response?.data?.detail || 'Error al crear usuario.', "error");
    } finally {
      setCargando(false);
    }
  };

  const procesarEliminacion = async () => {
    if (!usuarioAEliminar) return;
    try {
      await api.delete(`/usuarios/${usuarioAEliminar.id}`);
      if (crearNotificacion) {
        crearNotificacion("Usuario Eliminado", "El usuario fue eliminado del sistema permanentemente.", "success");
      }
      cargarUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      if (crearNotificacion) crearNotificacion("Error", "No se pudo eliminar el usuario.", "error");
    } finally {
      setUsuarioAEliminar(null);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6 px-2 sm:px-4 lg:px-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-valle-green flex items-center justify-center mr-3 shadow-sm">
              <UserPlus size={20} className="text-valle-gold" />
            </div>
            <div>
              <h3 className="font-bold text-valle-black">Nuevo Usuario</h3>
              <p className="text-xs text-slate-500">Da de alta a jugadores o cuerpo técnico.</p>
            </div>
          </div>

          <form onSubmit={crearUsuario} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                <input
                  required type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({...formulario, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Apellido</label>
                <input
                  required type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green"
                  value={formulario.apellido}
                  onChange={(e) => setFormulario({...formulario, apellido: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cédula de Identidad</label>
                <div className="flex gap-2">
                  <CustomSelect
                    value={cedulaTipo}
                    onChange={(e) => setCedulaTipo(e.target.value)}
                    options={["V", "E"]}
                    className="w-[70px] shrink-0"
                  />
                  <input
                    required type="text"
                    placeholder="12345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green min-w-0"
                    value={cedulaNumero}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCedulaNumero(val);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                <div className="flex gap-2">
                  <CustomSelect
                    value={prefijo}
                    onChange={(e) => setPrefijo(e.target.value)}
                    options={["0424", "0414", "0416", "0426", "0412", "0422"]}
                    className="w-[85px] shrink-0"
                  />
                  <input
                    required type="text"
                    placeholder="1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green min-w-0"
                    value={numeroTel}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 7) setNumeroTel(val);
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  required type="email"
                  className="w-full pl-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green"
                  value={formulario.correo}
                  onChange={(e) => setFormulario({...formulario, correo: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña Temporal</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  required type="password"
                  className="w-full pl-10 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green"
                  value={formulario.password}
                  onChange={(e) => setFormulario({...formulario, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rol de Acceso</label>
              <CustomSelect
                value={formulario.rol}
                onChange={(e) => setFormulario({...formulario, rol: e.target.value})}
                options={[
                  { value: "atleta", label: "Atleta (Solo vista de perfil)" },
                  { value: "entrenador", label: "Entrenador (Vista de cuerpo técnico)" },
                  { value: "nutricionista", label: "Nutricionista (Control Biométrico y Dietas)" },
                  { value: "admin", label: "Administrador (Control total)" }
                ]}
              />
            </div>

            <button type="submit" disabled={cargando} className="w-full py-2.5 mt-2 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-sm font-bold transition shadow-sm">
              {cargando ? 'Registrando...' : 'Registrar Usuario'}
            </button>
          </form>
        </div>

        {/* PANEL DERECHO: LISTA DE USUARIOS */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-valle-black flex items-center">
                <Shield className="mr-2 text-valle-gold" size={20} /> Control de Accesos
              </h2>
              <p className="text-sm text-slate-500">Gestión de cuentas activas en el club.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Usuario</th>
                  <th className="p-4 font-semibold">Correo</th>
                  <th className="p-4 font-semibold">Rol</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-medium text-valle-black">{u.nombre} {u.apellido}</div>
                      <div className="text-xs text-slate-400">ID: {u.id}</div>
                    </td>
                    <td className="p-4 text-slate-600">{u.correo}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.rol === 'admin' ? 'bg-red-100 text-red-700' :
                        u.rol === 'entrenador' ? 'bg-valle-green-light text-white' :
                        u.rol === 'nutricionista' ? 'bg-amber-50 text-amber-800 border border-amber-250' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setEditandoUsuario({...u})} 
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition" 
                        title="Editar usuario"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setRestableciendoUsuario(u);
                          setNuevaPasswordUsuario('');
                        }} 
                        className="p-2 text-slate-400 hover:text-valle-green hover:bg-slate-50 rounded-lg transition" 
                        title="Restablecer contraseña"
                      >
                        <Lock size={18} />
                      </button>
                      <button onClick={() => setUsuarioAEliminar(u)} className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition" title="Eliminar acceso">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">Cargando usuarios...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* PANEL INFERIOR: SOLICITUDES DE CONTRASEÑA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-valle-black flex items-center">
              <Lock className="mr-2 text-valle-gold" size={20} /> Solicitudes de Recuperación de Clave
            </h2>
            <p className="text-sm text-slate-500">Aprobación de blanqueo de contraseña para usuarios.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Correo</th>
                <th className="p-4 font-semibold">Fecha Solicitud</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {solicitudes.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-medium text-valle-black capitalize">{s.usuario_nombre} {s.usuario_apellido}</td>
                  <td className="p-4 text-slate-600">{s.usuario_correo}</td>
                  <td className="p-4 text-slate-500">{new Date(s.fecha_solicitud).toLocaleString()}</td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => aprobarSolicitud(s.id)}
                      className="px-3 py-1 bg-valle-green hover:bg-valle-green-dark text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Aprobar (12345678)
                    </button>
                    <button 
                      onClick={() => rechazarSolicitud(s.id)}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
              {solicitudes.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    {cargandoSolicitudes ? 'Cargando solicitudes...' : 'No hay solicitudes pendientes.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Restablecer Contraseña */}
      {restableciendoUsuario && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-fadeIn relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center tracking-tight font-display">
                <Lock className="mr-2.5 text-valle-green" size={20} /> Restablecer Contraseña
              </h3>
              <button onClick={() => setRestableciendoUsuario(null)} className="text-slate-400 hover:text-slate-800 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={restablecerPasswordUsuario} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">
                  Usuario: <span className="capitalize">{restableciendoUsuario.nombre} {restableciendoUsuario.apellido}</span>
                </p>
                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-xs font-bold">
                  Nueva Contraseña Temporal
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium text-sm"
                  value={nuevaPasswordUsuario}
                  onChange={(e) => setNuevaPasswordUsuario(e.target.value)}
                />
                <p className="text-[10px] text-amber-600 mt-1.5 font-bold leading-normal">
                  ⚠️ El usuario será forzado a cambiar esta contraseña al iniciar sesión por primera vez.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRestableciendoUsuario(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPasswordUsuario}
                  className="px-4 py-2 bg-valle-green text-valle-gold rounded-lg hover:bg-valle-green-dark transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {guardandoPasswordUsuario ? 'Restableciendo...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Usuario */}
      {editandoUsuario && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-fadeIn relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center tracking-tight font-display">
                <Pencil className="mr-2.5 text-valle-green" size={20} /> Editar Usuario
              </h3>
              <button onClick={() => setEditandoUsuario(null)} className="text-slate-400 hover:text-slate-800 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={guardarEdicionUsuario} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] font-bold">Nombre</label>
                  <input
                    type="text" required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium text-sm focus:ring-1 focus:ring-valle-green"
                    value={editandoUsuario.nombre || ''}
                    onChange={(e) => setEditandoUsuario({...editandoUsuario, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] font-bold">Apellido</label>
                  <input
                    type="text" required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium text-sm focus:ring-1 focus:ring-valle-green"
                    value={editandoUsuario.apellido || ''}
                    onChange={(e) => setEditandoUsuario({...editandoUsuario, apellido: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] font-bold">Cédula</label>
                  <div className="flex gap-2">
                    <CustomSelect
                      value={getCedulaParts(editandoUsuario.cedula).tipo}
                      onChange={(e) => {
                        const { numero } = getCedulaParts(editandoUsuario.cedula);
                        setEditandoUsuario({...editandoUsuario, cedula: `${e.target.value}-${numero}`});
                      }}
                      options={["V", "E"]}
                      className="w-[70px] shrink-0"
                    />
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium text-sm focus:ring-1 focus:ring-valle-green min-w-0"
                      value={getCedulaParts(editandoUsuario.cedula).numero}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const { tipo } = getCedulaParts(editandoUsuario.cedula);
                        setEditandoUsuario({...editandoUsuario, cedula: `${tipo}-${val}`});
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] font-bold">Teléfono</label>
                  <div className="flex gap-2">
                    <CustomSelect
                      value={getTelefonoParts(editandoUsuario.telefono).prefijo}
                      onChange={(e) => {
                        const { numero } = getTelefonoParts(editandoUsuario.telefono);
                        setEditandoUsuario({...editandoUsuario, telefono: `${e.target.value}-${numero}`});
                      }}
                      options={["0424", "0414", "0416", "0426", "0412", "0422"]}
                      className="w-[85px] shrink-0"
                    />
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-valle-green font-medium text-sm focus:ring-1 focus:ring-valle-green min-w-0"
                      value={getTelefonoParts(editandoUsuario.telefono).numero}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 7) {
                          const { prefijo } = getTelefonoParts(editandoUsuario.telefono);
                          setEditandoUsuario({...editandoUsuario, telefono: `${prefijo}-${val}`});
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase tracking-wider mb-1.5 text-[10px] font-bold">Rol</label>
                <CustomSelect
                  value={editandoUsuario.rol ? editandoUsuario.rol.toLowerCase() : 'atleta'}
                  onChange={(e) => setEditandoUsuario({...editandoUsuario, rol: e.target.value})}
                  options={[
                    { value: "atleta", label: "Atleta" },
                    { value: "entrenador", label: "Entrenador" },
                    { value: "nutricionista", label: "Nutricionista" },
                    { value: "admin", label: "Administrador" }
                  ]}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditandoUsuario(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-4 py-2 bg-valle-green text-valle-gold rounded-lg hover:bg-valle-green-dark transition shadow-md disabled:opacity-50 cursor-pointer font-bold"
                >
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {usuarioAEliminar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-fadeIn relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="font-bold text-lg text-slate-800 flex items-center tracking-tight font-display">
                <Trash2 className="mr-2.5 text-red-500" size={20} /> Confirmar Eliminación
              </h3>
              <button onClick={() => setUsuarioAEliminar(null)} className="text-slate-400 hover:text-slate-800 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente a <span className="font-bold text-slate-900">{usuarioAEliminar.nombre} {usuarioAEliminar.apellido}</span> del sistema?
                Esta acción no se puede deshacer y borrará todos sus datos asociados.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUsuarioAEliminar(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarEliminacion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold text-sm shadow-sm"
                >
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
