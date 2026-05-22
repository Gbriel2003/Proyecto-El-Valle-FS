import os
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
load_dotenv()

# Configuración de Base de Datos
DATABASE_URL = os.getenv("DATABASE_URL")

# Configuración de Seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_inseguro_por_defecto_cambiame")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Configuración de AWS S3
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Configuración de IA (Groq)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
