import json
import pdfplumber
import requests
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# --- JUGADOR 1: EL LECTOR DE PDF ---
def extraer_texto_pdf(ruta_archivo: str):
    texto_completo = ""
    try:
        with pdfplumber.open(ruta_archivo) as pdf:
            for pagina in pdf.pages:
                texto_completo += pagina.extract_text() + "\n"
        return texto_completo
    except Exception as e:
        return f"Error al leer el PDF: {str(e)}"

# --- JUGADOR 2: EL ANALISTA TÁCTICO CON IA ---
def analizar_estadisticas_con_ia(texto_reporte: str):
    api_key = os.getenv("GROQ_API_KEY")
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    prompt = f"""
    Eres un analista táctico de Futsal. Tu estilo es directo, telegráfico y al grano.
    Basado en el siguiente reporte de estadísticas, genera un análisis táctico en formato JSON.
    
    REGLA ESTRICTA: Sé extremadamente conciso. Usa máximo una o dos oraciones cortas por campo.
    
    Reporte:
    {texto_reporte}
    
    El JSON debe tener esta estructura exacta:
    {{
        "resumen_partido": "1 sola oración resumiendo la dinámica del juego.",
        "mvp": "Nombre del jugador y 1 sola razón corta de su impacto.",
        "puntos_fuertes": ["Una frase corta", "Una frase corta"],
        "puntos_a_mejorar": ["Una frase corta", "Una frase corta"],
        "analisis_individual": "Mención telegráfica de 1 o 2 jugadores clave máximo."
    }}
    Responde ÚNICAMENTE el objeto JSON puro.
    """
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        # NUEVO: Agregado timeout de 15 segundos para evitar cuelgues del servidor
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            texto_res = data['choices'][0]['message']['content'].strip()
            
            if "```json" in texto_res:
                texto_res = texto_res.split("```json")[1].split("```")[0]
            elif "```" in texto_res:
                texto_res = texto_res.split("```")[1].split("```")[0]
                
            # NUEVO: Captura específica por si la IA devuelve un JSON roto
            try:
                return json.loads(texto_res.strip())
            except json.JSONDecodeError:
                return {"error": "Formato inválido", "detalle_tecnico": "La IA no devolvió un JSON válido."}
        else:
            return {"error": "Google rechazó la petición", "detalle_tecnico": response.text}
            
    # NUEVO: Captura específica si se acaba el tiempo de espera
    except requests.exceptions.Timeout:
        return {"error": "Tiempo de espera agotado", "detalle_tecnico": "La IA tardó más de 15 segundos en responder."}
    except Exception as e:
        return {"error": "Fallo en la comunicación HTTP", "detalle_tecnico": str(e)}

# --- JUGADOR 3: EL ANALISTA DE FATIGA CON IA ---
def analizar_fatiga_con_ia(datos_cargas: str):
    api_key = os.getenv("GROQ_API_KEY")
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    prompt = f"""
    Eres un fisioterapeuta y preparador físico de Futsal. Tu estilo es médico, directo y preventivo.
    Evalúa el riesgo de lesión y la fatiga muscular basándote en este historial de cargas físicas del jugador.
    
    Historial (RPE es esfuerzo del 1 al 10):
    {datos_cargas}
    
    REGLA ESTRICTA: Sé extremadamente conciso.
    El JSON debe tener esta estructura exacta:
    {{
        "nivel_fatiga": "Bajo, Medio, Alto o Crítico",
        "riesgo_lesion": "Bajo, Medio o Alto",
        "analisis": "1 sola oración explicando la tendencia de los datos.",
        "recomendacion": "1 sola oración con la indicación física (ej. 'Descanso activo', 'Carga normal', 'Fisioterapia')."
    }}
    Responde ÚNICAMENTE el objeto JSON puro.
    """
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    try:
        # NUEVO: Agregado timeout de 10 segundos (esta petición es más ligera)
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            texto_res = data['choices'][0]['message']['content'].strip()
            
            if "```json" in texto_res:
                texto_res = texto_res.split("```json")[1].split("```")[0]
            elif "```" in texto_res:
                texto_res = texto_res.split("```")[1].split("```")[0]
                
            try:
                return json.loads(texto_res.strip())
            except json.JSONDecodeError:
                return {"error": "Formato inválido", "detalle": "La IA no generó un JSON válido."}
        else:
            return {"error": "Fallo en IA", "detalle": response.text}
            
    except requests.exceptions.Timeout:
        return {"error": "Timeout", "detalle": "La IA tardó demasiado en responder."}
    except Exception as e:
        return {"error": "Fallo HTTP", "detalle": str(e)}