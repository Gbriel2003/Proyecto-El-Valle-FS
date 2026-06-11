from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas
import models
from dependencies import get_db, verificar_cuerpo_tecnico, obtener_usuario_actual
from crud import lesiones as crud_lesiones
from crud import atletas as crud_atletas

router = APIRouter(tags=["Lesiones"])

@router.post("/atletas/{atleta_id}/lesiones", response_model=schemas.LesionResponse)
def registrar_lesion(
    atleta_id: int,
    lesion: schemas.LesionCreate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    res = crud_lesiones.registrar_lesion(db, atleta_id, lesion)
    crud_atletas.limpiar_cache_ia_atleta(db, atleta_id)
    return res

@router.get("/atletas/{atleta_id}/lesiones", response_model=list[schemas.LesionResponse])
def obtener_lesiones(
    atleta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(obtener_usuario_actual)
):
    atleta = crud_atletas.obtener_perfil_atleta(db, atleta_id)
    if not atleta:
        raise HTTPException(status_code=404, detail="Atleta no encontrado.")
    return crud_lesiones.obtener_lesiones_atleta(db, atleta_id)

@router.put("/lesiones/{lesion_id}/alta", response_model=schemas.LesionResponse)
def dar_alta_lesion(
    lesion_id: int,
    alta_data: schemas.LesionUpdate,
    db: Session = Depends(get_db),
    admin_o_entrenador: models.Usuario = Depends(verificar_cuerpo_tecnico)
):
    lesion = crud_lesiones.dar_alta_lesion(db, lesion_id, alta_data)
    if not lesion:
        raise HTTPException(status_code=404, detail="Registro de lesión no encontrado.")
    crud_atletas.limpiar_cache_ia_atleta(db, lesion.atleta_id)
    return lesion
