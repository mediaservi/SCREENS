# Reglas de trabajo con Claude en este repositorio

- Responder siempre en español.
- Cambios estrictamente los solicitados: no tocar estructura, estética ni otros aspectos que no se pidan.
- Los datos salen siempre en vivo del catálogo del panel AVHUB ADMIN (Drive), nunca de datos de muestra o locales. La hoja de Google Sheets está desconectada desde la v10.63. El catálogo se mantiene desde el panel (CRM, tarifas en Excel y la sincronización de las 4:00); en especificaciones manda lo publicado en la web y los PDF en línea de traulux.net y charmex.net.
- Cada petición genera una versión nueva (vX.Y, nunca de 3 cifras): subir la versión en el archivo, actualizar el changelog y subirla a la rama `beta`.
- Solo se pasa a `main` cuando el propietario lo ordena. `main` es la versión pública aprobada (la publica GitHub Pages).
- Solo existen tres ramas: `main`, `beta` y `beta-anterior`. Al pasar a `main`, `main` = la `beta` actual y `beta-anterior` = la `main` que había antes.
- Los parámetros y reglas de cálculo viven en BRIAN (panel AVHUB ADMIN, `?accion=brian&app=SCREENS`); en el código solo su valor por defecto.
- **En cada versión, actualizar siempre el README**: descripción de la app, funciones, versión actual y los cambios de esa versión. Mantener también la licencia (GPL-3.0).
