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
