from sqlalchemy.orm import Session
import models
import schemas

def guardar_jugada_tactica(db: Session, usuario_id: int, jugada: schemas.JugadaGuardadaCreate):
    nueva_jugada = models.JugadaGuardada(
        usuario_id=usuario_id,
        titulo=jugada.titulo,
        descripcion=jugada.descripcion,
        tokens_json=jugada.tokens_json,
        trazos_png=jugada.trazos_png
    )
    db.add(nueva_jugada)
    db.commit()
    db.refresh(nueva_jugada)
    return nueva_jugada

def obtener_jugadas_tacticas(db: Session, usuario_id: int):
    return db.query(models.JugadaGuardada).filter(
        models.JugadaGuardada.usuario_id == usuario_id
    ).order_by(models.JugadaGuardada.fecha_creacion.desc()).all()

def obtener_jugada_por_id_y_usuario(db: Session, jugada_id: int, usuario_id: int):
    return db.query(models.JugadaGuardada).filter(
        models.JugadaGuardada.id == jugada_id,
        models.JugadaGuardada.usuario_id == usuario_id
    ).first()

def eliminar_jugada_tactica(db: Session, jugada_id: int, usuario_id: int):
    jugada = obtener_jugada_por_id_y_usuario(db, jugada_id, usuario_id)
    if not jugada:
        return None
    db.delete(jugada)
    db.commit()
    return jugada
