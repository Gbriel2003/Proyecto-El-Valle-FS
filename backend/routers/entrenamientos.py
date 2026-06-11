from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
from dependencies import get_db, verificar_cuerpo_tecnico
from crud import entrenamientos as crud_entrenamientos

router = APIRouter(tags=["Entrenamientos"])

@router.post("/entrenamientos/", response_model=schemas.SesionEntrenamientoResponse)
def crear_sesion_entrenamiento(
    sesion: schemas.SesionEntrenamientoCreate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    return crud_entrenamientos.crear_sesion_entrenamiento(db, sesion)

@router.get("/entrenamientos/")
def listar_sesiones_entrenamiento(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_entrenamientos.listar_sesiones_entrenamiento(db, skip, limit)

@router.put("/entrenamientos/{sesion_id}", response_model=schemas.SesionEntrenamientoResponse)
def editar_sesion_entrenamiento(
    sesion_id: int,
    sesion_update: schemas.SesionEntrenamientoUpdate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    sesion = crud_entrenamientos.editar_sesion_entrenamiento(db, sesion_id, sesion_update)
    if not sesion:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
    return sesion

@router.delete("/entrenamientos/{sesion_id}")
def eliminar_sesion_entrenamiento(
    sesion_id: int,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    sesion = crud_entrenamientos.eliminar_sesion_entrenamiento(db, sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
    return {"mensaje": f"Sesión #{sesion_id} y sus cargas asociadas han sido eliminadas."}

@router.post("/entrenamientos/{sesion_id}/cargas/")
def registrar_carga_atleta(
    sesion_id: int,
    carga: schemas.CargaAtletaCreate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    sesion_existente = crud_entrenamientos.obtener_sesion_entrenamiento(db, sesion_id)
    if not sesion_existente:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
        
    if carga.asistencia:
        # Validar si el jugador está lesionado
        lesion_activa = db.query(models.Lesion).filter(
            models.Lesion.atleta_id == carga.atleta_id,
            models.Lesion.fecha_alta == None
        ).first()
        if lesion_activa and sesion_existente.tipo_sesion != "Recuperación":
            raise HTTPException(
                status_code=400,
                detail=f"El jugador está lesionado (lesión: {lesion_activa.tipo_lesion}) y no puede entrenar en sesiones de tipo '{sesion_existente.tipo_sesion}'. Solo debe hacer ejercicios de recuperación."
            )

    nueva_carga = crud_entrenamientos.registrar_carga_atleta(db, sesion_id, carga)
    return {"mensaje": "Carga registrada con éxito", "carga": nueva_carga}

@router.get("/entrenamientos/{sesion_id}/cargas/")
def obtener_cargas_sesion(
    sesion_id: int,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    cargas = crud_entrenamientos.obtener_cargas_sesion(db, sesion_id)
    atletas_evaluados = [c.atleta_id for c in cargas]
    return {"sesion_id": sesion_id, "cargas": cargas, "atletas_evaluados": atletas_evaluados}

@router.put("/entrenamientos/{sesion_id}/asistencia")
def registrar_asistencia_masiva(
    sesion_id: int,
    datos: schemas.AsistenciaMasiva,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    sesion_existente = crud_entrenamientos.obtener_sesion_entrenamiento(db, sesion_id)
    if not sesion_existente:
        raise HTTPException(status_code=404, detail="La sesión de entrenamiento no existe.")
    
    if sesion_existente.tipo_sesion != "Recuperación":
        for item in datos.asistencias:
            if item.asistencia:
                lesion_activa = db.query(models.Lesion).filter(
                    models.Lesion.atleta_id == item.atleta_id,
                    models.Lesion.fecha_alta == None
                ).first()
                if lesion_activa:
                    usuario = db.query(models.Usuario).filter(models.Usuario.id == item.atleta_id).first()
                    nombre_jugador = f"{usuario.nombre} {usuario.apellido}" if usuario else f"ID {item.atleta_id}"
                    raise HTTPException(
                        status_code=400,
                        detail=f"El jugador {nombre_jugador} está lesionado y no puede asistir a una sesión de tipo '{sesion_existente.tipo_sesion}'. Solo debe hacer ejercicios de recuperación."
                    )

    cargas = crud_entrenamientos.registrar_asistencia_masiva(db, sesion_id, datos)
    return {"mensaje": "Asistencia masiva registrada con éxito", "cargas": cargas}

@router.get("/entrenamientos/equipo/analisis-ia")
def obtener_analisis_entrenamientos_ia(
    temporalidad: str = "diario",
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    import datetime
    import json
    
    hoy = datetime.date.today()
    if temporalidad == "diario":
        fecha_inicio = hoy
    elif temporalidad == "semanal":
        fecha_inicio = hoy - datetime.timedelta(days=7)
    elif temporalidad == "mensual":
        fecha_inicio = hoy - datetime.timedelta(days=30)
    elif temporalidad == "anual":
        fecha_inicio = hoy - datetime.timedelta(days=365)
    else:
        fecha_inicio = hoy

    # Consultar sesiones
    sesiones = db.query(models.SesionEntrenamiento).filter(
        models.SesionEntrenamiento.fecha >= fecha_inicio
    ).order_by(models.SesionEntrenamiento.fecha.asc()).all()
    
    if not sesiones:
        return {
            "carga_global": "N/A",
            "tendencia": "No hay sesiones de entrenamiento registradas en este periodo.",
            "puntos_fuertes": [],
            "puntos_a_mejorar": [],
            "recomendacion_tecnica": "Registra sesiones de entrenamiento para generar análisis."
        }

    # Armar texto descriptivo
    texto_sesiones = f"Resumen de {len(sesiones)} sesiones en el periodo '{temporalidad}':\n"
    for s in sesiones:
        cargas = db.query(models.CargaAtleta).filter(models.CargaAtleta.sesion_id == s.id).all()
        evaluados = [c for c in cargas if c.rpe_esfuerzo is not None]
        if not evaluados:
            texto_sesiones += f"- Fecha: {s.fecha}, Tipo: {s.tipo_sesion}, Duración: {s.duracion_min}min. Sin cargas registradas.\n"
            continue
            
        rpe_promedio = sum(c.rpe_esfuerzo for c in evaluados) / len(evaluados)
        jugadores_riesgo = sum(1 for c in evaluados if c.rpe_esfuerzo > 8)
        
        saltos = [float(c.saltos_cm) for c in evaluados if c.saltos_cm]
        sprints = [float(c.tiempo_sprint_30m) for c in evaluados if c.tiempo_sprint_30m]
        
        salto_promedio = sum(saltos) / len(saltos) if saltos else 0
        sprint_promedio = sum(sprints) / len(sprints) if sprints else 0
        
        detalle_fisico = ""
        if salto_promedio > 0 or sprint_promedio > 0:
            detalle_fisico = f" | Salto vertical prom: {salto_promedio:.1f}cm, Sprint 30m prom: {sprint_promedio:.2f}s"
            
        texto_sesiones += f"- Fecha: {s.fecha}, Tipo: {s.tipo_sesion}, Duración: {s.duracion_min}min. Asistencia: {len(cargas)}, RPE prom: {rpe_promedio:.1f}/10. Jugadores en riesgo (RPE>8): {jugadores_riesgo}{detalle_fisico}\n"

    # Buscar en caché (RegistroIA general para equipo usando usuario_id del admin pero atleta_id=0 o None, pero el modelo requiere atleta_id. Usaremos atleta_id=1 por defecto o guardamos de otra forma. Mejor no cachear para equipo por simplicidad temporal)
    
    import utils
    resultado_ia = utils.analizar_entrenamientos_equipo_con_ia(texto_sesiones, temporalidad)
    return resultado_ia

