import { useState, useEffect, useRef } from 'react';
import api from './api';
import Login from './Login';
import AtletaDashboard from './AtletaDashboard';
import EntrenadorDashboard from './EntrenadorDashboard';
import RegistroEntrenamiento from './RegistroEntrenamiento';
import Plantilla from './Plantilla';
import Tactica from './Tactica';
import ConfiguracionClub from './ConfiguracionClub';
import FichaTecnica from './FichaTecnica';
import ControlNutricional from './ControlNutricional';
import PWAInstallModal from './components/modals/PWAInstallModal';
import ChangePassword from './ChangePassword';
import ResetPassword from './ResetPassword';
import AdministrarPerfil from './AdministrarPerfil';
import MisPartidos from './MisPartidos';
import {
  Users,
  Activity,
  ClipboardList,
  LogOut,
  Menu,
  TrendingUp,
  Settings,
  User as UserIcon,
  X,
  BarChart2,
  ChevronDown,
  Pencil,
  Calendar,
  Download,
  Bell,
  Apple,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  ShieldAlert,
  Lock,
  Award,
  Trophy
} from 'lucide-react';


const titulosPaginas = {
  ia: "Control de Entrenamiento",
  dashboard: "Rendimiento Global",
  jugadores: "Plantilla Activa",
  pizarra_tactica: "Pizarra Táctica",
  partidos: "Partidos y Calendario",
  configuracion: "Configuración del Club",
  mi_perfil: "Ficha Deportiva",
  control_nutricional: "Control Nutricional",
  cambiar_contrasena: "Seguridad de la Cuenta",
  administrar_perfil: "Mi Perfil",
  mis_partidos: "Mis Partidos"
};

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [rolUsuario, setRolUsuario] = useState('');
  const [menuActivo, setMenuActivo] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tacticaMenuAbierto, setTacticaMenuAbierto] = useState(false);
  const [debeCambiarPassword, setDebeCambiarPassword] = useState(false);
  const [tokenRestablecer, setTokenRestablecer] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  // Estados globales de alertas y carga de reportes
  const [toasts, setToasts] = useState([]);
  const [partidosEnProceso, setPartidosEnProceso] = useState([]);
  const [partidosGlobal, setPartidosGlobal] = useState([]);

  // Estados para instalación de PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mostrarInstaladorModal, setMostrarInstaladorModal] = useState(false);
  const [esStandalone, setEsStandalone] = useState(false);

  // Sistema de Notificaciones Internas
  const [notificaciones, setNotificaciones] = useState(() => {
    try {
      const stored = localStorage.getItem('valle_notificaciones');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [notifDropdownAbierto, setNotifDropdownAbierto] = useState(false);
  
  // Referencia para evitar repetir toasts de alertas de partidos caducados en la misma sesión
  const toastsMostradosRef = useRef(new Set());

  // Guardar notificaciones en localStorage
  useEffect(() => {
    localStorage.setItem('valle_notificaciones', JSON.stringify(notificaciones));
  }, [notificaciones]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!notifDropdownAbierto) return;
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.notification-container')) {
        setNotifDropdownAbierto(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [notifDropdownAbierto]);

  const agregarToast = (mensaje, subtexto = '', tipo = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, mensaje, subtexto, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 7000);
  };

  const crearNotificacion = (mensaje, subtexto = '', tipo = 'info', accionMenu = null) => {
    const realTipo = ['success', 'error', 'info', 'warning'].includes(subtexto) ? subtexto : (tipo || 'info');
    const realSubtexto = ['success', 'error', 'info', 'warning'].includes(subtexto) ? '' : subtexto;
    
    // 1. Mostrar el toast en pantalla
    agregarToast(mensaje, realSubtexto, realTipo);

    // 2. Registrar en el panel de notificaciones
    const textoCompleto = realSubtexto ? `${mensaje}: ${realSubtexto}` : mensaje;
    const nueva = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      mensaje: textoCompleto,
      tipo: realTipo,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      accionMenu: accionMenu
    };

    setNotificaciones(prev => {
      const filtradas = [nueva, ...prev];
      return filtradas.slice(0, 15); // Limitar a las últimas 15
    });
  };

  // Alerta de login exitoso diferido tras recarga
  useEffect(() => {
    if (autenticado) {
      const recienteLogueado = sessionStorage.getItem('reciente_logueado');
      if (recienteLogueado) {
        sessionStorage.removeItem('reciente_logueado');
        setTimeout(() => {
          crearNotificacion("¡Bienvenido!", "Sesión iniciada correctamente en El Valle F.S.", "success");
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  // Polling para notificar solicitudes de contraseña a los administradores
  useEffect(() => {
    if (!autenticado || rolUsuario !== 'admin') return;

    let totalAnterior = 0;

    const chequearSolicitudes = async () => {
      try {
        const res = await api.get('/usuarios/solicitudes-password');
        const cantidadActual = res.data.length;
        if (cantidadActual > totalAnterior) {
          crearNotificacion(
            "Recuperación de Clave", 
            `Hay ${cantidadActual} solicitud(es) de contraseña pendiente(s) por revisión en Configuración Club.`, 
            "warning"
          );
        }
        totalAnterior = cantidadActual;
      } catch (error) {
        // Ignorar errores silenciosamente para no saturar la consola
      }
    };

    // Chequeo inicial
    chequearSolicitudes();

    // Polling cada 30 segundos
    const intervalo = setInterval(chequearSolicitudes, 30000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado, rolUsuario]);

  // Polling para notificaciones del backend
  useEffect(() => {
    if (!autenticado) return;

    const cargarNotificacionesBackend = async () => {
      try {
        const res = await api.get('/notificaciones/mis-notificaciones');
        setNotificaciones(res.data.map(n => ({
          id: n.id,
          mensaje: n.mensaje,
          tipo: n.tipo,
          timestamp: new Date(n.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leido: n.leido,
          accionMenu: null // Por si queremos agragar acciones luego
        })));

        // Mostrar toasts para notificaciones de partidos caducados que no han sido leídas
        setTimeout(() => {
          res.data.forEach(n => {
            if ((n.tipo === 'warning' || (n.mensaje && n.mensaje.includes('no se le ha cargado el resultado ni el reporte'))) && !n.leido) {
              if (!toastsMostradosRef.current.has(n.id)) {
                toastsMostradosRef.current.add(n.id);
                agregarToast("Pendiente de registro", n.mensaje, "warning");
              }
            }
          });
        }, 1000);
      } catch (error) {
        // Ignorar
      }
    };

    cargarNotificacionesBackend();
    const intervalo = setInterval(cargarNotificacionesBackend, 30000);
    return () => clearInterval(intervalo);
  }, [autenticado]);

    // Se eliminó la alerta redundante al entrar al módulo de partidos

  const unreadCount = notificaciones.filter(n => !n.leido).length;

  const marcarTodasComoLeidas = async () => {
    try {
      await api.put('/notificaciones/marcar-todas');
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (e) { console.error(e); }
  };

  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leida`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    } catch (e) { console.error(e); }
  };

  const eliminarNotificacion = async (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/notificaciones/${id}`);
    } catch (e) { console.error(e); }
  };

  const limpiarNotificaciones = async () => {
    setNotificaciones([]);
    try {
      await api.delete('/notificaciones/limpiar-todas');
    } catch (e) { console.error(e); }
  };

  const registrarPartidoEnProceso = (partidoId) => {
    setPartidosEnProceso(prev => {
      if (prev.includes(partidoId)) return prev;
      return [...prev, partidoId];
    });
    cargarPartidosGlobal();
  };

  const cargarPartidosGlobal = async () => {
    try {
      const token = localStorage.getItem('token_valle');
      if (!token) return;
      const res = await api.get('/partidos/');
      if (Array.isArray(res.data)) {
        setPartidosGlobal(res.data);
      }
    } catch (err) {
      console.error("Error al cargar partidos globalmente:", err);
    }
  };

  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setEsStandalone(!!isStandalone);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (autenticado) {
      if (rolUsuario === 'admin' || rolUsuario === 'entrenador') {
        cargarPartidosGlobal();
      }
      
      const cargarMiPerfil = async () => {
        try {
          const res = await api.get('/usuarios/me');
          if (res.data.foto_perfil) {
            setFotoPerfil(res.data.foto_perfil);
          }
        } catch (err) {
          console.error("Error cargando mi perfil", err);
        }
      };
      cargarMiPerfil();
    }
  }, [autenticado, rolUsuario]);

  // Polling en segundo plano para alertar cuando el reporte de la IA esté listo
  useEffect(() => {
    if (partidosEnProceso.length === 0) return;

    const interval = setInterval(async () => {
      for (const partidoId of partidosEnProceso) {
        try {
          const res = await api.get(`/partidos/${partidoId}/reporte`);
          const data = res.data;
          const partidoObj = partidosGlobal.find(p => p.id === partidoId) || { equipo_visitante: 'Rival' };
          
          if (data.estado === 'completado' && !data.analisis_ia?.error) {
            agregarToast(
              "¡Análisis de IA Listo!",
              `El reporte táctico del partido contra ${partidoObj.equipo_visitante} ha sido generado con éxito.`,
              "success"
            );
            setPartidosEnProceso(prev => prev.filter(id => id !== partidoId));
            cargarPartidosGlobal();
          } else if (data.analisis_ia?.error) {
            agregarToast(
              "Error de Análisis IA",
              `No se pudo generar el análisis del partido contra ${partidoObj.equipo_visitante}: ${data.analisis_ia.error}`,
              "error"
            );
            setPartidosEnProceso(prev => prev.filter(id => id !== partidoId));
            cargarPartidosGlobal();
          }
        } catch (err) {
          console.error("Error al consultar reporte en background:", err);
          if (err.response && err.response.status !== 404 && err.response.status !== 422) {
            const partidoObj = partidosGlobal.find(p => p.id === partidoId) || { equipo_visitante: 'Rival' };
            agregarToast(
              "Error de Conexión",
              `Problema al consultar el reporte del partido contra ${partidoObj.equipo_visitante}.`,
              "error"
            );
            setPartidosEnProceso(prev => prev.filter(id => id !== partidoId));
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [partidosEnProceso, partidosGlobal]);

  useEffect(() => {
    if (menuActivo === 'pizarra_tactica' || menuActivo === 'partidos') {
      setTimeout(() => {
        setTacticaMenuAbierto(true);
      }, 0);
    }
  }, [menuActivo]);

  useEffect(() => {
    // Detectar si el usuario viene de un enlace de recuperación de contraseña
    const pathname = window.location.pathname;
    if (pathname.startsWith('/reset-password/')) {
      const token = pathname.substring('/reset-password/'.length);
      if (token) {
        setTokenRestablecer(token);
      }
    }

    const token = localStorage.getItem('token_valle');
    const rol = localStorage.getItem('rol_usuario') || 'atleta';
    const debeCambiar = localStorage.getItem('debe_cambiar_password') === 'true';

    if (token) {
      setTimeout(() => {
        setAutenticado(true);
        setRolUsuario(rol.toLowerCase());
        setDebeCambiarPassword(debeCambiar);

        if (debeCambiar) {
          setMenuActivo('cambiar_contrasena');
        } else if (rol.toLowerCase() === 'atleta') {
          setMenuActivo('mi_perfil');
        } else {
          setMenuActivo('dashboard');
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (menuActivo) {
      const subTitle = titulosPaginas[menuActivo] || menuActivo.replace('_', ' ');
      document.title = `${subTitle} | El Valle F.S.`;
    } else {
      document.title = "El Valle F.S. | Plataforma de Gestión Deportiva";
    }
  }, [menuActivo]);

  const cerrarSesion = () => {
    localStorage.removeItem('token_valle');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('valle_notificaciones');
    setNotificaciones([]);
    if (toastsMostradosRef.current) toastsMostradosRef.current.clear();
    setAutenticado(false);
  };

  const handleNavClick = (menu) => {
    setMenuActivo(menu);
    setMenuAbierto(false); // Cierra el menú en móvil al hacer clic

    if (menu === 'partidos') {
      notificaciones.forEach(n => {
        if ((n.tipo === 'warning' || (n.mensaje && n.mensaje.includes('no se le ha cargado el resultado ni el reporte'))) && !n.leido) {
          agregarToast("Pendiente de registro", n.mensaje, "warning");
        }
      });
    }
  };

  if (tokenRestablecer) {
    return (
      <ResetPassword 
        token={tokenRestablecer} 
        crearNotificacion={crearNotificacion}
        onResetSuccess={() => {
          setTokenRestablecer(null);
          window.history.pushState({}, document.title, "/");
        }} 
      />
    );
  }

  if (!autenticado) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  // Clases CSS reutilizables para el menú con colores de marca y diseño premium
  const navItemClass = (menuName) => `w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm mb-1 relative overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-valle-green/20 ${
    menuActivo === menuName 
      ? 'bg-linear-to-r from-valle-green/8 to-valle-green/4 text-valle-green font-bold border-l-4 border-valle-green pl-3' 
      : 'text-slate-650 hover:bg-slate-50 hover:text-valle-green border-l-4 border-transparent pl-3'
  }`;

  const subNavItemClass = (menuName) => `w-full flex items-center py-2 rounded-xl transition-all duration-200 font-semibold text-sm mb-1 relative overflow-hidden group cursor-pointer focus:outline-none ${
    menuActivo === menuName 
      ? 'bg-valle-green/8 text-valle-green font-bold border-l-2 border-valle-green pl-6' 
      : 'text-slate-650 hover:bg-slate-50 hover:text-valle-green border-l-2 border-transparent pl-6'
  }`;

  const getIconoMenu = (menu) => {
    switch (menu) {
      case 'dashboard': return <BarChart2 size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'ia': return <Activity size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'jugadores': return <Users size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'control_nutricional': return <Apple size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'pizarra_tactica': return <Pencil size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'partidos': return <Calendar size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'configuracion': return <Settings size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'mi_perfil': return <Award size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'mis_partidos': return <Trophy size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'administrar_perfil': return <UserIcon size={24} className="mr-2 text-valle-green shrink-0" />;
      case 'cambiar_contrasena': return <Lock size={24} className="mr-2 text-valle-green shrink-0" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

      {/* Overlay oscuro para móvil cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* ================= BARRA LATERAL INTELIGENTE ================= */}
      <aside className={`fixed md:relative z-50 w-72 md:w-64 bg-white border-r border-slate-200 flex flex-col h-full transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
        menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Cabecera del menú */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center">
            <img src="/logo.png" alt="El Valle F.S." className="w-14 h-14 object-contain mr-3" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="w-11 h-11 bg-valle-green rounded-lg hidden items-center justify-center mr-3">
              <TrendingUp size={22} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">El Valle F.S.</span>
          </div>
          {/* Botón cerrar solo en móvil */}
          <button onClick={() => setMenuAbierto(false)} className="md:hidden text-slate-400 hover:text-slate-800">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          {debeCambiarPassword ? (
            <div className="px-3.5 py-4 bg-amber-50/85 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200/70 leading-relaxed space-y-2 animate-pulse">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <ShieldAlert size={14} />
                Acción Requerida
              </div>
              <p>Debes cambiar tu contraseña temporal para poder utilizar el sistema.</p>
            </div>
          ) : (
            <>
              {/* Rendimiento Global (Admin, Entrenador, Nutricionista) */}
              {(rolUsuario === 'admin' || rolUsuario === 'entrenador' || rolUsuario === 'nutricionista') && (
                <button onClick={() => handleNavClick('dashboard')} className={navItemClass('dashboard')}>
                  <BarChart2 size={18} className="mr-3" />
                  <span>Rendimiento Global</span>
                </button>
              )}

              {/* Control de Entrenamiento (Admin, Entrenador) */}
              {(rolUsuario === 'admin' || rolUsuario === 'entrenador') && (
                <button onClick={() => handleNavClick('ia')} className={navItemClass('ia')}>
                  <Activity size={18} className="mr-3" />
                  <span>Control Entrenamiento</span>
                </button>
              )}

              {/* Plantilla Activa (Admin, Entrenador, Nutricionista) */}
              {(rolUsuario === 'admin' || rolUsuario === 'entrenador' || rolUsuario === 'nutricionista') && (
                <button onClick={() => handleNavClick('jugadores')} className={navItemClass('jugadores')}>
                  <Users size={18} className="mr-3" />
                  <span>Plantilla Activa</span>
                </button>
              )}

              {/* Control Nutricional (Nutricionista, Admin) */}
              {(rolUsuario === 'nutricionista' || rolUsuario === 'admin') && (
                <button onClick={() => handleNavClick('control_nutricional')} className={navItemClass('control_nutricional')}>
                  <Apple size={18} className="mr-3" />
                  <span>Control Nutricional</span>
                </button>
              )}

              {/* Grupo Colapsable: Táctica y Partidos (Admin, Entrenador) */}
              {(rolUsuario === 'admin' || rolUsuario === 'entrenador') && (
                <div className="space-y-1">
                  <button 
                    onClick={() => setTacticaMenuAbierto(!tacticaMenuAbierto)} 
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm mb-1 group cursor-pointer focus:outline-none ${
                      menuActivo === 'pizarra_tactica' || menuActivo === 'partidos'
                        ? 'bg-linear-to-r from-valle-green/8 to-valle-green/4 text-valle-green font-semibold border-l-4 border-valle-green pl-3'
                        : 'text-slate-650 hover:bg-slate-50 hover:text-valle-green border-l-4 border-transparent pl-3'
                    }`}
                  >
                    <div className="flex items-center">
                      <ClipboardList size={18} className="mr-3" />
                      <span>Táctica y Partidos</span>
                    </div>
                    <ChevronDown 
                      size={15} 
                      className={`transition-transform duration-200 ${tacticaMenuAbierto ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {tacticaMenuAbierto && (
                    <div className="pl-3 space-y-1 animate-fade-in-up">
                      <button 
                        onClick={() => handleNavClick('pizarra_tactica')} 
                        className={subNavItemClass('pizarra_tactica')}
                      >
                        <Pencil size={13} className="mr-2" />
                        <span>Pizarra Táctica</span>
                      </button>

                      <button 
                        onClick={() => handleNavClick('partidos')} 
                        className={subNavItemClass('partidos')}
                      >
                        <Calendar size={13} className="mr-2" />
                        <span>Partidos</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VISTAS EXCLUSIVAS DEL ADMINISTRADOR */}
              {rolUsuario === 'admin' && (
                <button onClick={() => handleNavClick('configuracion')} className={navItemClass('configuracion')}>
                  <Settings size={18} className="mr-3" />
                  <span>Configuración Club</span>
                </button>
              )}

              {/* Ficha Deportiva (Solo Atletas) */}
              {rolUsuario === 'atleta' && (
                <>
                  <button onClick={() => handleNavClick('mi_perfil')} className={navItemClass('mi_perfil')}>
                    <Award size={18} className="mr-3" />
                    <span>Ficha Deportiva</span>
                  </button>
                  <button onClick={() => handleNavClick('mis_partidos')} className={navItemClass('mis_partidos')}>
                    <Trophy size={18} className="mr-3" />
                    <span>Mis Partidos</span>
                  </button>
                </>
              )}

              {/* Mi Perfil (Todos) */}
              <button onClick={() => handleNavClick('administrar_perfil')} className={navItemClass('administrar_perfil')}>
                <UserIcon size={18} className="mr-3" />
                <span>Mi Perfil</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={18} className="mr-3" />
            <span className="text-sm font-semibold">Cerrar Sesión</span>
          </button>
          {!esStandalone && (
            <button
              type="button"
              onClick={() => setMostrarInstaladorModal(true)}
              className="w-full mt-2.5 flex items-center px-4 py-1.5 text-slate-400 hover:text-slate-650 transition-colors text-xs font-bold tracking-tight cursor-pointer"
            >
              <Download size={14} className="mr-3 shrink-0" />
              <span>Descargar Aplicación</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Cabecera Móvil y Escritorio */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center">
            {/* Botón hamburguesa */}
            <button 
              onClick={() => setMenuAbierto(true)}
              className="md:hidden mr-4 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-valle-black font-display hidden sm:flex items-center">
              {getIconoMenu(menuActivo)}
              {titulosPaginas[menuActivo] || menuActivo.replace('_', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Campana de Notificaciones */}
            <div className="relative notification-container">
              <button
                type="button"
                onClick={() => setNotifDropdownAbierto(!notifDropdownAbierto)}
                className="flex items-center justify-center p-2.5 text-slate-600 hover:bg-slate-105 hover:text-valle-green rounded-xl transition relative cursor-pointer"
                title="Notificaciones e Historial"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-valle-gold text-valle-green border border-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Panel Dropdown */}
              {notifDropdownAbierto && (
                <div className="absolute -right-12 sm:right-0 mt-3 w-72 sm:w-80 bg-white border-2 border-valle-gold/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                  <div className="px-4 sm:px-5 py-4 border-b border-valle-gold/20 flex justify-between items-center bg-linear-to-r from-valle-gold/10 via-transparent to-valle-green/5">
                    <span className="text-xs font-bold text-slate-800 flex items-center tracking-tight font-display">
                      <Bell className="mr-2 text-valle-gold drop-shadow-sm" size={14} /> Actividad del Club
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={marcarTodasComoLeidas}
                        className="text-[10px] text-valle-gold hover:text-valle-green font-bold transition cursor-pointer bg-white border border-valle-gold/30 hover:border-valle-green/40 hover:bg-valle-green/5 px-2.5 py-1 rounded-md shadow-sm"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 min-h-24 flex flex-col justify-between bg-white">
                    {notificaciones.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold my-auto">
                        No hay notificaciones recientes
                      </div>
                    ) : (
                      notificaciones.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (!n.leido) marcarComoLeida(n.id);
                            if (n.accionMenu) {
                              setMenuActivo(n.accionMenu);
                              setNotifDropdownAbierto(false);
                            }
                          }}
                          className={`p-4 transition-colors flex items-start justify-between gap-3 hover:bg-slate-50 cursor-pointer ${!n.leido ? 'bg-white border-l-2 border-valle-gold' : ''} ${n.accionMenu ? 'hover:shadow-sm' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 leading-relaxed wrap-break-word">
                              {n.mensaje}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium mt-1.5 flex items-center">
                              {n.timestamp}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mt-0.5">
                            {!n.leido && (
                              <span className="w-1.5 h-1.5 rounded-full bg-valle-gold shrink-0 animate-pulse" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarNotificacion(n.id);
                              }}
                              className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition cursor-pointer"
                              title="Eliminar"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notificaciones.length > 0 && (
                    <div className="p-3 bg-white border-t border-slate-100 text-center">
                      <button
                        onClick={limpiarNotificaciones}
                        className="text-xs text-slate-400 hover:text-red-500 font-bold transition cursor-pointer hover:bg-red-50/50 px-4 py-1.5 rounded-lg w-full"
                      >
                        Limpiar Historial
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-slate-700 mr-1 hidden sm:block capitalize">{rolUsuario}</span>
            {fotoPerfil ? (
              <img 
                src={fotoPerfil.startsWith('http') ? fotoPerfil : `${api.defaults.baseURL}${fotoPerfil.startsWith('/') ? '' : '/'}${fotoPerfil}`} 
                alt="Perfil" 
                className="w-9 h-9 rounded-full object-cover border-2 border-valle-gold shadow-sm" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-valle-green border-2 border-valle-gold shadow-sm flex items-center justify-center text-valle-gold font-bold text-sm uppercase shrink-0">
                {rolUsuario.substring(0, 2)}
              </div>
            )}
          </div>
        </header>
 
        {/* Área de Componentes (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          
          {/* Título en móvil (ya que lo ocultamos en el header) */}
          <div className="mb-6 sm:hidden">
            <h1 className="text-2xl font-bold text-valle-black font-display flex items-center">
              {getIconoMenu(menuActivo)}
              {titulosPaginas[menuActivo] || menuActivo.replace('_', ' ')}
            </h1>
          </div>

          {menuActivo === 'dashboard' && (rolUsuario === 'admin' || rolUsuario === 'entrenador' || rolUsuario === 'nutricionista') && <EntrenadorDashboard />}
          {menuActivo === 'dashboard' && rolUsuario === 'atleta' && <AtletaDashboard />}
          {menuActivo === 'jugadores' && <Plantilla crearNotificacion={crearNotificacion} rolUsuario={rolUsuario} />}
          {menuActivo === 'control_nutricional' && (rolUsuario === 'nutricionista' || rolUsuario === 'admin') && <ControlNutricional crearNotificacion={crearNotificacion} />}
          {menuActivo === 'pizarra_tactica' && (rolUsuario === 'admin' || rolUsuario === 'entrenador') && (
            <Tactica 
              esCuerpoTecnico={rolUsuario === 'admin' || rolUsuario === 'entrenador'} 
              vistaInicial="pizarra" 
              partidosEnProceso={partidosEnProceso}
              registrarPartidoEnProceso={registrarPartidoEnProceso}
              agregarToast={crearNotificacion}
            />
          )}
          {menuActivo === 'partidos' && (rolUsuario === 'admin' || rolUsuario === 'entrenador') && (
            <Tactica 
              esCuerpoTecnico={rolUsuario === 'admin' || rolUsuario === 'entrenador'} 
              vistaInicial="calendario" 
              partidosEnProceso={partidosEnProceso}
              registrarPartidoEnProceso={registrarPartidoEnProceso}
              agregarToast={crearNotificacion}
            />
          )}
          {menuActivo === 'ia' && (rolUsuario === 'admin' || rolUsuario === 'entrenador') && <RegistroEntrenamiento crearNotificacion={crearNotificacion} />}
          {menuActivo === 'configuracion' && rolUsuario === 'admin' && <ConfiguracionClub crearNotificacion={crearNotificacion} />}
          {menuActivo === 'mi_perfil' && rolUsuario === 'atleta' && <FichaTecnica crearNotificacion={crearNotificacion} />}
          {menuActivo === 'mis_partidos' && rolUsuario === 'atleta' && <MisPartidos crearNotificacion={crearNotificacion} />}
          {menuActivo === 'administrar_perfil' && (
            <AdministrarPerfil
              rolUsuario={rolUsuario}
              crearNotificacion={crearNotificacion}
              debeCambiarPassword={debeCambiarPassword}
              onPasswordChanged={() => {
                localStorage.setItem('debe_cambiar_password', 'false');
                setDebeCambiarPassword(false);
                if (rolUsuario === 'atleta') {
                  setMenuActivo('administrar_perfil');
                } else {
                  setMenuActivo('dashboard');
                }
              }}
            />
          )}
          {menuActivo === 'cambiar_contrasena' && (
            <ChangePassword 
              crearNotificacion={crearNotificacion} 
              obligatoria={debeCambiarPassword}
              onPasswordChanged={() => {
                localStorage.setItem('debe_cambiar_password', 'false');
                setDebeCambiarPassword(false);
                if (rolUsuario === 'atleta') {
                  setMenuActivo('administrar_perfil');
                } else {
                  setMenuActivo('dashboard');
                }
              }} 
            />
          )}

        </div>
      </main>

      <PWAInstallModal
        isOpen={mostrarInstaladorModal}
        onClose={() => setMostrarInstaladorModal(false)}
        deferredPrompt={deferredPrompt}
        setDeferredPrompt={setDeferredPrompt}
      />

      {/* Contenedor de Alertas / Toast Notifications en tiempo real */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-9999 space-y-3 max-w-md w-full px-4 pointer-events-none flex flex-col items-center">
        {toasts.map(toast => {
          let bgClass = "bg-white border-slate-300 text-slate-800 border-l-sky-500 shadow-slate-900/10";
          let iconColor = "text-sky-600";
          let IconComponent = Info;

          if (toast.tipo === 'success') {
            bgClass = "bg-white border-slate-300 text-slate-800 border-l-emerald-500 shadow-emerald-950/10";
            iconColor = "text-emerald-600";
            IconComponent = CheckCircle;
          } else if (toast.tipo === 'error') {
            bgClass = "bg-white border-slate-300 text-slate-800 border-l-rose-500 shadow-rose-950/10";
            iconColor = "text-rose-600";
            IconComponent = AlertCircle;
          } else if (toast.tipo === 'warning') {
            bgClass = "bg-white border-slate-300 text-slate-800 border-l-amber-500 shadow-amber-950/10";
            iconColor = "text-amber-600";
            IconComponent = AlertTriangle;
          }

          return (
            <div 
              key={toast.id}
              className={`p-3 sm:p-4 rounded-xl shadow-xl border-t border-r border-b border-l-4 flex items-start gap-2.5 sm:gap-3.5 pointer-events-auto transition-all duration-300 animate-toast-in w-auto max-w-[90vw] sm:max-w-md ${bgClass}`}
            >
              <div className={`shrink-0 mt-0.5 sm:mt-0 ${iconColor}`}>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-slate-950 leading-snug">{toast.mensaje}</p>
                {toast.subtexto && (
                  <p className="text-[10px] sm:text-xs text-slate-650 mt-0.5 sm:mt-1 font-semibold leading-relaxed">
                    {toast.subtexto}
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-500 hover:text-slate-800 transition cursor-pointer p-1 rounded-full hover:bg-slate-100 shrink-0 -mt-1 -mr-1"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}