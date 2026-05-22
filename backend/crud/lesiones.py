from sqlalchemy.orm import Session
import models
import schemas

def registrar_lesion(db: Session, atleta_id: int, lesion: schemas.LesionCreate):
    nueva_lesion = models.Lesion(
        atleta_id=atleta_id,
        tipo_lesion=lesion.tipo_lesion,
        gravedad=lesion.gravedad,
        fecha_inicio=lesion.fecha_inicio,
        descripcion=lesion.descripcion,
        rehabilitacion=lesion.rehabilitacion
    )
    db.add(nueva_lesion)
    db.commit()
    db.refresh(nueva_lesion)
    return nueva_lesion

def obtener_lesiones_atleta(db: Session, atleta_id: int):
    return db.query(models.Lesion).filter(
        models.Lesion.atleta_id == atleta_id
    ).order_by(models.Lesion.fecha_inicio.desc()).all()

def obtener_lesion_por_id(db: Session, lesion_id: int):
    return db.query(models.Lesion).filter(models.Lesion.id == lesion_id).first()

def dar_alta_lesion(db: Session, lesion_id: int, alta_data: schemas.LesionUpdate):
    lesion = obtener_lesion_por_id(db, lesion_id)
    if not lesion:
        return None
    lesion.fecha_alta = alta_data.fecha_alta
    if alta_data.rehabilitacion:
        lesion.rehabilitacion = alta_data.rehabilitacion
    db.commit()
    db.refresh(lesion)
    return lesion

def obtener_lesion_activa(db: Session, atleta_id: int):
    return db.query(models.Lesion).filter(
        models.Lesion.atleta_id == atleta_id,
        models.Lesion.fecha_alta == None
    ).first()
