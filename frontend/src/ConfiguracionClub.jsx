import { useState, useEffect } from 'react';
import api from './api';
import { Shield, UserPlus, Trash2, Mail, Lock } from 'lucide-react';
import CustomSelect from './components/ui/CustomSelect';

export default function ConfiguracionClub({ crearNotificacion = null }) {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    rol: 'atleta'
  });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios/');
      setUsuarios(res.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      mostrarMensaje('error', 'Error al cargar usuarios.');
    }
  };

  useEffect(() => {
    setTimeout(() => {
      cargarUsuarios();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crearUsuario = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      // Usar endpoint público para crear (por cómo está el backend ahora mismo)
      await api.post('/usuarios/', formulario);
      mostrarMensaje('exito', 'Usuario creado correctamente.');
      if (crearNotificacion) {
        crearNotificacion("Usuario creado", `Se agregó a ${formulario.nombre} ${formulario.apellido} como ${formulario.rol}`, "success");
      }
      setFormulario({ nombre: '', apellido: '', correo: '', password: '', rol: 'atleta' });
      cargarUsuarios();
    } catch (error) {
      mostrarMensaje('error', error.response?.data?.detail || 'Error al crear usuario.');
    } finally {
      setCargando(false);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario del sistema?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      mostrarMensaje('exito', 'Usuario eliminado correctamente.');
      if (crearNotificacion) {
        crearNotificacion("Usuario eliminado", "El usuario fue eliminado del sistema.", "info");
      }
      cargarUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      mostrarMensaje('error', 'Error al eliminar usuario.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {mensaje.texto && (
        <div className={`p-4 rounded-lg text-sm font-medium border-l-4 ${mensaje.tipo === 'exito' ? 'bg-green-50 border-valle-green text-valle-green-dark' : 'bg-red-50 border-red-500 text-red-800'}`}>
          {mensaje.texto}
        </div>
      )}

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
            <div className="grid grid-cols-2 gap-4">
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
                    <td className="p-4 text-right">
                      <button onClick={() => eliminarUsuario(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar acceso">
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
    </div>
  );
}
