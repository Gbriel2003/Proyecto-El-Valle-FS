from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
from dependencies import get_db, obtener_usuario_actual
from crud import jugadas as crud_jugadas

router = APIRouter(tags=["Pizarra Táctica"])

@router.post("/jugadas", response_model=schemas.JugadaGuardadaResponse)
def guardar_jugada_tactica(
    jugada: schemas.JugadaGuardadaCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return crud_jugadas.guardar_jugada_tactica(db, usuario_actual.id, jugada)

@router.get("/jugadas", response_model=list[schemas.JugadaGuardadaResponse])
def obtener_jugadas_tacticas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    return crud_jugadas.obtener_jugadas_tacticas(db, usuario_actual.id)

@router.delete("/jugadas/{jugada_id}")
def eliminar_jugada_tactica(
    jugada_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    jugada = crud_jugadas.eliminar_jugada_tactica(db, jugada_id, usuario_actual.id)
    if not jugada:
        raise HTTPException(status_code=404, detail="Jugada no encontrada.")
    return {"message": "Jugada eliminada exitosamente"}
