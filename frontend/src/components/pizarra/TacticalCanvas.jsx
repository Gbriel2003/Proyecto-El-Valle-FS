import React, { useState } from 'react';
import { Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

export default function TacticalCanvas({
  boardRef,
  canvasRef,
  tokens,
  setTokens,
  color,
  setColor,
  grosor,
  setGrosor,
  verFichas,
  setVerFichas,
  limpiarPizarra,
  resetearFichas,
  aplicarFormacion,
  isDrawing,
  setIsDrawing
}) {
  const [dragTokenId, setDragTokenId] = useState(null);

  // --- FUNCIONES DE DIBUJO ---
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // --- DRAG AND DROP DE FICHAS ---
  const handleTokenPointerDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation(); // Detener propagación para evitar que dibuje en el canvas
    setDragTokenId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleTokenPointerMove = (e, id) => {
    if (dragTokenId !== id) return;
    e.preventDefault();
    
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Mantener dentro de la cancha visual
    x = Math.max(1, Math.min(99, x));
    y = Math.max(1, Math.min(99, y));
    
    setTokens(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  };

  const handleTokenPointerUp = (e, id) => {
    if (dragTokenId === id) {
      setDragTokenId(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-up">
      {/* Barra de Herramientas Lateral */}
      <div className="lg:col-span-1 space-y-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="space-y-5">
          {/* Herramientas de Dibujo */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Dibujo & Tiza</h3>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color de Tiza</h4>
              <div className="flex space-x-2">
                {[
                  { hex: '#ffffff', name: 'Blanco' },
                  { hex: '#fbbf24', name: 'Oro/Amarillo' },
                  { hex: '#f87171', name: 'Rojo' },
                  { hex: '#60a5fa', name: 'Azul' }
                ].map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-7 h-7 rounded-full border transition duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-valle-green focus:ring-offset-1 ${
                      color === c.hex ? 'ring-2 ring-valle-green scale-105 border-transparent shadow-md' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={`Color ${c.name}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Grosor de Línea</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold">{grosor}px</span>
              </h4>
              <input
                type="range"
                min="2"
                max="8"
                className="w-full accent-valle-green h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                value={grosor}
                onChange={(e) => setGrosor(parseInt(e.target.value))}
                aria-label="Ajustar grosor de línea"
              />
            </div>
            
            <button
              type="button"
              onClick={limpiarPizarra}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100/50 rounded-xl text-xs font-bold transition flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Trash2 size={13} className="mr-1.5" /> Limpiar Dibujos
            </button>
          </div>

          {/* Controles de Fichas */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Fichas de Jugadores</h3>
              <button
                type="button"
                onClick={() => setVerFichas(!verFichas)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition flex items-center justify-center cursor-pointer"
                aria-label={verFichas ? 'Ocultar fichas' : 'Mostrar fichas'}
              >
                {verFichas ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Formación El Valle</h4>
              <select
                onChange={(e) => aplicarFormacion('valle', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-700 cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>-- Selecciona esquema --</option>
                <option value="1-2-1">Diamante (1-2-1)</option>
                <option value="2-2">Cuadrado (2-2)</option>
                <option value="3-1">Defensiva (3-1)</option>
              </select>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Formación Rival</h4>
              <select
                onChange={(e) => aplicarFormacion('rival', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green text-slate-700 cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>-- Selecciona esquema --</option>
                <option value="1-2-1">Diamante (1-2-1)</option>
                <option value="2-2">Cuadrado (2-2)</option>
                <option value="3-1">Defensiva (3-1)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={resetearFichas}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center shadow-sm cursor-pointer"
            >
              <RefreshCw size={13} className="mr-1.5" /> Reestablecer Fichas
            </button>
          </div>
        </div>

        {/* Leyenda Táctica */}
        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold space-y-1.5">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 bg-valle-green border border-valle-gold rounded-full mr-2"></span> 
            <span>El Valle F.S. (Local)</span>
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 bg-red-600 border border-slate-900 rounded-full mr-2"></span> 
            <span>Equipo Rival</span>
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 bg-amber-400 border border-slate-900 rounded-full mr-2 flex items-center justify-center text-[5px]">⚽</span> 
            <span>Balón</span>
          </div>
        </div>
      </div>

      {/* El Campo de Futsal */}
      <div className="lg:col-span-3">
        <div 
          ref={boardRef}
          className="relative w-full aspect-[5/3] bg-[#19331e] rounded-2xl overflow-hidden shadow-lg border border-valle-green/20 select-none cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        >
          {/* Cancha de Futsal SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <rect width="1000" height="600" fill="#1b3120" />
            
            {/* Rayas alternas del césped */}
            <g opacity="0.04">
              <rect x="0" width="100" height="600" fill="#ffffff" />
              <rect x="200" width="100" height="600" fill="#ffffff" />
              <rect x="400" width="100" height="600" fill="#ffffff" />
              <rect x="600" width="100" height="600" fill="#ffffff" />
              <rect x="800" width="100" height="600" fill="#ffffff" />
            </g>
            
            {/* Líneas Límites */}
            <rect x="25" y="25" width="950" height="550" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            
            {/* Medio Campo */}
            <line x1="500" y1="25" x2="500" y2="575" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            <circle cx="500" cy="300" r="75" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            <circle cx="500" cy="300" r="5" fill="rgba(255, 255, 255, 0.4)" />
            
            {/* D-Zone Izquierda (Área Penal) */}
            <path d="M 25,120 A 150,150 0 0,1 175,220 L 175,380 A 150,150 0 0,1 25,480" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            <circle cx="175" cy="300" r="4" fill="rgba(255, 255, 255, 0.4)" />
            <line x1="275" y1="295" x2="275" y2="305" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            
            {/* D-Zone Derecha (Área Penal) */}
            <path d="M 975,120 A 150,150 0 0,0 825,220 L 825,380 A 150,150 0 0,0 975,480" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            <circle cx="825" cy="300" r="4" fill="rgba(255, 255, 255, 0.4)" />
            <line x1="725" y1="295" x2="725" y2="305" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" />
            
            {/* Porterías */}
            <rect x="5" y="240" width="20" height="120" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="4.5" />
            <rect x="975" y="240" width="20" height="120" fill="none" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="4.5" />
          </svg>

          {/* Canvas de dibujo */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-auto"
          />

          {/* Fichas Deportivas con Drag-and-Drop */}
          {verFichas && tokens.map(t => (
            <div
              key={t.id}
              onPointerDown={(e) => handleTokenPointerDown(e, t.id)}
              onPointerMove={(e) => handleTokenPointerMove(e, t.id)}
              onPointerUp={(e) => handleTokenPointerUp(e, t.id)}
              className={`absolute w-[4.2%] aspect-square rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-lg cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 select-none z-20 transition-all ${
                t.team === 'valle' 
                  ? 'bg-valle-green border-2 border-valle-gold text-valle-gold font-bold' 
                  : t.team === 'rival' 
                  ? 'bg-red-600 border-2 border-slate-900 text-white' 
                  : 'bg-amber-400 border-2 border-slate-900 text-slate-950 text-xs sm:text-sm p-0.5'
              }`}
              style={{ 
                left: `${t.x}%`, 
                top: `${t.y}%`,
                touchAction: 'none',
                transition: dragTokenId === t.id ? 'none' : 'left 0.2s ease-out, top 0.2s ease-out'
              }}
              role="button"
              aria-label={`Ficha ${t.label} del equipo ${t.team === 'valle' ? 'El Valle' : t.team === 'rival' ? 'Rival' : 'Balón'}`}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
