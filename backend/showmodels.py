import os
import google.generativeai as genai
from dotenv import load_dotenv

# Cargamos tu llave
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Buscando modelos disponibles para generar texto...\n")

# Listamos todos los modelos a los que tu llave tiene acceso
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)