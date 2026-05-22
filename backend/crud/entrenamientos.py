from sqlalchemy.orm import Session
import models
import schemas

# Sesiones de entrenamiento
def obtener_sesion_entrenamiento(db: Session, sesion_id: int):
    return db.query(models.SesionEntrenamiento).filter(models.SesionEntrenamiento.id == sesion_id).first()

def crear_sesion_entrenamiento(db: Session, sesion: schemas.SesionEntrenamientoCreate):
    nueva_sesion = models.SesionEntrenamiento(
        fecha=sesion.fecha,
        tipo_sesion=sesion.tipo_sesion,
        descripcion=sesion.descripcion,
        duracion_min=sesion.duracion_min
    )
    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)
    return nueva_sesion

def listar_sesiones_entrenamiento(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SesionEntrenamiento).order_by(
        models.SesionEntrenamiento.fecha.desc(), 
        models.SesionEntrenamiento.id.desc()
    ).offset(skip).limit(limit).all()

def editar_sesion_entrenamiento(db: Session, sesion_id: int, sesion_update: schemas.SesionEntrenamientoUpdate):
    sesion = obtener_sesion_entrenamiento(db, sesion_id)
    if not sesion:
        return None
        
    if sesion_update.fecha is not None:
        sesion.fecha = sesion_update.fecha
    if sesion_update.tipo_sesion is not None:
        sesion.tipo_sesion = sesion_update.tipo_sesion
    if sesion_update.descripcion is not None:
        sesion.descripcion = sesion_update.descripcion
    if sesion_update.duracion_min is not None:
        sesion.duracion_min = sesion_update.duracion_min
        
    db.commit()
    db.refresh(sesion)
    return sesion

def eliminar_sesion_entrenamiento(db: Session, sesion_id: int):
    sesion = obtener_sesion_entrenamiento(db, sesion_id)
    if not sesion:
        return None
        
    # Borrado manual de cargas asociadas
    cargas = db.query(models.CargaAtleta).filter(models.CargaAtleta.sesion_id == sesion_id).all()
    for carga in cargas:
        db.delete(carga)
        
    db.delete(sesion)
    db.commit()
    return sesion

# Cargas físicas
def registrar_carga_atleta(db: Session, sesion_id: int, carga: schemas.CargaAtletaCreate):
    nueva_carga = models.CargaAtleta(
        sesion_id=sesion_id,
        atleta_id=carga.atleta_id,
        asistencia=carga.asistencia,
        rpe_esfuerzo=carga.rpe_esfuerzo,
        saltos_cm=carga.saltos_cm,
        tiempo_sprint_30m=carga.tiempo_sprint_30m
    )
    db.add(nueva_carga)
    db.commit()
    db.refresh(nueva_carga)
    return nueva_carga

def obtener_cargas_sesion(db: Session, sesion_id: int):
    return db.query(models.CargaAtleta).filter(models.CargaAtleta.sesion_id == sesion_id).all()

def obtener_ultimas_cargas_atleta(db: Session, atleta_id: int, limite: int = 5):
    return db.query(models.CargaAtleta).filter(
        models.CargaAtleta.atleta_id == atleta_id
    ).order_by(models.CargaAtleta.id.desc()).limit(limite).all()
