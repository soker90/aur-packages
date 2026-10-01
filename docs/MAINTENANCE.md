# Guía de mantenimiento y automatización

Esta guía explica cómo funciona el repositorio, cómo se actualiza un paquete y cómo incorporar una nueva fuente de actualizaciones ("conector", detector o integración).

## 1. Arquitectura

El repositorio separa cuatro responsabilidades:

1. **Detección de actualizaciones**: descubre que upstream tiene una versión nueva.
2. **Preparación del paquete**: actualiza \`PKGBUILD\`, checksums y \`.SRCINFO\`.
3. **Validación**: comprueba que el paquete sigue siendo correcto y construible.
4. **Publicación**: después del merge en \`master\`, sincroniza el paquete con AUR.

Flujo normal:

\`\`\`
Upstream
   │
   ├── Renovate ───────────────┐
   │                           │
   └── Detector/conector ─────┤
                               ▼
                         Pull Request
                               │
                               ▼
                     Validate Packages
                               │
                         checks OK
                               │
                               ▼
                           Automerge
                               │
                               ▼
                             master
                               │
                               ▼
                       Update AUR Package
                               │
                               ▼
                              AUR
\`\`\`

### Componentes principales

| Componente | Responsabilidad |
|---|---|
| \`renovate.json\` | Configura Renovate y el automerge |
| \`.github/workflows/renovate.yml\` | Ejecuta Renovate cada 6 horas/manual |
| \`.github/workflows/detect-vega.yml\` | Ejemplo de detector externo de un upstream que Renovate no puede consultar directamente |
| \`scripts/detect-packages.mjs\` | Descubre paquetes y detecta cuáles han cambiado |
| \`.github/scripts/aur-refresh-metadata.sh\` | Actualiza checksums y \`.SRCINFO\` dentro de Arch Linux |
| \`scripts/renovate-update-aur-metadata.sh\` | Adaptador de Renovate al actualizador común de metadatos |
| \`.github/scripts/validate-package.sh\` | Validación completa de un paquete |
| \`.github/workflows/validate-packages.yml\` | Ejecuta la validación solo para los paquetes afectados |
| \`.github/scripts/create-automation-pr.sh\` | Crea/actualiza una PR automática y solicita squash-automerge |
| \`.github/workflows/updpkgsums.yml\` | Actualización manual de checksums y \`.SRCINFO\` para PRs normales |
| \`.github/workflows/update-aur.yml\` | Publica los cambios de \`master\` en AUR |

## 2. Añadir un paquete nuevo

Un paquete es un directorio de primer nivel que contiene un archivo \`PKGBUILD\`.

Ejemplo:

\`\`\`text
aur-packages/
├── github-copilot-app-bin/
│   ├── PKGBUILD
│   └── .SRCINFO
├── toolhive-studio-bin/
│   ├── PKGBUILD
│   └── .SRCINFO
└── mi-paquete-bin/
    ├── PKGBUILD
    └── .SRCINFO
\`\`\`

### Crear y validar

\`\`\`bash
mkdir mi-paquete-bin
cd mi-paquete-bin
\`\`\`

Crea un \`PKGBUILD\` válido y genera:

\`\`\`bash
makepkg --printsrcinfo > .SRCINFO
\`\`\`

No edites \`.SRCINFO\` manualmente.

Validación local recomendada:

\`\`\`bash
namcap PKGBUILD
makepkg --verifysource
makepkg --printsrcinfo > .SRCINFO.generated
diff -u .SRCINFO .SRCINFO.generated
makepkg -sf --noconfirm
\`\`\`

Debe existir también un repositorio AUR con el mismo nombre. \`Update AUR Package\` copiará allí \`PKGBUILD\` y \`.SRCINFO\`. La clave de \`AUR_SSH_PRIVATE_KEY\` debe tener permiso para publicar.

Añade el paquete a la tabla de \`README.md\` y documenta su mecanismo de actualización.

## 3. Detección de paquetes

\`scripts/detect-packages.mjs\` es la fuente de verdad para descubrir paquetes. Un directorio de primer nivel es paquete si contiene \`PKGBUILD\`.

En PRs y pushes compara dos commits:

\`\`\`bash
node scripts/detect-packages.mjs <base-sha> <head-sha>
\`\`\`

Cualquier archivo modificado dentro de un directorio de paquete selecciona ese paquete. Por ejemplo, cambiar \`foo.patch\` dentro de \`mi-paquete-bin/\` también valida \`mi-paquete-bin\`.

Los cambios fuera de directorios de paquetes no seleccionan paquetes.

Para validar todo explícitamente:

\`\`\`bash
node scripts/detect-packages.mjs --all
\`\`\`

## 4. Añadir un conector/detector

Hay dos modelos.

### A. Renovate

Úsalo cuando upstream se puede representar con un manager de Renovate, especialmente GitHub Releases.

Actualmente se usa para \`stacklok/toolhive-studio\` y \`github/app\`.

Para añadir otro paquete:

1. Añade el patrón del \`PKGBUILD\` a \`renovate.json\`.
2. Comprueba que Renovate detecta correctamente la versión.
3. Si los checksums no pueden tratarse como digest normal, usa el \`postUpgradeTasks\` existente.
4. Asegúrate de que el comando está permitido por \`RENOVATE_ALLOWED_COMMANDS\`.
5. Limita \`fileFilters\` a los archivos que el task puede modificar.
6. Ejecuta Renovate y revisa la PR generada.

El comando común de metadatos es:

\`\`\`bash
bash scripts/renovate-update-aur-metadata.sh <paquete>/PKGBUILD
\`\`\`

Ese script delega en \`.github/scripts/aur-refresh-metadata.sh\`.

### B. Detector personalizado

Úsalo cuando upstream no sea compatible con Renovate o cuando la versión solo pueda descubrirse ejecutando una herramienta/instalador.

\`vega-cli-bin\` es el ejemplo de referencia.

Estructura recomendada:

\`\`\`text
scripts/detect-mi-software.sh
.github/workflows/detect-mi-software.yml
\`\`\`

El detector debe obtener la información de una fuente oficial, validar la versión, identificar el artefacto exacto y su checksum y **fallar en lugar de adivinar** si cambia el formato upstream.

El detector de Vega produce:

\`\`\`text
version=...
url=...
sha256=...
\`\`\`

El workflow debe ejecutarse desde \`master\`, mediante schedule y \`workflow_dispatch\`, comprobar si hay actualización, modificar \`PKGBUILD\`, regenerar \`.SRCINFO\` y crear/actualizar la PR.

Para crear y actualizar PRs automáticas debe reutilizar:

\`\`\`text
.github/scripts/create-automation-pr.sh
\`\`\`

No dupliques la lógica de \`gh pr create\`, búsqueda de PR o \`gh pr merge --auto --squash\` en cada conector.

## 5. Checklist de un nuevo conector

- [ ] Fuente oficial y reproducible.
- [ ] Falla si cambia el formato esperado.
- [ ] Versión con formato válido.
- [ ] Artefacto correcto para la arquitectura.
- [ ] Checksum del artefacto correcto.
- [ ] Solo modifica el paquete correspondiente.
- [ ] Regenera \`.SRCINFO\`.
- [ ] Reutiliza \`create-automation-pr.sh\`.
- [ ] La PR pasa \`Validate Packages\`.
- [ ] La rama automática tiene un nombre estable.
- [ ] El workflow tiene solo los permisos necesarios.
- [ ] El cambio llega a \`master\` antes de publicar en AUR.
- [ ] \`Update AUR Package\` detecta correctamente el paquete.

## 6. Validación

El flujo común es:

\`\`\`text
Validate Packages
        │
        ▼
detect-packages.mjs
        │
        ├── paquete A ──► validate-package.sh
        ├── paquete B ──► validate-package.sh
        └── paquete C ──► validate-package.sh
\`\`\`

Cada paquete pasa por:

1. \`namcap PKGBUILD\`
2. \`makepkg --verifysource\`
3. regeneración y comparación de \`.SRCINFO\`
4. \`makepkg -sf\`
5. \`namcap\` del artefacto
6. instalación mediante \`pacman -U\`

La validación se ejecuta dentro de \`archlinux:latest\`.

## 7. Checksums y .SRCINFO

La implementación común es \`.github/scripts/aur-refresh-metadata.sh\`.

Hace:

1. comprobación de las fuentes GitHub Release;
2. \`updpkgsums\` con reintentos;
3. \`makepkg --nobuild --nodeps --verifysource\` con reintentos;
4. regeneración de \`.SRCINFO\`.

Los reintentos cubren la ventana en la que una release ya existe pero sus assets todavía se están publicando.

## 8. Automerge

### Renovate

\`renovate.json\` configura:

\`\`\`json
"automerge": true,
"automergeType": "pr",
"platformAutomerge": false
\`\`\`

Renovate crea la PR y solicita automerge cuando se cumplen sus condiciones.

### Detectores personalizados

Usan \`.github/scripts/create-automation-pr.sh\`. El helper configura Git, publica/actualiza la rama, busca la PR existente, la crea o actualiza y solicita \`gh pr merge --auto --squash\`.

La validación debe actuar como barrera antes del merge.

## 9. Publicación en AUR

Solo \`master\` publica automáticamente.

\`Update AUR Package\` detecta los paquetes modificados, prepara SSH, clona el repositorio AUR, copia \`PKGBUILD\` y \`.SRCINFO\`, crea un commit si hay cambios y hace push.

Secretos:

- \`RENOVATE_TOKEN\`: Renovate y automatizaciones que crean/actualizan PRs.
- \`AUR_SSH_PRIVATE_KEY\`: publicación en AUR.

## 10. Cambios en la automatización

Si modificas \`detect-packages.mjs\`, cualquiera de los scripts comunes, un detector o sus workflows, comprueba siempre:

1. cambios normales de un paquete;
2. cambios en cualquier archivo dentro del paquete;
3. cambios fuera de paquetes;
4. ejecución manual con \`--all\`;
5. actualización de una PR automática existente;
6. validación como barrera del automerge;
7. publicación posterior en AUR.

Evita cambiar detección, validación, automerge y publicación simultáneamente salvo que sea necesario.

## 11. Receta rápida

### Paquete con GitHub Releases

\`\`\`text
1. Crear <paquete>/PKGBUILD
2. Generar .SRCINFO
3. Validar localmente
4. Crear el paquete en AUR
5. Añadirlo a Renovate
6. Documentarlo
7. PR → Validate Packages → merge
8. Update AUR Package → AUR
\`\`\`

### Paquete con detector personalizado

\`\`\`text
1. Crear <paquete>/PKGBUILD
2. Crear detector en scripts/
3. Crear workflow detect-<nombre>.yml
4. Reutilizar aur-refresh-metadata.sh
5. Reutilizar create-automation-pr.sh
6. Incluir el workflow en los paths de Validate Packages
7. Documentarlo
8. Probar detección sin actualización
9. Probar una actualización real
10. Validate Packages → automerge → master → AUR
\`\`\`

## 12. Principios de diseño

- **Una implementación por responsabilidad.**
- **Los paquetes se descubren automáticamente.**
- **La validación es común para cualquier origen.**
- **Los detectores no deben adivinar.**
- **Los metadatos AUR se generan con herramientas Arch.**
- **Las PR automáticas usan el helper común.**
- **Solo \`master\` publica en AUR.**
- **Los cambios normales validan únicamente paquetes afectados.**
- **Las ejecuciones manuales pueden usar \`--all\`.**
- **No se debe saltar la validación para conseguir automerge.**
- **Los workflows deben tener los permisos mínimos necesarios.**

Esta separación permite añadir nuevos paquetes y nuevas fuentes de actualización sin duplicar toda la infraestructura.
