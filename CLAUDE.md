# Reglas de trabajo con Claude en este repositorio

- Responder siempre en español.
- Cambios estrictamente los solicitados: no tocar estructura, estética ni otros aspectos que no se pidan.
- Los datos salen siempre en vivo del catálogo del panel AVHUB ADMIN (Drive), nunca de datos de muestra o locales. La hoja de Google Sheets está desconectada desde la v10.63. El catálogo se mantiene desde el panel (CRM, tarifas en Excel y la sincronización de las 4:00); en especificaciones manda lo publicado en la web y los PDF en línea de traulux.net y charmex.net.
- Cada petición genera una versión nueva: subir la versión en el archivo, actualizar el changelog y subirla a una rama `v4.x`.
- Solo se pasa a `main` cuando el propietario lo ordena. `main` es la versión pública aprobada.
- Mantener solo `main` y las 2 ramas de versión más recientes; borrar el resto.
- **En cada versión, actualizar siempre el README**: descripción de la app, funciones, versión actual y los cambios de esa versión. Mantener también la licencia (GPL-3.0).
