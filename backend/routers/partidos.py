from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import os
import boto3
import uuid
import shutil
import schemas
import models
import utils
import config
from logging_config import logger
from database import SessionLocal
from dependencies import get_db, verificar_admin, verificar_cuerpo_tecnico, obtener_usuario_actual
from crud import partidos as crud_partidos

router = APIRouter(tags=["Torneos & Partidos"])

# Tarea en segundo plano para procesar PDF con IA
def procesar_reporte_ia_background(file_path: str, partido_id: int):
    """Crea su propia sesión de BD para no depender de la sesión del request (que ya se cerró)."""
    db = SessionLocal()
    try:
        texto_extraido = utils.extraer_texto_pdf(file_path)
        analisis_ia = utils.analizar_estadisticas_con_ia(texto_extraido)
        
        # Procesar estadísticas individuales si la IA las extrajo
        if isinstance(analisis_ia, dict) and "estadisticas_jugadores" in analisis_ia:
            estadisticas_db = db.query(models.EstadisticasTacticas).filter(
                models.EstadisticasTacticas.partido_id == partido_id
            ).all()
            
            for stat_ia in analisis_ia.get("estadisticas_jugadores", []):
                nombre_ia = str(stat_ia.get("nombre", "")).lower()
                if not nombre_ia: continue
                
                for est_db in estadisticas_db:
                    atleta_perfil = est_db.atleta
                    if atleta_perfil and atleta_perfil.usuario:
                        nombres_db = atleta_perfil.usuario.nombre.lower()
                        apellidos_db = atleta_perfil.usuario.apellido.lower()
                        
                        # Búsqueda difusa simple
                        match_encontrado = False
                        for palabra in nombre_ia.split():
                            if len(palabra) > 3 and (palabra in nombres_db or palabra in apellidos_db):
                                match_encontrado = True
                                break
                                
                        if match_encontrado or nombre_ia in nombres_db or nombre_ia in apellidos_db:
                            est_db.goles = int(stat_ia.get("goles") or 0)
                            est_db.asistencias = int(stat_ia.get("asistencias") or 0)
                            est_db.recuperaciones = int(stat_ia.get("recuperaciones") or 0)
                            est_db.errores_posicionamiento = int(stat_ia.get("errores") or 0)
                            break
            
            db.commit()
            logger.info(f"[IA] Estadísticas individuales actualizadas para el partido {partido_id}.")

        crud_partidos.guardar_reporte_ia(db, partido_id, file_path, analisis_ia)
        logger.info(f"[IA] Reporte del partido {partido_id} procesado correctamente.")
    except Exception as e:
        logger.error(f"[IA ERROR] Error procesando reporte partido {partido_id}: {e}", exc_info=True)
        db.rollback()
        try:
            # Guardar el error de procesamiento para que el frontend pueda reportarlo
            error_data = {
                "error": "Error al procesar el reporte con IA",
                "detalle_tecnico": str(e)
            }
            crud_partidos.guardar_reporte_ia(db, partido_id, file_path, error_data)
        except Exception as db_err:
            logger.error(f"[IA ERROR] No se pudo registrar el error en BD para el partido {partido_id}: {db_err}", exc_info=True)
    finally:
        db.close()

@router.post("/torneos/", response_model=schemas.TorneoResponse)
def crear_torneo(
    torneo: schemas.TorneoCreate, 
    db: Session = Depends(get_db), 
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    if torneo.fecha_inicio <= datetime.now().date():
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser a partir de mañana.")
    if torneo.fecha_fin < torneo.fecha_inicio:
        raise HTTPException(status_code=400, detail="La fecha de fin no puede ser anterior a la fecha de inicio.")
    return crud_partidos.crear_torneo(db, torneo)

@router.get("/torneos/", response_model=list[schemas.TorneoResponse])
def listar_torneos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_partidos.listar_torneos(db, skip, limit)

@router.delete("/torneos/{torneo_id}")
def eliminar_torneo(
    torneo_id: int, 
    db: Session = Depends(get_db), 
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    torneo = crud_partidos.eliminar_torneo(db, torneo_id)
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return {"mensaje": "Torneo eliminado correctamente"}

@router.put("/torneos/{torneo_id}/finalizar", response_model=schemas.TorneoResponse)
def finalizar_torneo(
    torneo_id: int, 
    db: Session = Depends(get_db), 
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    torneo = crud_partidos.finalizar_torneo(db, torneo_id)
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return torneo

@router.post("/partidos/", response_model=schemas.PartidoResponse)
def crear_partido(
    partido: schemas.PartidoCreate, 
    db: Session = Depends(get_db), 
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    torneo_existente = crud_partidos.obtener_torneo_por_id(db, partido.torneo_id)
    if not torneo_existente:
        raise HTTPException(status_code=404, detail="El torneo no existe")
        
    # Validar que la fecha sea estrictamente mayor al día de hoy (mañana en adelante)
    if partido.fecha_hora.date() <= datetime.now().date():
        raise HTTPException(status_code=400, detail="La fecha del partido debe ser a partir del día de mañana.")
        
    return crud_partidos.crear_partido(db, partido)

@router.get("/partidos/")
def obtener_partidos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    partidos = crud_partidos.listar_partidos(db, skip, limit)
    return [
        {
            "id": p.id,
            "torneo_id": p.torneo_id,
            "equipo_local": p.equipo_local,
            "equipo_visitante": p.equipo_visitante,
            "fecha_hora": p.fecha_hora.isoformat() if p.fecha_hora else None,
            "estado": p.estado,
            "goles_local": p.goles_local,
            "goles_visitante": p.goles_visitante,
            "torneo_nombre": p.torneo.nombre if p.torneo else "Torneo Desconocido",
            "jugadores_ids": [est.atleta_id for est in p.estadisticas]
        }
        for p in partidos
    ]

@router.get("/partidos/mis-partidos", response_model=list[schemas.PartidoAtletaResponse])
def obtener_mis_partidos(db: Session = Depends(get_db), usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    # Traer estadísticas tácticas donde aparece el atleta
    estadisticas = db.query(models.EstadisticasTacticas).filter(
        models.EstadisticasTacticas.atleta_id == usuario_actual.id
    ).all()
    
    resultados = []
    for est in estadisticas:
        p = est.partido
        if not p:
            continue
        resultados.append({
            "id": p.id,
            "torneo_id": p.torneo_id,
            "torneo_nombre": p.torneo.nombre if p.torneo else "Amistoso",
            "equipo_local": p.equipo_local,
            "equipo_visitante": p.equipo_visitante,
            "fecha_hora": p.fecha_hora,
            "goles_local": p.goles_local,
            "goles_visitante": p.goles_visitante,
            "estado": p.estado,
            "estadisticas_personales": {
                "goles": est.goles,
                "asistencias": est.asistencias,
                "recuperaciones": est.recuperaciones,
                "errores_posicionamiento": est.errores_posicionamiento,
                "minutos_jugados": est.minutos_jugados
            }
        })
    
    # Ordenar por fecha descendente
    resultados.sort(key=lambda x: x["fecha_hora"], reverse=True)
    return resultados

@router.put("/partidos/{partido_id}")
def actualizar_partido(
    partido_id: int,
    partido_data: schemas.PartidoUpdate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    partido = crud_partidos.actualizar_partido(db, partido_id, partido_data)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
        
    return {
        "mensaje": "Resultado e integrantes registrados exitosamente",
        "partido": {
            "id": partido.id,
            "equipo_local": partido.equipo_local,
            "equipo_visitante": partido.equipo_visitante,
            "estado": partido.estado,
            "goles_local": partido.goles_local,
            "goles_visitante": partido.goles_visitante,
            "jugadores_ids": partido_data.jugadores_ids
        }
    }

@router.delete("/partidos/{partido_id}")
def eliminar_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    partido = crud_partidos.eliminar_partido(db, partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return {"mensaje": "Partido eliminado correctamente"}

@router.post("/partidos/{partido_id}/subir-reporte")
async def subir_reporte_pdf(
    partido_id: int, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    partido_existente = crud_partidos.obtener_partido_por_id(db, partido_id)
    if not partido_existente:
        raise HTTPException(status_code=404, detail="El partido no existe")

    aws_access_key = config.AWS_ACCESS_KEY_ID
    aws_secret_key = config.AWS_SECRET_ACCESS_KEY
    aws_bucket = config.AWS_BUCKET_NAME
    aws_region = config.AWS_REGION
    
    file_path = ""
    file_id = uuid.uuid4().hex
    
    # Leer el contenido del archivo en memoria para evitar problemas de stream cerrado
    contents = await file.read()
    
    if aws_access_key and aws_bucket and aws_access_key != "tu_access_key_aqui":
        try:
            s3 = boto3.client('s3', aws_access_key_id=aws_access_key, aws_secret_access_key=aws_secret_key, region_name=aws_region)
            file_name = f"partidos/{partido_id}_{file_id}_{file.filename}"
            import io
            s3.upload_fileobj(io.BytesIO(contents), aws_bucket, file_name)
            file_path = f"s3://{aws_bucket}/{file_name}"
        except Exception as e:
            logger.warning(f"Aviso S3: {e}")
            
    # Guardar copia local para procesamiento de PDF (o si S3 falla)
    upload_dir = "storage/reportes"
    os.makedirs(upload_dir, exist_ok=True)
    temp_file_path = os.path.join(upload_dir, f"partido_{partido_id}_{file_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        buffer.write(contents)
        
    if not file_path:
        file_path = temp_file_path

    # Registrar el reporte inmediatamente en base de datos como pendiente
    crud_partidos.guardar_reporte_ia(db, partido_id, file_path, None)

    # Enviar a background task (sin pasar la sesión del request)
    background_tasks.add_task(procesar_reporte_ia_background, temp_file_path, partido_id)
    
    return {
        "status": "Procesamiento iniciado en segundo plano",
        "partido_id": partido_id,
        "mensaje": "El reporte se está analizando con IA."
    }

@router.get("/partidos/{partido_id}/reporte")
def obtener_reporte_partido(
    partido_id: int, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    reporte = crud_partidos.obtener_reporte_partido(db, partido_id)
    if not reporte:
        raise HTTPException(status_code=404, detail="No existe un reporte para este partido.")
    
    if reporte.analisis_ia is None:
        return {
            "partido_id": reporte.partido_id,
            "estado": "pendiente_procesamiento",
            "mensaje": "El archivo se subió pero aún no tiene un análisis de IA."
        }
    
    return {
        "partido_id": reporte.partido_id,
        "estado": "completado",
        "analisis_ia": reporte.analisis_ia
    }
