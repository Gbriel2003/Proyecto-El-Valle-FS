import React, { useState, useEffect } from 'react';
import Login from './Login';
import AtletaDashboard from './AtletaDashboard';
import RegistroEntrenamiento from './RegistroEntrenamiento';
import Plantilla from './Plantilla';
import Tactica from './Tactica';
import ConfiguracionClub from './ConfiguracionClub';
import FichaTecnica from './FichaTecnica';
import {
  Users,
  Activity,
  ClipboardList,
  LogOut,
  Menu,
  TrendingUp,
  BrainCircuit,
  Settings,
  User as UserIcon,
  X
} from 'lucide-react';

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [rolUsuario, setRolUsuario] = useState('');
  const [menuActivo, setMenuActivo] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token_valle');
    const rol = localStorage.getItem('rol_usuario') || 'atleta';

    if (token) {
      setAutenticado(true);
      setRolUsuario(rol.toLowerCase());

      if (rol.toLowerCase() === 'atleta') {
        setMenuActivo('mi_perfil');
      } else {
        setMenuActivo('dashboard');
      }
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token_valle');
    localStorage.removeItem('rol_usuario');
    setAutenticado(false);
  };

  const handleNavClick = (menu) => {
    setMenuActivo(menu);
    setMenuAbierto(false); // Cierra el menú en móvil al hacer clic
  };

  if (!autenticado) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  // Clases CSS reutilizables para el menú con colores de marca
  const navItemClass = (menuName) => `w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm mb-1 ${
    menuActivo === menuName 
      ? 'bg-valle-green/10 text-valle-green font-bold' 
      : 'text-slate-600 hover:bg-slate-50 hover:text-valle-green'
  }`;

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
            <img src="/logo.png" alt="El Valle F.S." className="w-8 h-8 object-contain mr-3" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            <div className="w-8 h-8 bg-valle-green rounded-lg hidden items-center justify-center mr-3">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">El Valle F.S.</span>
          </div>
          {/* Botón cerrar solo en móvil */}
          <button onClick={() => setMenuAbierto(false)} className="md:hidden text-slate-400 hover:text-slate-800">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          {/* VISTAS PARA ADMINISTRADOR Y ENTRENADOR */}
          {(rolUsuario === 'admin' || rolUsuario === 'entrenador') && (
            <>
              <button onClick={() => handleNavClick('ia')} className={navItemClass('ia')}>
                <Activity size={18} className="mr-3" />
                <span>Control Entrenamiento</span>
              </button>
              
              <button onClick={() => handleNavClick('dashboard')} className={navItemClass('dashboard')}>
                <BrainCircuit size={18} className="mr-3" />
                <span>Laboratorio I.A.</span>
              </button>

              <button onClick={() => handleNavClick('jugadores')} className={navItemClass('jugadores')}>
                <Users size={18} className="mr-3" />
                <span>Plantilla Activa</span>
              </button>

              <button onClick={() => handleNavClick('tactica')} className={navItemClass('tactica')}>
                <ClipboardList size={18} className="mr-3" />
                <span>Pizarra Táctica</span>
              </button>
            </>
          )}

          {/* VISTAS EXCLUSIVAS DEL ADMINISTRADOR */}
          {rolUsuario === 'admin' && (
            <button onClick={() => handleNavClick('configuracion')} className={navItemClass('configuracion')}>
              <Settings size={18} className="mr-3" />
              <span>Configuración Club</span>
            </button>
          )}

          {/* VISTAS EXCLUSIVAS DEL ATLETA */}
          {rolUsuario === 'atleta' && (
            <button onClick={() => handleNavClick('mi_perfil')} className={navItemClass('mi_perfil')}>
              <UserIcon size={18} className="mr-3" />
              <span>Mi Ficha Técnica</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="mb-4 px-3 flex items-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold uppercase mr-3">
              {rolUsuario.substring(0, 2)}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Logueado como</p>
              <p className="text-sm text-slate-900 capitalize font-medium">{rolUsuario}</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center px-4 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
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
            <h1 className="text-xl font-bold text-valle-black capitalize hidden sm:block">
              {menuActivo.replace('_', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium text-slate-700 mr-3 hidden sm:block capitalize">{rolUsuario}</span>
            <div className="w-9 h-9 rounded-full bg-valle-green border-2 border-valle-gold shadow-sm flex items-center justify-center text-valle-gold font-bold text-sm uppercase">
              {rolUsuario.substring(0, 2)}
            </div>
          </div>
        </header>

        {/* Área de Componentes (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          
          {/* Título en móvil (ya que lo ocultamos en el header) */}
          <div className="mb-6 sm:hidden">
            <h1 className="text-2xl font-bold text-valle-black capitalize">
              {menuActivo.replace('_', ' ')}
            </h1>
          </div>

          {menuActivo === 'dashboard' && <AtletaDashboard />}
          {menuActivo === 'jugadores' && <Plantilla />}
          {menuActivo === 'tactica' && <Tactica />}
          {menuActivo === 'ia' && <RegistroEntrenamiento />}
          {menuActivo === 'configuracion' && <ConfiguracionClub />}
          {menuActivo === 'mi_perfil' && <FichaTecnica />}

        </div>
      </main>
    </div>
  );
}