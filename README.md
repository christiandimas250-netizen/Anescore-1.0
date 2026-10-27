# AnesScore PWA — prototipo v1.0

Una aplicación web instalable, sin framework ni cuentas, que comparte los campos introducidos entre escalas ASA-PS (selección clínica), RCRI, Goldman, El-Ganzouri, Wilson y STOP-BANG.

## Cómo probarla

1. Extrae el ZIP.
2. En la carpeta `anescore-pwa`, inicia un servidor local: `python3 -m http.server 8000`.
3. Abre `http://localhost:8000` en tu navegador.
4. Para instalarla en teléfono o tablet, publica la carpeta en un hosting HTTPS (por ejemplo, GitHub Pages o Cloudflare Pages); abre la URL y usa «Añadir a pantalla de inicio» en el navegador. Los navegadores permiten distintas experiencias de instalación.

**No basta con abrir `index.html` como archivo local:** el service worker de PWA requiere localhost o HTTPS.

## Privacidad y límites

- No hay persistencia de datos ni transmisión de campos médicos a un backend.
- Requiere verificar todas las variables: vacío NO equivale a «No».
- Los valores se pierden al recargar o cerrar. Las copias exportadas quedan bajo responsabilidad del usuario.
- No se ha efectuado validación clínica o regulatoria ni pruebas de usabilidad con profesionales. **No utilizar para decisiones clínicas.**
- Gupta MICA, NSQIP, MACOCHA y LEMON no se incorporan en este prototipo: exigen datos, interpretación contextual o reglas que no deben implementarse apresuradamente.
- El componente de movilidad mandibular en Wilson se ha simplificado para esta interfaz y debe ser revisado cuidadosamente frente al instrumento original antes de cualquier uso clínico.

## Publicación sencilla en GitHub Pages

1. Crea un repositorio y sube **el contenido** de la carpeta `anescore-pwa`.
2. En Settings → Pages selecciona Deploy from a branch, rama `main`, carpeta `/root`.
3. Visita el enlace HTTPS publicado y añade la página a la pantalla de inicio.

## Fuentes

- AHA/ACC 2024: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001285
- El-Ganzouri original: https://pubmed.ncbi.nlm.nih.gov/8638791/
- EGRI / Wilson: https://pmc.ncbi.nlm.nih.gov/articles/PMC13652951/
- ASA: https://www.asahq.org/standards-and-practice-parameters/statement-on-asa-physical-status-classification-system
- STOP-BANG: https://www.stopbang.ca/osa/screening.php
