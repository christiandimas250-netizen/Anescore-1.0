# AnesScore · PWA de calculadoras preoperatorias

Versión 1.1 · Prototipo técnico para revisión. **No validado para decisiones clínicas.**

AnesScore permite capturar variables clínicas una vez y obtener resultados de escalas cardiovasculares y predictoras de dificultades en el manejo de la vía aérea. Se puede instalar como PWA en Android, iOS/iPadOS y equipos de escritorio con navegadores compatibles.

## Instrumentos incluidos

**Estado físico y riesgo cardiovascular:** ASA-PS (selección manual), RCRI (Lee), Goldman original (9 factores; 53 puntos máximos).

**Vía aérea / adultos, principalmente perioperatorios:** El-Ganzouri EGRI; SARI (operacionalización de Nørskov); Wilson; Arné; Naguib; Langeron (ventilación difícil con mascarilla); Mallampati modificado; mordida del labio superior (ULBT); distancia tiromentoniana; distancia esternomentoniana; altura tiromentoniana; apertura interincisiva; STOP-BANG (riesgo de SAOS, no intubación difícil).

**Contextos exclusivos:** MACOCHA solo cuando se selecciona UCI; LEON / LEMON modificado solo al seleccionar urgencias. En LEON se muestran las observaciones de exploración, **sin presentar el recuento como un punto de corte pronóstico validado**.

La pestaña **Metodología** incluye tablas resumidas de lectura de puntuaciones y referencias bibliográficas. Algunas herramientas usan puntos de corte variables según población; se señalan como orientativos.

## Cómo ejecutarla

1. Descomprime el ZIP.
2. Para visualizarla localmente, en la carpeta del proyecto ejecuta `python3 -m http.server 8000`.
3. En el navegador abre `http://localhost:8000`.
4. Para instalarla en el teléfono, publica los **archivos de la carpeta** en un hosting HTTPS (GitHub Pages o Cloudflare Pages). Abre la dirección y usa «Instalar aplicación» en Chrome/Edge o «Añadir a pantalla de inicio» en Safari.

No basta con abrir `index.html` haciendo doble clic para instalarla como PWA: el service worker requiere origen seguro o localhost.

### Publicar en GitHub Pages

1. Crea un repositorio y sube el contenido de `anescore-pwa` en la raíz.
2. En **Settings → Pages** selecciona **Deploy from a branch**, rama `main`, carpeta `/root`.
3. Abre la URL HTTPS generada. Si actualizas la aplicación, reemplaza los archivos y espera a que se despliegue la nueva versión; el service worker v2 actualiza los activos al recargar o reabrir.

## Privacidad y seguridad

- Sin cuentas, analítica, persistencia de expediente ni servidor de datos médicos. Los campos se procesan en el navegador y se pierden al recargar.
- El resumen copiado y los documentos impresos pasan a ser responsabilidad de quien los exporta.
- **Sin validación clínica independiente, certificación como producto sanitario ni pruebas clínicas formales.** Úsala únicamente para revisión técnica y validación hasta completar ese proceso.
- No interpretar campos vacíos como negativos. El motor exige variables presentes para mostrar puntajes completos.
- No extrapolar índices de intubación para laringoscopia directa a videolaringoscopia, pediatría, UCI o urgencias sin revisar la población de desarrollo/validación.
- Cormack–Lehane y la Intubation Difficulty Scale no se incluyen como predictores preanestésicos: requieren observaciones durante/después de intubar.

## Estructura

- `index.html` interfaz
- `style.css` diseño responsivo
- `clinical.js` fórmulas y definiciones de resultados
- `app.js` interacción del formulario y navegación
- `manifest.webmanifest` instalación PWA
- `sw.js` caché offline (v2)
- `icons/` icono propio de laringoscopio vectorial y tamaños para instalación

## Referencias principales

- ASA PS: https://www.asahq.org/standards-and-practice-parameters/statement-on-asa-physical-status-classification-system
- Guía cardiovascular AHA/ACC 2024: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001285
- Goldman: https://pubmed.ncbi.nlm.nih.gov/904659/
- El-Ganzouri: https://pubmed.ncbi.nlm.nih.gov/8638791/
- El-Ganzouri tabla: https://pmc.ncbi.nlm.nih.gov/articles/PMC10172951/
- Wilson y pruebas físicas (Cochrane): https://pmc.ncbi.nlm.nih.gov/articles/PMC6404686/
- Arné: https://pmc.ncbi.nlm.nih.gov/articles/PMC11051977/
- Naguib: https://pmc.ncbi.nlm.nih.gov/articles/PMC10068536/
- Langeron: https://pubmed.ncbi.nlm.nih.gov/10781266/
- MACOCHA: https://pubmed.ncbi.nlm.nih.gov/23348979/
- LEMON modificado: https://pubmed.ncbi.nlm.nih.gov/26166379/
- Revisión sistemática JAMA de exploración clínica: https://pubmed.ncbi.nlm.nih.gov/30721300/
