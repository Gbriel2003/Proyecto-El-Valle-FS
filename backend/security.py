from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

# ==========================================
# CONFIGURACIÓN DE CONTRASEÑAS (La licuadora)
# ==========================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def obtener_password_hash(password: str):
    return pwd_context.hash(password)

def verificar_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# ==========================================
# CONFIGURACIÓN DE TOKENS (El Brazalete VIP)
# ==========================================
import os
from dotenv import load_dotenv

load_dotenv()

# ¡IMPORTANTE! Esta es la firma del club. Si alguien intenta falsificar un token, 
# no podrá hacerlo porque no tiene esta clave secreta.
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_inseguro_por_defecto_cambiame")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120 # El pase VIP durará 2 horas

def crear_token_acceso(data: dict):
    to_encode = data.copy()
    # Calculamos a qué hora se vence el token
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Creamos el token sellado con la clave secreta del club
    token_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt