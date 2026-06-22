from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models, schemas
from dependencies import get_db, obtener_usuario_actual

router = APIRouter(tags=["Notificaciones"])

@router.get("/notificaciones/mis-notificaciones", response_model=List[schemas.NotificacionResponse])
def obtener_mis_notificaciones(db: Session = Depends(get_db), usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    # Generar alertas de partidos pasados para el entrenador/admin
    if usuario_actual.rol and usuario_actual.rol.lower() in ["admin", "entrenador"]:
        partidos_pendientes = db.query(models.Partido).filter(
            models.Partido.estado == "Programado",
            models.Partido.fecha_hora < datetime.now()
        ).all()
        
        for partido in partidos_pendientes:
            fecha_str = partido.fecha_hora.strftime("%d/%m/%Y")
            mensaje = f"Al partido {partido.equipo_local} vs {partido.equipo_visitante} del día {fecha_str} no se le ha cargado el resultado ni el reporte."
            
            # Evitar duplicar la misma notificación
            notif_existente = db.query(models.Notificacion).filter(
                models.Notificacion.usuario_id == usuario_actual.id,
                models.Notificacion.mensaje == mensaje
            ).first()
            
            if not notif_existente:
                nueva_notif = models.Notificacion(
                    usuario_id=usuario_actual.id,
                    mensaje=mensaje,
                    tipo="warning"
                )
                db.add(nueva_notif)
        db.commit()

    notificaciones = db.query(models.Notificacion).filter(
        models.Notificacion.usuario_id == usuario_actual.id
    ).order_by(models.Notificacion.fecha_creacion.desc()).limit(20).all()
    return notificaciones

@router.put("/notificaciones/{notificacion_id}/leida")
def marcar_notificacion_como_leida(notificacion_id: int, db: Session = Depends(get_db), usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    notif = db.query(models.Notificacion).filter(
        models.Notificacion.id == notificacion_id,
        models.Notificacion.usuario_id == usuario_actual.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
    notif.leido = True
    db.commit()
    return {"mensaje": "Notificación marcada como leída"}

@router.delete("/notificaciones/{notificacion_id}")
def eliminar_notificacion(notificacion_id: int, db: Session = Depends(get_db), usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    notif = db.query(models.Notificacion).filter(
        models.Notificacion.id == notificacion_id,
        models.Notificacion.usuario_id == usuario_actual.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
    db.delete(notif)
    db.commit()
    return {"mensaje": "Notificación eliminada"}

@router.put("/notificaciones/marcar-todas")
def marcar_todas_leidas(db: Session = Depends(get_db), usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    db.query(models.Notificacion).filter(
        models.Notificacion.usuario_id == usuario_actual.id,
        models.Notificacion.leido == False
    ).update({"leido": True})
    db.commit()
    return {"mensaje": "Todas las notificaciones marcadas como leídas"}

@router.delete("/notificaciones/limpiar-todas")
def limpiar_todas_notificaciones(db: Session = Depends(get_db), usuario_actual: models.Usuario = Depends(obtener_usuario_actual)):
    db.query(models.Notificacion).filter(
        models.Notificacion.usuario_id == usuario_actual.id
    ).delete()
    db.commit()
    return {"mensaje": "Todas las notificaciones eliminadas"}
