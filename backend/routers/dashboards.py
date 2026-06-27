from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import models
import utils
from dependencies import get_db, obtener_usuario_actual, verificar_cuerpo_tecnico, verificar_cuerpo_o_nutricionista
import datetime
import json

router = APIRouter(tags=["Dashboards"])

@router.get("/atletas/{atleta_id}/dashboard")
def obtener_dashboard_atleta(
    atleta_id: int, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    # 1. Información de Perfil
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
        
    usuario = db.query(models.Usuario).filter(models.Usuario.id == atleta_id).first()

    # 2. Última Biometría (Peso, Altura, IMC)
    ultima_biometria = db.query(models.RegistroBiometrico).filter(
        models.RegistroBiometrico.atleta_id == atleta_id
    ).order_by(models.RegistroBiometrico.id.desc()).first()

    # 3. Resumen de Hábitos (Últimos 3 registros para promediar hidratación y descanso)
    habitos = db.query(models.RegistroNutricional).filter(
        models.RegistroNutricional.atleta_id == atleta_id
    ).order_by(models.RegistroNutricional.id.desc()).limit(3).all()
    
    promedio_descanso = sum(h.calidad_descanso for h in habitos) / len(habitos) if habitos else 0
    promedio_hidratacion = sum(h.hidratacion_litros for h in habitos) / len(habitos) if habitos else 0

    # 4. Análisis de Fatiga por IA Cacheado (Hoy)
    # Recuperamos de caché si existe un análisis diario de hoy para no retrasar la carga del dashboard
    hoy = datetime.date.today()
    registro_cache = db.query(models.RegistroIA).filter(
        models.RegistroIA.atleta_id == atleta_id,
        models.RegistroIA.modulo == "fatiga_diaria"
    ).order_by(models.RegistroIA.fecha_registro.desc()).first()
    
    analisis_ia = None
    if registro_cache and registro_cache.fecha_registro.date() == hoy:
        try:
            analisis_ia = json.loads(registro_cache.respuesta)
        except Exception:
            pass

    # 5. Cargas Físicas Históricas
    cargas = db.query(models.CargaAtleta).filter(
        models.CargaAtleta.atleta_id == atleta_id
    ).order_by(models.CargaAtleta.id.desc()).limit(5).all()

    # 6. Respuesta Consolidada
    return {
        "perfil": {
            "atleta_id": atleta.atleta_id,
            "foto_perfil": usuario.foto_perfil if usuario else None,
            "peso_fichaje": atleta.peso_base,
            "altura_fichaje": atleta.altura_cm,
            "dieta_asignada": {
                "id": atleta.dieta_asignada.id,
                "nombre": atleta.dieta_asignada.nombre,
                "descripcion": atleta.dieta_asignada.descripcion,
                "calorias": atleta.dieta_asignada.calorias
            } if atleta.dieta_asignada else None
        },
        "estado_fisico": {
            "peso_actual": ultima_biometria.peso_kg if ultima_biometria else atleta.peso_base,
            "imc_actual": ultima_biometria.imc if ultima_biometria else "N/A"
        },
        "habitos_semanales": {
            "promedio_descanso": round(promedio_descanso, 1),
            "promedio_hidratacion": round(promedio_hidratacion, 1)
        },
        "alerta_ia": analisis_ia,
        "cargas_historicas": [{"sesion": f"#{c.sesion_id}", "rpe": c.rpe_esfuerzo, "salto": c.saltos_cm} for c in reversed(cargas)] if cargas else []
    }

@router.get("/atletas/{atleta_id}/analisis-ia")
def obtener_analisis_ia(
    atleta_id: int,
    temporalidad: str = Query("diario", pattern="^(diario|semanal|mensual|anual)$"),
    forzar: bool = Query(False),
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    # Verificar que el atleta existe
    atleta = db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    
    hoy = datetime.date.today()
    modulo_db = f"fatiga_{temporalidad}"
    
    # 1. Verificar Caché en la base de datos
    registro_cache = db.query(models.RegistroIA).filter(
        models.RegistroIA.atleta_id == atleta_id,
        models.RegistroIA.modulo == modulo_db
    ).order_by(models.RegistroIA.fecha_registro.desc()).first()
    
    usar_cache = False
    if registro_cache and not forzar:
        # Reglas de expiración de caché
        if temporalidad == "diario" and registro_cache.fecha_registro.date() == hoy:
            usar_cache = True
        elif temporalidad == "semanal" and registro_cache.fecha_registro.date() == hoy:
            usar_cache = True
        elif temporalidad == "mensual" and registro_cache.fecha_registro >= datetime.datetime.now() - datetime.timedelta(days=3):
            usar_cache = True
        elif temporalidad == "anual" and registro_cache.fecha_registro >= datetime.datetime.now() - datetime.timedelta(days=7):
            usar_cache = True
            
    if usar_cache and not forzar:
        try:
            return json.loads(registro_cache.respuesta)
        except Exception:
            pass # Si falla el decode, forzamos regeneración
            
    # 2. Si no hay caché o expiró, recolectar datos del periodo
    # Biometría y hábitos (común a todos los reportes para cruzar datos)
    ultima_biometria = db.query(models.RegistroBiometrico).filter(
        models.RegistroBiometrico.atleta_id == atleta_id
    ).order_by(models.RegistroBiometrico.id.desc()).first()
    
    texto_nutri = ""
    if atleta:
        texto_nutri += f"- Peso base (fichaje): {atleta.peso_base} kg\n"
    if ultima_biometria:
        texto_nutri += f"- Peso actual: {ultima_biometria.peso_kg} kg, IMC: {ultima_biometria.imc}\n"
        if atleta and atleta.peso_base and ultima_biometria.peso_kg:
            dif_peso = atleta.peso_base - ultima_biometria.peso_kg
            if dif_peso != 0:
                texto_nutri += f"- Cambio de peso: {'perdió' if dif_peso > 0 else 'ganó'} {abs(dif_peso):.1f} kg\n"
                
    if temporalidad == "diario":
        # Cargas de hoy
        cargas = db.query(models.CargaAtleta).join(models.SesionEntrenamiento).filter(
            models.CargaAtleta.atleta_id == atleta_id,
            models.SesionEntrenamiento.fecha == hoy
        ).all()
        
        if not cargas:
            return {
                "nivel_fatiga": "Bajo",
                "riesgo_lesion": "Bajo",
                "analisis": "Sin cargas físicas registradas el día de hoy.",
                "recomendacion": "Aprovecha el día de descanso para recuperar y mantener una hidratación adecuada."
            }
            
        texto_cargas = "\n".join([f"Sesión hoy - RPE esfuerzo: {c.rpe_esfuerzo}/10, Salto vertical: {c.saltos_cm} cm" for c in cargas])
        
        # Hábito de hoy
        habito_hoy = db.query(models.RegistroNutricional).filter(
            models.RegistroNutricional.atleta_id == atleta_id,
            models.RegistroNutricional.fecha == hoy
        ).first()
        
        if habito_hoy:
            texto_nutri += f"- Hidratación hoy: {habito_hoy.hidratacion_litros} litros\n"
            texto_nutri += f"- Calidad de descanso de anoche: {habito_hoy.calidad_descanso}/10\n"
            texto_nutri += f"- Frecuencia de comidas: {habito_hoy.frecuencia_comidas} al día\n"
            if habito_hoy.suplementacion:
                texto_nutri += f"- Suplementación: {habito_hoy.suplementacion}\n"
        else:
            # Si no hay registro de hoy, usar el último disponible
            ultimo_habito = db.query(models.RegistroNutricional).filter(
                models.RegistroNutricional.atleta_id == atleta_id
            ).order_by(models.RegistroNutricional.id.desc()).first()
            if ultimo_habito:
                texto_nutri += f"- Última hidratación registrada: {ultimo_habito.hidratacion_litros} litros\n"
                texto_nutri += f"- Última calidad de descanso registrada: {ultimo_habito.calidad_descanso}/10\n"
                
    elif temporalidad == "semanal":
        fecha_inicio = hoy - datetime.timedelta(days=7)
        cargas = db.query(models.CargaAtleta).join(models.SesionEntrenamiento).filter(
            models.CargaAtleta.atleta_id == atleta_id,
            models.SesionEntrenamiento.fecha >= fecha_inicio
        ).order_by(models.SesionEntrenamiento.fecha.desc()).all()
        
        if not cargas:
            return {
                "nivel_fatiga": "N/A",
                "riesgo_lesion": "N/A",
                "analisis": "No se registraron entrenamientos en los últimos 7 días.",
                "recomendacion": "Registra tus entrenamientos para habilitar el análisis de fatiga semanal."
            }
            
        texto_cargas = "\n".join([f"Fecha: {c.sesion.fecha} - RPE esfuerzo: {c.rpe_esfuerzo}/10, Salto: {c.saltos_cm} cm" for c in cargas])
        
        # Hábitos semanales
        habitos = db.query(models.RegistroNutricional).filter(
            models.RegistroNutricional.atleta_id == atleta_id,
            models.RegistroNutricional.fecha >= fecha_inicio
        ).all()
        if habitos:
            descansos = [h.calidad_descanso for h in habitos if h.calidad_descanso is not None]
            hidrataciones = [h.hidratacion_litros for h in habitos if h.hidratacion_litros is not None]
            promedio_descanso = sum(descansos) / len(descansos) if descansos else 0
            promedio_hidratacion = sum(hidrataciones) / len(hidrataciones) if hidrataciones else 0
            texto_nutri += f"- Promedio descanso semanal: {promedio_descanso:.1f}/10\n"
            texto_nutri += f"- Promedio hidratación semanal: {promedio_hidratacion:.1f} litros/día\n"
            
    elif temporalidad == "mensual":
        fecha_inicio = hoy - datetime.timedelta(days=30)
        cargas = db.query(models.CargaAtleta).join(models.SesionEntrenamiento).filter(
            models.CargaAtleta.atleta_id == atleta_id,
            models.SesionEntrenamiento.fecha >= fecha_inicio
        ).order_by(models.SesionEntrenamiento.fecha.desc()).all()
        
        if not cargas:
            return {
                "nivel_fatiga": "N/A",
                "riesgo_lesion": "N/A",
                "analisis": "No se registraron entrenamientos en los últimos 30 días.",
                "recomendacion": "Registra tus entrenamientos para habilitar el análisis de fatiga mensual."
            }
            
        # Resumen de cargas mensuales
        rpes = [c.rpe_esfuerzo for c in cargas if c.rpe_esfuerzo is not None]
        saltos = [c.saltos_cm for c in cargas if c.saltos_cm is not None]
        rpe_promedio = sum(rpes) / len(rpes) if rpes else 0
        salto_promedio = sum(saltos) / len(saltos) if saltos else 0
        esfuerzos_altos = sum(1 for r in rpes if r >= 8)
        texto_cargas = f"Resumen mensual: {len(cargas)} entrenamientos. RPE Promedio: {rpe_promedio:.1f}/10. Salto promedio: {salto_promedio:.1f} cm. Sesiones con esfuerzo alto (RPE>=8): {esfuerzos_altos}."
        
        # Hábitos mensuales
        habitos = db.query(models.RegistroNutricional).filter(
            models.RegistroNutricional.atleta_id == atleta_id,
            models.RegistroNutricional.fecha >= fecha_inicio
        ).all()
        if habitos:
            descansos = [h.calidad_descanso for h in habitos if h.calidad_descanso is not None]
            hidrataciones = [h.hidratacion_litros for h in habitos if h.hidratacion_litros is not None]
            promedio_descanso = sum(descansos) / len(descansos) if descansos else 0
            promedio_hidratacion = sum(hidrataciones) / len(hidrataciones) if hidrataciones else 0
            texto_nutri += f"- Promedio descanso mensual: {promedio_descanso:.1f}/10\n"
            texto_nutri += f"- Promedio hidratación mensual: {promedio_hidratacion:.1f} litros/día\n"
            
    else: # anual
        fecha_inicio = hoy - datetime.timedelta(days=365)
        cargas = db.query(models.CargaAtleta).join(models.SesionEntrenamiento).filter(
            models.CargaAtleta.atleta_id == atleta_id,
            models.SesionEntrenamiento.fecha >= fecha_inicio
        ).all()
        
        if not cargas:
            return {
                "nivel_fatiga": "N/A",
                "riesgo_lesion": "N/A",
                "analisis": "No se registraron entrenamientos en el último año.",
                "recomendacion": "Registra tus entrenamientos para habilitar el análisis de fatiga anual."
            }
            
        # Resumen de cargas anuales
        rpes = [c.rpe_esfuerzo for c in cargas if c.rpe_esfuerzo is not None]
        saltos = [c.saltos_cm for c in cargas if c.saltos_cm is not None]
        rpe_promedio = sum(rpes) / len(rpes) if rpes else 0
        salto_promedio = sum(saltos) / len(saltos) if saltos else 0
        esfuerzos_altos = sum(1 for r in rpes if r >= 8)
        texto_cargas = f"Resumen anual: {len(cargas)} entrenamientos. RPE Promedio anual: {rpe_promedio:.1f}/10. Salto promedio anual: {salto_promedio:.1f} cm. Sesiones con esfuerzo alto: {esfuerzos_altos}."
        
        # Hábitos anuales
        habitos = db.query(models.RegistroNutricional).filter(
            models.RegistroNutricional.atleta_id == atleta_id,
            models.RegistroNutricional.fecha >= fecha_inicio
        ).all()
        if habitos:
            descansos = [h.calidad_descanso for h in habitos if h.calidad_descanso is not None]
            hidrataciones = [h.hidratacion_litros for h in habitos if h.hidratacion_litros is not None]
            promedio_descanso = sum(descansos) / len(descansos) if descansos else 0
            promedio_hidratacion = sum(hidrataciones) / len(hidrataciones) if hidrataciones else 0
            texto_nutri += f"- Promedio descanso anual: {promedio_descanso:.1f}/10\n"
            texto_nutri += f"- Promedio hidratación anual: {promedio_hidratacion:.1f} litros/día\n"

    # 3. Consultar a la IA
    resultado_ia = utils.analizar_fatiga_con_ia(texto_cargas, texto_nutri if texto_nutri else None, temporalidad)
    
    # 4. Guardar en Caché (RegistroIA) si no es un error
    if isinstance(resultado_ia, dict) and "error" not in resultado_ia:
        nuevo_registro = models.RegistroIA(
            usuario_id=usuario_actual.id,
            atleta_id=atleta_id,
            modulo=modulo_db,
            prompt=f"Cargas:\n{texto_cargas}\nNutrición:\n{texto_nutri}",
            respuesta=json.dumps(resultado_ia),
            proveedor="Groq",
            modelo="llama-3.1-8b-instant"
        )
        db.add(nuevo_registro)
        db.commit()
        
    return resultado_ia

@router.get("/mi-dashboard/analisis-ia")
def obtener_mi_analisis_ia(
    temporalidad: str = Query("diario", pattern="^(diario|semanal|mensual|anual)$"),
    forzar: bool = Query(False),
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return obtener_analisis_ia(atleta_id=usuario_actual.id, temporalidad=temporalidad, forzar=forzar, db=db, usuario_actual=usuario_actual)

@router.get("/mi-dashboard")
def obtener_mi_dashboard(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return obtener_dashboard_atleta(atleta_id=usuario_actual.id, db=db, usuario_actual=usuario_actual)

@router.get("/dashboard-entrenador/")
def obtener_dashboard_entrenador(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(verificar_cuerpo_o_nutricionista)
):
    # 1. RESUMEN DE PLANTILLA
    atletas_db = db.query(models.PerfilAtleta).all()
    total_atletas = len(atletas_db)

    resumen_atletas = []
    atletas_con_lesion = 0

    for atleta in atletas_db:
        usuario = db.query(models.Usuario).filter(models.Usuario.id == atleta.atleta_id).first()

        # Última carga (para RPE)
        ultima_carga = db.query(models.CargaAtleta).filter(
            models.CargaAtleta.atleta_id == atleta.atleta_id
        ).order_by(models.CargaAtleta.id.desc()).first()

        # Último hábito (para descanso/hidratación)
        ultimo_habito = db.query(models.RegistroNutricional).filter(
            models.RegistroNutricional.atleta_id == atleta.atleta_id
        ).order_by(models.RegistroNutricional.id.desc()).first()

        # Lesión activa (fecha_alta == None significa que sigue de baja)
        lesion_activa = db.query(models.Lesion).filter(
            models.Lesion.atleta_id == atleta.atleta_id,
            models.Lesion.fecha_alta == None
        ).first()

        if lesion_activa:
            atletas_con_lesion += 1

        # Cálculo de nivel de riesgo simple (basado en datos, sin IA)
        rpe = ultima_carga.rpe_esfuerzo if ultima_carga else None
        descanso = ultimo_habito.calidad_descanso if ultimo_habito else None

        if lesion_activa:
            nivel_riesgo = "De Baja"
            color_riesgo = "rojo"
        elif rpe is not None and rpe >= 9:
            nivel_riesgo = "Riesgo Alto"
            color_riesgo = "rojo"
        elif rpe is not None and rpe >= 7:
            nivel_riesgo = "Riesgo Medio"
            color_riesgo = "amarillo"
        elif rpe is not None and descanso is not None and descanso <= 4:
            nivel_riesgo = "Descanso Bajo"
            color_riesgo = "amarillo"
        else:
            nivel_riesgo = "Óptimo"
            color_riesgo = "verde"

        # Partidos jugados en la temporada
        partidos_jugados = db.query(models.EstadisticasTacticas).filter(
            models.EstadisticasTacticas.atleta_id == atleta.atleta_id
        ).count()

        resumen_atletas.append({
            "atleta_id": atleta.atleta_id,
            "nombre": usuario.nombre if usuario else "Jugador",
            "apellido": usuario.apellido if usuario else "",
            "posicion": atleta.posicion_especifica or "N/A",
            "ultimo_rpe": rpe,
            "ultimo_descanso": descanso,
            "lesion_activa": lesion_activa.tipo_lesion if lesion_activa else None,
            "nivel_riesgo": nivel_riesgo,
            "color_riesgo": color_riesgo,
            "partidos_jugados": partidos_jugados
        })

    # 2. ESTADÍSTICAS DE PARTIDOS
    todos_partidos = db.query(models.Partido).all()
    finalizados = [p for p in todos_partidos if p.estado == "Finalizado"]

    ganados = 0
    perdidos = 0
    empatados = 0

    for p in finalizados:
        es_local = "Valle" in p.equipo_local
        if es_local:
            goles_valle = p.goles_local
            goles_rival = p.goles_visitante
        else:
            goles_valle = p.goles_visitante
            goles_rival = p.goles_local

        if goles_valle > goles_rival:
            ganados += 1
        elif goles_valle < goles_rival:
            perdidos += 1
        else:
            empatados += 1

    # 3. PRÓXIMOS PARTIDOS (Programados)
    proximos = db.query(models.Partido).filter(
        models.Partido.estado == "Programado"
    ).order_by(models.Partido.fecha_hora.asc()).limit(3).all()

    proximos_formateados = []
    for p in proximos:
        torneo_nombre = p.torneo.nombre if p.torneo else "Sin Torneo"
        proximos_formateados.append({
            "id": p.id,
            "equipo_local": p.equipo_local,
            "equipo_visitante": p.equipo_visitante,
            "fecha_hora": p.fecha_hora.isoformat() if p.fecha_hora else None,
            "torneo_nombre": torneo_nombre
        })

    # 4. CARGA PROMEDIO DEL EQUIPO (Últimas 5 sesiones)
    ultimas_sesiones = db.query(models.SesionEntrenamiento).order_by(
        models.SesionEntrenamiento.id.desc()
    ).limit(5).all()

    tendencia_carga = []
    for sesion in reversed(ultimas_sesiones):
        cargas_sesion = db.query(models.CargaAtleta).filter(
            models.CargaAtleta.sesion_id == sesion.id
        ).all()

        if cargas_sesion:
            rpe_promedio = sum(c.rpe_esfuerzo for c in cargas_sesion if c.rpe_esfuerzo) / len(cargas_sesion)
            salto_promedio = sum(c.saltos_cm for c in cargas_sesion if c.saltos_cm) / len([c for c in cargas_sesion if c.saltos_cm]) if any(c.saltos_cm for c in cargas_sesion) else 0
            tendencia_carga.append({
                "sesion": f"Ses. #{sesion.id}",
                "tipo": sesion.tipo_sesion or "Entrenamiento",
                "rpe_promedio": round(rpe_promedio, 1),
                "salto_promedio": round(salto_promedio, 1),
                "participantes": len(cargas_sesion)
            })

    return {
        "resumen_equipo": {
            "total_atletas": total_atletas,
            "atletas_con_lesion": atletas_con_lesion,
            "atletas_disponibles": total_atletas - atletas_con_lesion,
            "partidos_ganados": ganados,
            "partidos_perdidos": perdidos,
            "partidos_empatados": empatados,
            "total_partidos_jugados": len(finalizados)
        },
        "plantilla_estado": resumen_atletas,
        "proximos_partidos": proximos_formateados,
        "tendencia_carga_equipo": tendencia_carga
    }
