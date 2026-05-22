from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import utils
from dependencies import get_db, obtener_usuario_actual, verificar_cuerpo_tecnico

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

    # 4. Análisis de Fatiga por IA (Usando las últimas cargas físicas)
    cargas = db.query(models.CargaAtleta).filter(
        models.CargaAtleta.atleta_id == atleta_id
    ).order_by(models.CargaAtleta.id.desc()).limit(5).all()
    
    analisis_ia = None
    if cargas:
        texto_cargas = "\n".join([f"RPE: {c.rpe_esfuerzo}, Salto: {c.saltos_cm}" for c in cargas])
        analisis_ia = utils.analizar_fatiga_con_ia(texto_cargas)

    # 5. Respuesta Consolidada
    return {
        "perfil": {
            "atleta_id": atleta.atleta_id,
            "peso_fichaje": atleta.peso_base,
            "altura_fichaje": atleta.altura_cm
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

@router.get("/mi-dashboard")
def obtener_mi_dashboard(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return obtener_dashboard_atleta(atleta_id=usuario_actual.id, db=db, usuario_actual=usuario_actual)

@router.get("/dashboard-entrenador/")
def obtener_dashboard_entrenador(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(verificar_cuerpo_tecnico)
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
