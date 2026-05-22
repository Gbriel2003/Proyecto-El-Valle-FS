from sqlalchemy.orm import Session
import models
import schemas

def obtener_perfil_atleta(db: Session, atleta_id: int):
    return db.query(models.PerfilAtleta).filter(models.PerfilAtleta.atleta_id == atleta_id).first()

def crear_perfil_atleta(db: Session, perfil: schemas.PerfilAtletaCreate):
    nuevo_perfil = models.PerfilAtleta(
        atleta_id=perfil.atleta_id,
        fecha_nacimiento=perfil.fecha_nacimiento,
        peso_base=perfil.peso_base,
        altura_cm=perfil.altura_cm,
        posicion_especifica=perfil.posicion_especifica,
        pierna_habil=perfil.pierna_habil
    )
    db.add(nuevo_perfil)
    db.commit()
    db.refresh(nuevo_perfil)
    return nuevo_perfil

def listar_perfiles_atletas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PerfilAtleta).offset(skip).limit(limit).all()

def actualizar_perfil_atleta(db: Session, atleta_id: int, perfil_actualizado: schemas.PerfilAtletaUpdate):
    perfil = obtener_perfil_atleta(db, atleta_id)
    if not perfil:
        return None
    if perfil_actualizado.peso_base is not None:
        perfil.peso_base = perfil_actualizado.peso_base
    if perfil_actualizado.altura_cm is not None:
        perfil.altura_cm = perfil_actualizado.altura_cm
    if perfil_actualizado.posicion_especifica is not None:
        perfil.posicion_especifica = perfil_actualizado.posicion_especifica
    if perfil_actualizado.pierna_habil is not None:
        perfil.pierna_habil = perfil_actualizado.pierna_habil
    db.commit()
    db.refresh(perfil)
    return perfil

def registrar_biometria(db: Session, atleta_id: int, biometria: schemas.RegistroBiometricoCreate):
    altura_metros = biometria.altura_cm / 100
    imc_calculado = round(biometria.peso_kg / (altura_metros ** 2), 2)
    nuevo_registro = models.RegistroBiometrico(
        atleta_id=atleta_id,
        peso_kg=biometria.peso_kg,
        altura_cm=biometria.altura_cm,
        imc=imc_calculado
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

def registrar_habitos_nutricionales(db: Session, atleta_id: int, registro: schemas.RegistroNutricionalCreate):
    nuevo_registro = models.RegistroNutricional(
        atleta_id=atleta_id,
        frecuencia_comidas=registro.frecuencia_comidas,
        suplementacion=registro.suplementacion,
        hidratacion_litros=registro.hidratacion_litros,
        calidad_descanso=registro.calidad_descanso
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

def obtener_habitos_nutricionales(db: Session, atleta_id: int):
    return db.query(models.RegistroNutricional).filter(
        models.RegistroNutricional.atleta_id == atleta_id
    ).order_by(models.RegistroNutricional.fecha.desc()).all()
