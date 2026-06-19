import { useState, useEffect } from 'react';
import api from './api';
import {
    Users, Trophy, AlertTriangle, Calendar, TrendingUp,
    Shield, Activity, ChevronRight, Clock, Loader2,
    CheckCircle, Zap, Heart, Target, BarChart2
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

export default function EntrenadorDashboard({ onVerFicha }) {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarDashboard = async () => {
        setCargando(true);
        setError('');
        try {
            const res = await api.get('/dashboard-entrenador/');
            setDatos(res.data);
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar el dashboard. Verifica tu conexión con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            cargarDashboard();
        }, 0);
    }, []);

    const formatearFecha = (iso) => {
        if (!iso) return 'Sin fecha';
        return new Date(iso).toLocaleDateString('es-VE', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    };

    const formatearHora = (iso) => {
        if (!iso) return '';
        return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    };

    const colorRiesgo = (color) => {
        if (color === 'rojo') return 'bg-red-100 text-red-700 border-red-200';
        if (color === 'amarillo') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    const iconoRiesgo = (color) => {
        if (color === 'rojo') return <AlertTriangle size={14} className="mr-1" />;
        if (color === 'amarillo') return <Zap size={14} className="mr-1" />;
        return <CheckCircle size={14} className="mr-1" />;
    };

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Loader2 className="animate-spin mb-3 text-valle-green" size={36} />
                <p className="text-sm font-medium">Cargando estado del equipo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-xl text-sm text-red-700 font-medium flex items-start gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold mb-1">Error al cargar el dashboard</p>
                    <p>{error}</p>
                    <button
                        onClick={cargarDashboard}
                        className="mt-3 px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold transition"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!datos) return null;

    const { resumen_equipo: r, plantilla_estado, proximos_partidos, tendencia_carga_equipo } = datos;

    const kpis = [
        {
            label: 'Atletas Disponibles',
            value: r.atletas_disponibles,
            sub: `${r.total_atletas} total · ${r.atletas_con_lesion} de baja`,
            icon: <Users size={22} />,
            color: 'text-emerald-700',
            bg: 'bg-emerald-100',
            cardBg: 'bg-linear-to-br from-emerald-50/80 to-emerald-100/20 border-emerald-200/80 hover:border-emerald-300 hover:shadow-emerald-950/5',
            textVal: 'text-emerald-950',
            textLab: 'text-emerald-900',
            textSub: 'text-emerald-700/80'
        },
        {
            label: 'Victorias (Temporada)',
            value: r.partidos_ganados,
            sub: `${r.total_partidos_jugados} partidos jugados`,
            icon: <Trophy size={22} />,
            color: 'text-amber-700',
            bg: 'bg-amber-100',
            cardBg: 'bg-linear-to-br from-amber-50/80 to-amber-100/20 border-amber-200/80 hover:border-amber-300 hover:shadow-amber-950/5',
            textVal: 'text-amber-950',
            textLab: 'text-amber-900',
            textSub: 'text-amber-700/80'
        },
        {
            label: 'Derrotas',
            value: r.partidos_perdidos,
            sub: `${r.partidos_empatados} empate${r.partidos_empatados !== 1 ? 's' : ''}`,
            icon: <Target size={22} />,
            color: 'text-sky-700',
            bg: 'bg-sky-100',
            cardBg: 'bg-linear-to-br from-sky-50/80 to-sky-100/20 border-sky-200/80 hover:border-sky-300 hover:shadow-sky-950/5',
            textVal: 'text-sky-950',
            textLab: 'text-sky-900',
            textSub: 'text-sky-700/80'
        },
        {
            label: 'Atletas en Alerta',
            value: plantilla_estado.filter(a => a.color_riesgo !== 'verde').length,
            sub: `RPE alto o descanso bajo`,
            icon: <Heart size={22} />,
            color: 'text-rose-700',
            bg: 'bg-rose-100',
            cardBg: 'bg-linear-to-br from-rose-50/80 to-rose-100/20 border-rose-200/80 hover:border-rose-300 hover:shadow-rose-950/5',
            textVal: 'text-rose-950',
            textLab: 'text-rose-900',
            textSub: 'text-rose-700/80'
        }
    ];

    return (
        <div className="space-y-6 w-full mx-auto pb-8 px-2 sm:px-4 lg:px-6">

            {/* Cabecera */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                <div>
                    <h2 className="text-xl font-black text-valle-black flex items-center font-display">
                        <BarChart2 className="text-valle-green mr-2.5" size={24} />
                        Dashboard del Entrenador
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Vista ejecutiva del estado actual del equipo El Valle F.S.</p>
                </div>
                <button
                    onClick={cargarDashboard}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                    <TrendingUp size={14} /> Actualizar
                </button>
            </div>            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <div 
                        key={i} 
                        className={`border rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-305 animate-fade-in-up ${kpi.cardBg}`}
                        style={{ animationDelay: `${i * 75}ms` }}
                    >
                        <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color} shrink-0 shadow-sm`}>
                            {kpi.icon}
                        </div>
                        <div>
                            <p className={`text-2xl font-black font-display ${kpi.textVal}`}>{kpi.value}</p>
                            <p className={`text-sm font-bold leading-tight ${kpi.textLab}`}>{kpi.label}</p>
                            <p className={`text-xs font-semibold mt-0.5 leading-none ${kpi.textSub}`}>{kpi.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fila de Gráficos Adicionales de Guía y Soporte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up animate-delay-225">
                
                {/* Tarjeta de Gráfico 1: Balance y Efectividad de Partidos (Donut) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-slate-800 flex items-center text-sm font-display">
                            <Trophy size={16} className="text-valle-green mr-2" />
                            Balance de Partidos (Temporada)
                        </h3>
                        <p className="text-xs text-slate-450 font-medium mt-0.5">Efectividad y balance de resultados en competición</p>
                    </div>
                    
                    {r.total_partidos_jugados === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm flex-1 flex flex-col items-center justify-center">
                            <Target size={32} className="text-slate-300 mb-2" />
                            <p>No hay partidos finalizados registrados.</p>
                        </div>
                    ) : (() => {
                        const ganados = r.partidos_ganados || 0;
                        const empatados = r.partidos_empatados || 0;
                        const perdidos = r.partidos_perdidos || 0;
                        const total = r.total_partidos_jugados || 1;
                        const pctVictorias = Math.round((ganados / total) * 100);

                        const datosPartidos = [
                            { name: 'Victorias', value: ganados, color: '#10b981' }, // emerald-500
                            { name: 'Empates', value: empatados, color: '#eab308' },  // amber-500
                            { name: 'Derrotas', value: perdidos, color: '#ef4444' }   // red-500
                        ].filter(d => d.value > 0);

                        return (
                            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 mt-6 flex-1">
                                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <PieChart>
                                            <Pie
                                                data={datosPartidos}
                                                innerRadius={50}
                                                outerRadius={68}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {datosPartidos.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value} partido(s)`, 'Cantidad']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-2xl font-black text-slate-900 leading-none">{pctVictorias}%</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Éxito</span>
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1 w-full max-w-[200px]">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 text-xs">
                                        <span className="flex items-center font-bold text-slate-655 text-slate-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" /> Victorias
                                        </span>
                                        <span className="font-extrabold text-slate-800">{ganados}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 text-xs">
                                        <span className="flex items-center font-bold text-slate-655 text-slate-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" /> Empates
                                        </span>
                                        <span className="font-extrabold text-slate-800">{empatados}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-1.5 text-xs">
                                        <span className="flex items-center font-bold text-slate-655 text-slate-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" /> Derrotas
                                        </span>
                                        <span className="font-extrabold text-slate-800">{perdidos}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Tarjeta de Gráfico 2: Distribución de Estado Físico y Fatiga (Bar Chart) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-slate-800 flex items-center text-sm font-display">
                            <Activity size={16} className="text-valle-green mr-2" />
                            Distribución de Carga y Fatiga
                        </h3>
                        <p className="text-xs text-slate-450 font-medium mt-0.5">Clasificación de riesgo en el plantel en base a RPE y descanso</p>
                    </div>

                    {plantilla_estado.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm flex-1 flex flex-col items-center justify-center">
                            <Users size={32} className="text-slate-300 mb-2" />
                            <p>No hay datos de plantilla disponibles.</p>
                        </div>
                    ) : (() => {
                        const optimo = plantilla_estado.filter(a => a.color_riesgo === 'verde').length;
                        const alerta = plantilla_estado.filter(a => a.color_riesgo === 'amarillo').length;
                        const deBaja = plantilla_estado.filter(a => a.color_riesgo === 'rojo').length;

                        const datosSalud = [
                            { name: 'Óptimo', cantidad: optimo, color: '#10b981' },
                            { name: 'Alerta', cantidad: alerta, color: '#f59e0b' },
                            { name: 'De Baja / Alto', cantidad: deBaja, color: '#ef4444' }
                        ];

                        return (
                            <div className="mt-6 flex-1 flex flex-col justify-end">
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={datosSalud} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                                                axisLine={false} 
                                                tickLine={false} 
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 11, fill: '#64748b' }} 
                                                axisLine={false} 
                                                tickLine={false} 
                                                allowDecimals={false} 
                                            />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value} atleta(s)`, 'Cantidad']} />
                                            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                                {datosSalud.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold text-center mt-2.5">
                                    Total: {optimo + alerta + deBaja} atletas monitoreados
                                </p>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Gráfico de Tendencia de Carga del Equipo */}
            {tendencia_carga_equipo && tendencia_carga_equipo.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 animate-fade-in-up animate-delay-300">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-black text-slate-800 flex items-center text-sm font-display">
                                <Activity size={16} className="text-valle-green mr-2" />
                                Tendencia de Carga del Equipo
                            </h3>
                            <p className="text-xs text-slate-450 font-medium mt-0.5">Promedio grupal de RPE y salto vertical en las últimas sesiones</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <AreaChart data={tendencia_carga_equipo} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                <defs>
                                    <linearGradient id="rpeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2E5235" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#2E5235" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="saltoGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#B49650" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#B49650" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="sesion"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                    dy={8}
                                />
                                <YAxis
                                    yAxisId="rpe"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    domain={[0, 10]}
                                    dx={-5}
                                />
                                <YAxis
                                    yAxisId="salto"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    dx={5}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)',
                                        fontSize: '12px'
                                    }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 2' }}
                                    formatter={(val, name) => [val, name]}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }}
                                />
                                <Area
                                    yAxisId="rpe"
                                    type="monotone"
                                    dataKey="rpe_promedio"
                                    stroke="#2E5235"
                                    strokeWidth={2.5}
                                    fill="url(#rpeGrad)"
                                    dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#2E5235' }}
                                    activeDot={{ r: 6 }}
                                    name="RPE Promedio (1-10)"
                                />
                                <Area
                                    yAxisId="salto"
                                    type="monotone"
                                    dataKey="salto_promedio"
                                    stroke="#B49650"
                                    strokeWidth={2.5}
                                    fill="url(#saltoGrad)"
                                    dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#B49650' }}
                                    activeDot={{ r: 6 }}
                                    name="Salto Promedio (cm)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Panel de Plantilla: Estado de Riesgo */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in-up animate-delay-375">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 text-sm flex items-center font-display">
                            <Shield size={16} className="text-valle-green mr-2" />
                            Estado de Plantilla
                        </h3>
                        <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">
                            {plantilla_estado.length} atletas
                        </span>
                    </div>

                    {plantilla_estado.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm">
                            No hay atletas registrados en el sistema.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-5 py-3 text-xs font-bold text-slate-450 uppercase tracking-wider">Atleta</th>
                                        <th className="text-left px-3 py-3 text-xs font-bold text-slate-450 uppercase tracking-wider hidden sm:table-cell">Posición</th>
                                        <th className="text-center px-3 py-3 text-xs font-bold text-slate-450 uppercase tracking-wider">RPE</th>
                                        <th className="text-center px-3 py-3 text-xs font-bold text-slate-450 uppercase tracking-wider hidden md:table-cell">Descanso</th>
                                        <th className="text-center px-3 py-3 text-xs font-bold text-slate-450 uppercase tracking-wider hidden md:table-cell">Partidos</th>
                                        <th className="text-center px-3 py-3 text-xs font-bold text-slate-450 uppercase tracking-wider">Estado</th>
                                        {onVerFicha && <th className="px-3 py-3"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {plantilla_estado.map((atleta, index) => (
                                        <tr 
                                            key={atleta.atleta_id} 
                                            className="hover:bg-slate-50/70 transition-colors animate-fade-in-up"
                                            style={{ animationDelay: `${index * 40 + 420}ms` }}
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 text-xs shrink-0">
                                                        {atleta.nombre.charAt(0)}{atleta.apellido.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 leading-tight">{atleta.nombre} {atleta.apellido}</p>
                                                        {atleta.lesion_activa && (
                                                            <p className="text-xs text-red-600 font-bold leading-none mt-1">⚠ {atleta.lesion_activa}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 hidden sm:table-cell">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">
                                                    {atleta.posicion}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {atleta.ultimo_rpe !== null ? (
                                                    <span className={`font-black text-sm ${atleta.ultimo_rpe >= 9 ? 'text-red-600' : atleta.ultimo_rpe >= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {atleta.ultimo_rpe}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-305 font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center hidden md:table-cell">
                                                {atleta.ultimo_descanso !== null ? (
                                                    <span className={`font-black text-sm ${atleta.ultimo_descanso <= 4 ? 'text-red-600' : atleta.ultimo_descanso <= 6 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {atleta.ultimo_descanso}/10
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-305 font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center hidden md:table-cell">
                                                <span className="font-bold text-slate-700">{atleta.partidos_jugados}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colorRiesgo(atleta.color_riesgo)}`}>
                                                    {iconoRiesgo(atleta.color_riesgo)}
                                                    {atleta.nivel_riesgo}
                                                </span>
                                            </td>
                                            {onVerFicha && (
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => onVerFicha(atleta.atleta_id)}
                                                        className="p-1.5 text-slate-400 hover:text-valle-green hover:bg-slate-100 rounded-lg transition"
                                                        title="Ver ficha individual"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Próximos Partidos */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col animate-fade-in-up animate-delay-420">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 text-sm flex items-center font-display">
                            <Calendar size={16} className="text-valle-green mr-2" />
                            Próximos Encuentros
                        </h3>
                        <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">
                            Programados
                        </span>
                    </div>

                    <div className="flex-1 p-4 space-y-3">
                        {proximos_partidos.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                <Calendar className="mx-auto mb-2 opacity-30" size={28} />
                                <p>No hay partidos programados.</p>
                            </div>
                        ) : (
                            proximos_partidos.map((partido, pIndex) => (
                                <div 
                                    key={partido.id} 
                                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 transition-all hover:border-valle-green/20 animate-fade-in-up"
                                    style={{ animationDelay: `${pIndex * 75 + 470}ms` }}
                                >
                                    <p className="text-xs font-bold text-valle-green uppercase tracking-wider mb-2">
                                        {partido.torneo_nombre}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                        <div className="text-center flex-1">
                                            <div className="w-8 h-8 rounded-full bg-white border border-valle-green/30 flex items-center justify-center mx-auto mb-1">
                                                <Shield size={14} className="text-valle-green" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2">{partido.equipo_local}</p>
                                        </div>
                                        <span className="text-sm font-extrabold text-slate-400 shrink-0">VS</span>
                                        <div className="text-center flex-1">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-1">
                                                <Shield size={14} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2">{partido.equipo_visitante}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500 font-semibold gap-3">
                                        <span className="flex items-center">
                                            <Calendar size={12} className="mr-1 text-valle-gold" />
                                            {formatearFecha(partido.fecha_hora)}
                                        </span>
                                        <span className="flex items-center">
                                            <Clock size={12} className="mr-1 text-valle-gold" />
                                            {formatearHora(partido.fecha_hora)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
