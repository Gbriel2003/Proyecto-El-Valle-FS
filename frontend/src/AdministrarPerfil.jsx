import { useState, useEffect } from 'react';
import api from './api';
import ChangePassword from './ChangePassword';
import CustomSelect from './components/ui/CustomSelect';
import ConfirmModal from './components/modals/ConfirmModal';
import { User, Lock, ShieldAlert, Loader2, Calendar, Mail, KeyRound, Award, Trash2, X, ZoomIn } from 'lucide-react';
import Cropper from 'react-easy-crop';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg', 0.9)
  })
}

export default function AdministrarPerfil({ rolUsuario, crearNotificacion, debeCambiarPassword, onPasswordChanged }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nombre: '', apellido: '', cedula: '', telefono: '' });
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  
  // Cropper & Viewer States
  const [fotoAVer, setFotoAVer] = useState(false);
  const [fotoSrcForCrop, setFotoSrcForCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [mostrarModalEliminarFoto, setMostrarModalEliminarFoto] = useState(false);

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

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      crearNotificacion("Error", "La imagen no puede pesar más de 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => setFotoSrcForCrop(reader.result));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadCroppedImage = async () => {
    try {
      setSubiendoFoto(true);
      const croppedBlob = await getCroppedImg(fotoSrcForCrop, croppedAreaPixels);
      const file = new File([croppedBlob], "perfil.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post('/usuarios/me/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUsuario({ ...usuario, foto_perfil: res.data.foto_perfil });
      crearNotificacion("¡Excelente!", "Tu foto de perfil se ha actualizado correctamente.", "success");
      setFotoSrcForCrop(null);
    } catch (err) {
      crearNotificacion("Error al subir foto", err.response?.data?.detail || "Hubo un problema al subir la imagen.", "error");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const eliminarFotoConfirmada = async () => {
    try {
      setSubiendoFoto(true);
      await api.delete('/usuarios/me/foto');
      setUsuario({ ...usuario, foto_perfil: null });
      crearNotificacion("Foto eliminada", "Se ha borrado tu foto de perfil.", "success");
    } catch (err) {
      crearNotificacion("Error al eliminar", "No se pudo eliminar la foto.", "error");
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
                onClick={() => setFotoAVer(true)}
                src={usuario.foto_perfil.startsWith('http') ? usuario.foto_perfil : `${api.defaults.baseURL}${usuario.foto_perfil.startsWith('/') ? '' : '/'}${usuario.foto_perfil}`} 
                alt="Perfil" 
                className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-valle-gold/30 cursor-pointer hover:opacity-80 transition-opacity" 
              />
            ) : (
              <div className="w-16 h-16 bg-linear-to-br from-valle-green to-valle-green-light rounded-2xl flex items-center justify-center text-valle-gold font-black text-2xl shadow-md border-2 border-valle-gold/30">
                {usuario?.nombre?.charAt(0).toUpperCase()}{usuario?.apellido?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="border-l border-slate-200 pl-4 flex flex-col items-start">
            <h2 className="text-xl font-black text-valle-black font-display capitalize leading-tight">
              {usuario?.nombre} {usuario?.apellido}
            </h2>
            <p className="text-xs font-black text-valle-green uppercase tracking-wider mt-1 mb-2">
              {usuario?.rol}
            </p>
            <div className="flex items-center space-x-2">
              <label className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors border border-slate-200 shadow-sm active:scale-95 shrink-0">
                {subiendoFoto ? <Loader2 className="animate-spin mr-1.5" size={12} /> : null}
                {subiendoFoto ? "Subiendo..." : "Cambiar Foto"}
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} disabled={subiendoFoto} />
              </label>
              {usuario?.foto_perfil && (
                <button
                  onClick={() => setMostrarModalEliminarFoto(true)}
                  disabled={subiendoFoto}
                  className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors border border-red-200 shadow-sm active:scale-95 shrink-0"
                >
                  <Trash2 size={12} className="mr-1.5" />
                  Eliminar
                </button>
              )}
            </div>
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

      <div className={`animate-fade-in-up grid grid-cols-1 ${esCuerpoTecnico ? 'lg:grid-cols-2' : 'max-w-4xl'} gap-6 items-start`}>
        
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

            {/* Cédula y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            
            {/* Correo Electrónico */}
            <div className="sm:w-1/2 sm:pr-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail size={12} /> Correo Electrónico
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 cursor-not-allowed shadow-inner select-none truncate">
                {usuario?.correo || 'Cargando...'}
              </div>
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

            {/* Mensaje de Contraseña Restringido (Integrado) */}
            {!esCuerpoTecnico && (
              <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-xl text-left text-xs font-bold text-amber-800 w-full flex items-start gap-3 mt-6">
                <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-extrabold text-amber-900 text-[13px]">Cambio de Contraseña Restringido</p>
                  <p className="leading-relaxed">
                    Por políticas de seguridad, no puedes modificar tu contraseña directamente. Si requieres restablecer tu clave de acceso, solicita la modificación a un <strong>Administrador</strong> del sistema o al <strong>Director Técnico</strong> en el club.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Tarjeta de Seguridad (Solo Cuerpo Técnico) */}
        {esCuerpoTecnico && (
          <div className="w-full h-full">
            <ChangePassword
              crearNotificacion={crearNotificacion}
              obligatoria={debeCambiarPassword}
              onPasswordChanged={onPasswordChanged}
            />
          </div>
        )}

      </div>
      
      {/* Modal Visor de Foto */}
      {fotoAVer && usuario?.foto_perfil && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setFotoAVer(false)}>
          <div className="relative max-w-3xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFotoAVer(false)}
              className="absolute -top-12 right-0 sm:-right-12 text-white/70 hover:text-white p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20"
            >
              <X size={28} />
            </button>
            <img 
              src={usuario.foto_perfil.startsWith('http') ? usuario.foto_perfil : `${api.defaults.baseURL}${usuario.foto_perfil.startsWith('/') ? '' : '/'}${usuario.foto_perfil}`} 
              alt="Perfil en grande"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border-2 border-white/10"
            />
          </div>
        </div>
      )}

      {/* Modal Cropper */}
      {fotoSrcForCrop && (
        <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h3 className="font-bold text-lg text-slate-800 font-display">Ajustar Foto</h3>
              <button 
                onClick={() => setFotoSrcForCrop(null)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                disabled={subiendoFoto}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative flex-1 bg-slate-100">
              <Cropper
                image={fotoSrcForCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            </div>
            
            <div className="p-5 bg-white border-t border-slate-100 z-10">
              <div className="flex items-center gap-3 mb-4">
                <ZoomIn size={18} className="text-slate-400 shrink-0" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-label="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-valle-green"
                />
              </div>
              <button
                onClick={uploadCroppedImage}
                disabled={subiendoFoto}
                className="w-full py-2.5 bg-valle-green hover:bg-valle-green-light text-white rounded-xl font-bold transition-colors shadow-md flex justify-center items-center gap-2"
              >
                {subiendoFoto ? <Loader2 className="animate-spin" size={18} /> : null}
                {subiendoFoto ? "Guardando..." : "Guardar Recorte"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={mostrarModalEliminarFoto}
        onClose={() => setMostrarModalEliminarFoto(false)}
        onConfirm={eliminarFotoConfirmada}
        title="Eliminar foto de perfil"
        message="¿Estás seguro de que deseas eliminar tu foto de perfil? Esta acción no se puede deshacer y volverás al avatar por defecto."
        confirmText="Eliminar"
        variant="danger"
      />

    </div>
  );
}
