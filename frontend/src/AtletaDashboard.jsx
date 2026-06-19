import { useState, useEffect } from 'react';
import api from './api';
import { Search, Activity, Scale, Droplet, Moon, Brain, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AtletaDashboard() {
    const [atletaId, setAtletaId] = useState('');
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const [temporalidad, setTemporalidad] = useState('diario');
    const [analisisIa, setAnalisisIa] = useState({
        diario: null,
        semanal: null,
        mensual: null,
        anual: null
    });
    const [cargandoIa, setCargandoIa] = useState(false);
    const [errorIa, setErrorIa] = useState('');

    const cargarAnalisisIa = async (idAtleta, temp, forzar = false) => {
        if (!idAtleta) return;
        // Si ya está en caché local para esta sesión, no re-consultar (a menos que se fuerce)
        if (analisisIa[temp] && !forzar) return;
        
        setCargandoIa(true);
        setErrorIa('');
        try {
            const res = await api.get(`/atletas/${idAtleta}/analisis-ia?temporalidad=${temp}${forzar ? '&forzar=true' : ''}`);
            setAnalisisIa(prev => ({
                ...prev,
                [temp]: res.data
            }));
        } catch (err) {
            console.error(err);
            setErrorIa('Error al cargar el análisis de la IA.');
        } finally {
            setCargandoIa(false);
        }
    };

    useEffect(() => {
        if (datos && atletaId) {
            cargarAnalisisIa(atletaId, temporalidad);
        }
    }, [temporalidad, atletaId]);

    const buscarJugador = async (e) => {
        e.preventDefault();
        if (!atletaId) return;

        setCargando(true);
        setError('');
        setDatos(null);
        setAnalisisIa({ diario: null, semanal: null, mensual: null, anual: null });
        setTemporalidad('diario');

        try {
            const respuesta = await api.get(`/atletas/${atletaId}/dashboard`);
            setDatos(respuesta.data);
            
            // Si el backend trajo el análisis de hoy en la respuesta principal, lo guardamos en la caché local
            if (respuesta.data.alerta_ia && !respuesta.data.alerta_ia.error) {
                setAnalisisIa(prev => ({
                    ...prev,
                    diario: respuesta.data.alerta_ia
                }));
            } else {
                await cargarAnalisisIa(atletaId, 'diario');
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setError('Jugador no encontrado. Verifica el número de ficha.');
            } else {
                setError('Error al conectar con el servidor.');
            }
        } finally {
            setCargando(false);
        }
    };

    const colorRiesgo = (riesgo) => {
        if (!riesgo) return 'bg-slate-100 text-slate-800';
        const nivel = riesgo.toLowerCase();
        if (nivel.includes('alto') || nivel.includes('crítico')) return 'bg-red-100 text-red-800 border-red-200';
        if (nivel.includes('medio')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    };

    return (
        <div className="space-y-6 w-full mx-auto px-2 sm:px-4 lg:px-6">
            {/* Buscador */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-valle-black w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full bg-valle-green flex items-center justify-center shadow-sm">
                        <Search size={20} className="text-valle-gold" />
                    </div>
                    <span className="font-bold text-sm">Buscar Ficha Técnica</span>
                </div>
                <form onSubmit={buscarJugador} className="flex space-x-2 w-full sm:w-auto">
                    <input
                        type="number"
                        placeholder="ID del Atleta (Ej. 3)"
                        className="flex-1 sm:w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-valle-green focus:ring-1 focus:ring-valle-green"
                        value={atletaId}
                        onChange={(e) => setAtletaId(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={cargando}
                        className="px-6 py-2 bg-valle-green hover:bg-valle-green-dark text-valle-gold rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-70"
                    >
                        {cargando ? 'Buscando...' : 'Consultar'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-sm text-red-700 font-medium">
                    {error}
                </div>
            )}

            {/* Resultados */}
            {datos && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Tarjeta 1: Biometría */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Scale size={18} className="mr-2 text-valle-green" /> Biometría
                            </h3>
                            <span className="text-sm font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                Atleta #{datos.perfil.atleta_id}
                            </span>
                        </div>
                        <div className="space-y-4 flex-1">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Peso Fichaje vs Actual</p>
                                <div className="flex items-end space-x-2">
                                    <span className="text-2xl font-black text-slate-800">{datos.estado_fisico.peso_actual} kg</span>
                                    <span className="text-sm text-slate-400 line-through mb-1">{datos.perfil.peso_fichaje} kg</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">Índice de Masa Corporal</p>
                                <span className="text-sm font-bold text-slate-700">{datos.estado_fisico.imc_actual}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 2: Hábitos Semanales */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Activity size={18} className="mr-2 text-valle-green" /> Hábitos Semanales
                            </h3>
                        </div>
                        <div className="space-y-6 flex-1">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mr-4 border border-slate-100">
                                    <Moon size={18} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Calidad de Descanso</p>
                                    <p className="text-base font-bold text-slate-800">{datos.habitos_semanales.promedio_descanso} / 10</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mr-4 border border-slate-100">
                                    <Droplet size={18} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Hidratación Promedio</p>
                                    <p className="text-base font-bold text-slate-800">{datos.habitos_semanales.promedio_hidratacion} Litros</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 3: Inteligencia Artificial (Gemini) */}
                    <div className="md:col-span-2 lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden">
                        <div className="flex items-center mb-3 relative z-10">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Brain size={18} className="mr-2 text-valle-green" /> Análisis IAMédico
                            </h3>
                        </div>

                        {/* Selector Segmentado de Temporalidad y Botón de Recarga */}
                        <div className="flex items-center gap-2 mb-4 relative z-10 w-full">
                            <div className="flex-1 flex gap-1 p-1 bg-slate-100 rounded-lg text-[10px] font-bold">
                                {['diario', 'semanal', 'mensual', 'anual'].map((temp) => (
                                    <button
                                        key={temp}
                                        type="button"
                                        onClick={() => setTemporalidad(temp)}
                                        className={`flex-1 py-1 rounded-md text-center capitalize transition cursor-pointer ${
                                            temporalidad === temp
                                                ? 'bg-valle-green text-valle-gold shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {temp}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => cargarAnalisisIa(atletaId, temporalidad, true)}
                                disabled={cargandoIa}
                                className={`p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer ${cargandoIa ? 'animate-spin opacity-55' : ''}`}
                                title="Regenerar análisis de IA en vivo"
                            >
                                <RefreshCw size={13} />
                            </button>
                        </div>

                        <div className="flex-1 relative z-10 flex flex-col justify-center">
                            {cargandoIa ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-valle-green mb-2"></div>
                                    <p className="text-xs text-slate-500 font-bold">Generando análisis con IA...</p>
                                </div>
                            ) : errorIa ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                    <AlertTriangle size={24} className="text-red-500 mb-2" />
                                    <p className="text-sm text-red-700 font-bold">Error de Conexión IA</p>
                                    <p className="text-xs text-red-600 mt-1">{errorIa}</p>
                                </div>
                            ) : analisisIa[temporalidad] ? (
                                analisisIa[temporalidad].error ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <AlertTriangle size={24} className="text-red-500 mb-2" />
                                        <p className="text-sm text-red-700 font-bold">Error de la IA</p>
                                        <p className="text-xs text-red-600 mt-1">{analisisIa[temporalidad].error}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <span className="text-xs text-slate-500 uppercase font-bold">Riesgo de Lesión</span>
                                            <span className={`text-xs font-bold px-3 py-1 rounded shadow-sm ${colorRiesgo(analisisIa[temporalidad].riesgo_lesion)}`}>
                                                {analisisIa[temporalidad].riesgo_lesion}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-700 italic leading-relaxed font-medium">"{analisisIa[temporalidad].analisis}"</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-xs font-bold text-valle-green uppercase tracking-wider mb-1 flex items-center">
                                                <CheckCircle size={14} className="mr-1" /> Recomendación
                                            </p>
                                            <p className="text-sm text-slate-800 font-medium">{analisisIa[temporalidad].recomendacion}</p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                                    <AlertTriangle size={24} className="text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-500">No hay datos suficientes para generar este reporte.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tarjeta 4: Gráfico de Cargas Históricas */}
                    {datos.cargas_historicas && datos.cargas_historicas.length > 0 && (
                        <div className="md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col mt-2">
                            <div className="flex items-center mb-6">
                                <h3 className="font-bold text-valle-black flex items-center">
                                    <Activity size={18} className="mr-2 text-valle-green" /> Tendencia de Fatiga (Últimas Sesiones)
                                </h3>
                            </div>
                            <div className="h-[300px] sm:h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <LineChart data={datos.cargas_historicas} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="sesion" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} domain={[0, 10]} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={10} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                        <Line yAxisId="left" type="monotone" dataKey="rpe" stroke="#2E5235" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} name="RPE (Esfuerzo 1-10)" />
                                        <Line yAxisId="right" type="monotone" dataKey="salto" stroke="#B49650" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Salto Vertical (cm)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}