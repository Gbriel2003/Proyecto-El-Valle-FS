import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone, Monitor, Globe, Laptop, ArrowRight } from 'lucide-react';

function useEscapeKey(onClose) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  setDeferredPrompt
}) {
  useEscapeKey(onClose);

  // Detección automática del dispositivo para establecer la pestaña inicial
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'android';

    // Detectar iOS
    const isIOS = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    // Detectar móvil en general
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isIOS) return 'ios';
    if (isMobile) return 'android';
    return 'desktop';
  });

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado de instalación: ${outcome}`);
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-pwa-title"
      >
        {/* Cabecera */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-valle-green text-valle-gold">
          <h3 id="modal-pwa-title" className="font-bold text-xs flex items-center tracking-tight uppercase">
            <Download className="mr-1.5 animate-bounce" size={14} /> Descargar Aplicación El Valle F.S.
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-valle-gold/85 hover:text-white transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-500 font-semibold mb-5 text-center leading-relaxed">
            Instala la aplicación en tu dispositivo para acceder de forma rápida y directa, disfrutar de pantalla completa y mejorar el rendimiento de la pizarra táctica.
          </p>

          {/* Selector de pestañas */}
          <div className="flex border-b border-slate-100 mb-6 p-1 bg-slate-50 rounded-xl">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'android'
                  ? 'bg-white text-valle-green shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Smartphone size={14} /> Android / Chrome
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'ios'
                  ? 'bg-white text-valle-green shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Smartphone size={14} className="rotate-180" /> iOS / Safari
            </button>
            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'desktop'
                  ? 'bg-white text-valle-green shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Monitor size={14} /> Computadora
            </button>
          </div>

          {/* Contenidos */}
          <div className="text-left min-h-60 flex flex-col justify-between">
            {/* PESTAÑA: ANDROID */}
            {activeTab === 'android' && (
              <div className="space-y-4">
                {deferredPrompt ? (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center space-y-3">
                    <p className="text-xs font-bold text-emerald-800">
                      ¡Tu navegador es compatible con la instalación directa!
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="inline-flex items-center px-4 py-2.5 bg-valle-green hover:bg-valle-green-dark text-valle-gold text-xs font-black rounded-xl transition shadow-md cursor-pointer"
                    >
                      <Download size={14} className="mr-1.5" /> Descargar / Instalar Ahora
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl text-center mb-2">
                    <p className="text-[11px] font-bold text-slate-650 leading-relaxed">
                      Si ya estás en el navegador del móvil, sigue los siguientes pasos:
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">1</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Abre el menú del navegador</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">Pulsar el icono de tres puntos verticales <span className="font-bold text-slate-800">⋮</span> en la esquina superior derecha de Google Chrome.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">2</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Selecciona "Instalar aplicación"</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">Busca y pulsa la opción <span className="font-bold text-slate-800">"Instalar aplicación"</span> o <span className="font-bold text-slate-800">"Añadir a la pantalla de inicio"</span>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">3</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Confirma la descarga</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">Confirma en la ventana emergente y la aplicación aparecerá en tu menú de aplicaciones móvil como una app nativa.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: IOS (IPHONE / IPAD) */}
            {activeTab === 'ios' && (
              <div className="space-y-4">
                <div className="bg-amber-50/50 border border-amber-150 p-3.5 rounded-2xl text-left flex items-start gap-2.5 mb-2">
                  <div className="p-1 bg-amber-400 rounded-lg text-slate-900 mt-0.5 shrink-0">
                    <Globe size={14} />
                  </div>
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                    Nota: En iOS, Apple requiere que utilices el navegador <span className="underline">Safari</span> para poder instalar la aplicación en tu pantalla de inicio.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">1</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        Abre Safari e ingresa al sitio
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">Asegúrate de estar navegando desde el navegador oficial <span className="font-bold text-slate-800">Safari</span>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">2</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        Pulsa el botón "Compartir"
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5 flex items-center flex-wrap gap-1">
                        En la barra de navegación de Safari (abajo en iPhone, arriba en iPad), pulsa el icono de compartir:
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold border border-slate-200">
                          <Share size={10} className="mr-0.5" /> Compartir
                        </span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">3</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Añade a la Pantalla de Inicio</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5 flex items-center flex-wrap gap-1">
                        Desplázate hacia abajo y selecciona la opción
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-105 rounded text-slate-750 font-bold border border-slate-200">
                          <Plus size={10} className="mr-0.5 text-valle-green" /> Añadir a la pantalla de inicio
                        </span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">4</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Confirma en Safari</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">Pulsa <span className="font-bold text-slate-800">"Añadir"</span> en la esquina superior derecha del navegador. ¡Listo!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: ESCRITORIO */}
            {activeTab === 'desktop' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">1</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Globe size={12} className="text-slate-500" /> Icono de instalación en barra de direcciones
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Si usas Google Chrome o Microsoft Edge, verás un icono de descarga (un monitor con una flecha hacia abajo o un botón <span className="font-mono bg-slate-150 px-1 rounded text-slate-800">+</span>) en la barra de direcciones del navegador, en la parte superior derecha.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-valle-green/10 text-valle-green flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">2</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Laptop size={12} className="text-slate-500" /> Menú de opciones del navegador
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Como alternativa, puedes hacer clic en los tres puntos de Chrome/Edge <span className="font-bold text-slate-800">⋮</span> y elegir la opción <span className="font-bold text-slate-800">"Instalar El Valle F.S."</span> o similar.
                      </p>
                    </div>
                  </div>
                </div>

                {deferredPrompt && (
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex justify-between items-center mt-3">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Instalación directa disponible</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Haz clic en el botón de la derecha para instalar</p>
                    </div>
                    <button
                      onClick={handleInstallClick}
                      className="px-3.5 py-2 bg-valle-green hover:bg-valle-green-dark text-valle-gold text-[10px] font-black rounded-lg transition cursor-pointer shadow-sm"
                    >
                      Instalar Ahora
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer explicativo */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-450 font-bold uppercase tracking-wider">
              <span>Fácil instalación</span>
              <span className="flex items-center text-valle-green gap-0.5">
                Acceso sin internet <ArrowRight size={10} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
