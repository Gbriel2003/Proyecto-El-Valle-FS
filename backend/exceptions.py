from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from logging_config import logger

def registrar_manejadores_excepciones(app: FastAPI):
    
    @app.exception_handler(SQLAlchemyError)
    async def manejador_excepcion_db(request: Request, exc: SQLAlchemyError):
        logger.error(f"Error de Base de Datos en {request.method} {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error de Base de Datos",
                "detalle_tecnico": "Ha ocurrido un problema interno con el almacenamiento de datos."
            }
        )

    @app.exception_handler(Exception)
    async def manejador_excepcion_general(request: Request, exc: Exception):
        logger.error(f"Error inesperado no controlado en {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error Interno del Servidor",
                "detalle_tecnico": "Ocurrió un error inesperado al procesar tu solicitud."
            }
        )
