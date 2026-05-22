from sqlalchemy.orm import Session
import models
import schemas

# Torneos
def obtener_torneo_por_id(db: Session, torneo_id: int):
    return db.query(models.Torneo).filter(models.Torneo.id == torneo_id).first()

def crear_torneo(db: Session, torneo: schemas.TorneoCreate):
    nuevo_torneo = models.Torneo(
        nombre=torneo.nombre,
        temporada=torneo.temporada,
        fecha_inicio=torneo.fecha_inicio,
        fecha_fin=torneo.fecha_fin
    )
    db.add(nuevo_torneo)
    db.commit()
    db.refresh(nuevo_torneo)
    return nuevo_torneo

def listar_torneos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Torneo).offset(skip).limit(limit).all()

# Partidos
def obtener_partido_por_id(db: Session, partido_id: int):
    return db.query(models.Partido).filter(models.Partido.id == partido_id).first()

def crear_partido(db: Session, partido: schemas.PartidoCreate):
    nuevo_partido = models.Partido(
        torneo_id=partido.torneo_id,
        equipo_local=partido.equipo_local,
        equipo_visitante=partido.equipo_visitante,
        fecha_hora=partido.fecha_hora
    )
    db.add(nuevo_partido)
    db.commit()
    db.refresh(nuevo_partido)
    return nuevo_partido

def listar_partidos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Partido).offset(skip).limit(limit).all()

def actualizar_partido(db: Session, partido_id: int, partido_data: schemas.PartidoUpdate):
    partido = obtener_partido_por_id(db, partido_id)
    if not partido:
        return None
    
    partido.goles_local = partido_data.goles_local
    partido.goles_visitante = partido_data.goles_visitante
    partido.estado = partido_data.estado
    
    # Eliminar estadísticas tácticas antiguas asociadas a este partido
    db.query(models.EstadisticasTacticas).filter(models.EstadisticasTacticas.partido_id == partido_id).delete()
    
    # Guardar la nueva alineación en EstadisticasTacticas
    for atleta_id in partido_data.jugadores_ids:
        nueva_est = models.EstadisticasTacticas(
            partido_id=partido_id,
            atleta_id=atleta_id,
            goles=0,
            asistencias=0,
            recuperaciones=0,
            errores_posicionamiento=0,
            minutos_jugados=0
        )
        db.add(nueva_est)
    
    db.commit()
    db.refresh(partido)
    return partido

def eliminar_partido(db: Session, partido_id: int):
    partido = obtener_partido_por_id(db, partido_id)
    if not partido:
        return None
        
    # Eliminar estadísticas tácticas relacionadas
    db.query(models.EstadisticasTacticas).filter(
        models.EstadisticasTacticas.partido_id == partido_id
    ).delete()
    
    # Eliminar reportes relacionados
    db.query(models.ReportePartido).filter(
        models.ReportePartido.partido_id == partido_id
    ).delete()
    
    db.delete(partido)
    db.commit()
    return partido

# Reportes de Partido
def obtener_reporte_partido(db: Session, partido_id: int):
    return db.query(models.ReportePartido).filter(models.ReportePartido.partido_id == partido_id).first()

def guardar_reporte_ia(db: Session, partido_id: int, file_path: str, analisis_ia: dict):
    reporte_existente = obtener_reporte_partido(db, partido_id)
    
    if reporte_existente:
        reporte_existente.analisis_ia = analisis_ia
        reporte_existente.ruta_archivo = file_path
        reporte = reporte_existente
    else:
        nuevo_reporte = models.ReportePartido(
            partido_id=partido_id, 
            ruta_archivo=file_path,
            analisis_ia=analisis_ia
        )
        db.add(nuevo_reporte)
        reporte = nuevo_reporte
    
    db.commit()
    if not reporte_existente:
        db.refresh(reporte)
    return reporte
