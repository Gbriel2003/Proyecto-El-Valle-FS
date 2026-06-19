import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Selecciona una opción",
  className = "",
  disabled = false,
  variant = "light", // 'light' or 'dark' (for green gradients)
  alignRight = false
}) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    if (!abierto) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [abierto]);

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto]);

  // Formatear opciones si vienen como strings simples
  const opcionesFormateadas = options.map(opt => 
    typeof opt === 'object' && opt !== null 
      ? { value: opt.value, label: opt.label, disabled: opt.disabled }
      : { value: opt, label: opt, disabled: false }
  );

  const opcionSeleccionada = opcionesFormateadas.find(opt => String(opt.value) === String(value));

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setAbierto(false);
  };

  // Clases del botón disparador según la variante (clara u oscura)
  const buttonStyle = variant === 'dark'
    ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white focus:ring-valle-gold/30 focus:border-valle-gold'
    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm focus:ring-valle-green/15 focus:border-valle-green';

  const hasCustomWidth = className.split(' ').some(c => c.startsWith('w-'));

  return (
    <div ref={containerRef} className={`relative ${hasCustomWidth ? '' : 'w-full'} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAbierto(!abierto)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 ${buttonStyle}`}
      >
        <span className="truncate">{opcionSeleccionada ? opcionSeleccionada.label : placeholder}</span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 shrink-0 opacity-70 ml-2 ${abierto ? 'rotate-180' : ''}`} 
        />
      </button>

      {abierto && (
        <div 
          className={`absolute z-100 mt-1.5 min-w-full w-max max-w-[280px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 max-h-60 overflow-y-auto scrollbar-thin animate-fade-in ${alignRight ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
          style={{
            animation: 'slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {opcionesFormateadas.length === 0 ? (
            <div className="px-3 py-2.5 text-xs font-bold text-slate-400 text-center">
              No hay opciones disponibles
            </div>
          ) : (
            opcionesFormateadas.map((opt, i) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`${opt.value}-${i}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected 
                      ? 'bg-valle-green/10 text-valle-green-dark font-extrabold' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-valle-green shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
