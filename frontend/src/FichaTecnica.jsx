import React, { useState, useEffect } from 'react';
import api from './api';
import { User, Activity, Scale, Droplet, Moon, Brain, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FichaTecnica() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const res = await api.get('/mi-dashboard');
        // Transformamos los datos para Recharts (inviertiendo el orden a cronológico)
        if (res.data && res.data.cargas_historicas) {
            res.data.cargas_historicas = [...res.data.cargas_historicas].reverse();
        }
        setDatos(res.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Aún no tienes una ficha deportiva creada. Pídele al entrenador que te registre en la Plantilla.');
        } else {
          setError('Error al cargar tu ficha técnica.');
        }
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  if (cargando) return <div className="text-center p-12 text-slate-500">Cargando tu perfil...</div>;
  if (error) return <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center font-medium shadow-sm max-w-lg mx-auto">{error}</div>;
  if (!datos) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* TARJETAS DE MÉTRICAS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peso / IMC</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.estado_fisico?.peso_actual} <span className="text-sm font-medium text-slate-400">kg</span>
            </p>
            <p className="text-xs text-valle-green-light font-semibold mt-1">IMC: {datos.estado_fisico?.imc_actual}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Scale className="text-valle-gold" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descanso Promedio</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.habitos_semanales?.promedio_descanso} <span className="text-sm font-medium text-slate-400">/ 10</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Moon className="text-valle-gold" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hidratación</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.habitos_semanales?.promedio_hidratacion} <span className="text-sm font-medium text-slate-400">L</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Droplet className="text-valle-gold" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sesiones</p>
            <p className="text-2xl font-black text-valle-black mt-1">
              {datos.cargas_historicas?.length || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Activity className="text-valle-gold" size={24} />
          </div>
        </div>

        {/* ALERTA IA */}
        {datos.alerta_ia && (
          <div className="md:col-span-2 lg:col-span-4 bg-valle-black rounded-xl shadow-md p-6 border border-valle-black-light text-white">
            <div className="flex items-center mb-3">
              <Brain className="text-valle-gold mr-3" size={24} />
              <h3 className="font-bold text-lg">Reporte Fisiológico (I.A.)</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-valle-black-light/50 p-4 rounded-lg border border-slate-800">
              {datos.alerta_ia}
            </p>
          </div>
        )}

        {/* GRÁFICO DE RENDIMIENTO */}
        {datos.cargas_historicas && datos.cargas_historicas.length > 0 && (
          <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-valle-black mb-6">Tu Evolución Física (Últimas Sesiones)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datos.cargas_historicas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="sesion" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#B49650" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#2E5235" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                  />
                  <Line yAxisId="left" type="monotone" name="Salto (cm)" dataKey="salto" stroke="#B49650" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" name="Esfuerzo (RPE)" dataKey="rpe" stroke="#2E5235" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-4 space-x-6">
              <div className="flex items-center text-xs font-semibold text-slate-500"><div className="w-3 h-3 bg-valle-gold rounded-full mr-2"></div> Potencia (Salto)</div>
              <div className="flex items-center text-xs font-semibold text-slate-500"><div className="w-3 h-3 bg-valle-green rounded-full mr-2"></div> Fatiga (RPE)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
