# Guía de mantenimiento y automatización

Este repositorio usa `soker90/aur-maintainer@v1` como motor común para detectar actualizaciones, preparar paquetes, validarlos, crear PRs y publicar en AUR.

## 1. Arquitectura

El flujo normal es:

```
Upstream
   │
   ▼
Update Packages
   │  cada 6 horas
   ▼
aur-maintainer
   ├── detectar actualización
   ├── actualizar PKGBUILD/metadatos
   ├── regenerar .SRCINFO
   ├── validar
   └── crear/actualizar PR
            │
            ▼
       Validate Packages
            │
            ▼
          automerge
            │
            ▼
          master
            │
            ▼
      Update AUR Package
            │
            ▼
           AUR
```

La lógica de actualización y publicación debe vivir en `aur-maintainer`. Los workflows de este repositorio son únicamente integración con GitHub Actions, credenciales y eventos.

## 2. Workflows

### Update Packages

`.github/workflows/update-packages.yml` se ejecuta:

- cada 6 horas;
- mediante `workflow_dispatch`.

Su responsabilidad es invocar `aur-maintainer@v1` con el token de GitHub, la rama de actualización y `auto-merge`.

No debe contener lógica de detección, matrices de paquetes ni scripts específicos.

### Validate Packages

`.github/workflows/validate-packages.yml` actúa como barrera de CI para cambios de paquetes, incluidos cambios manuales.

Detecta los paquetes afectados y ejecuta la validación dentro de Arch Linux.

### Update AUR Package

`.github/workflows/update-aur.yml` se ejecuta cuando una PR dirigida a `master` se cierra y cuando se lanza manualmente.

En ambos casos invoca `aur-maintainer@v1` con `aur-publish-only: true`. La ejecución manual publica todos los paquetes configurados.

El workflow no debe detectar paquetes ni generar configuraciones temporales.

## 3. Configuración de paquetes

La configuración general está en `.aur-maintainer.yml`:

```yaml
packages:
  - github-copilot-app-bin
  - toolhive-studio-bin
  - vega-cli-bin
```

Cada paquete declara su conector en `update.yml`.

Para GitHub Releases:

```yaml
connector: github-release
config:
  repository: owner/repository
updates: {}
```

Para un conector personalizado:

```yaml
connector: custom
config: {}
updates:
  source: 'source=("...")'
  sha256: '_sha256=...'
```

Los conectores personalizados viven dentro del propio paquete y deben obtener información de una fuente oficial, validar la respuesta y fallar ante formatos inesperados.

## 4. Añadir un paquete

1. Crear el directorio con `PKGBUILD` y `.SRCINFO`.
2. Crear el repositorio correspondiente en AUR.
3. Añadir el paquete a `.aur-maintainer.yml`.
4. Añadir su `update.yml`.
5. Añadir un conector personalizado solo cuando los conectores integrados no sean suficientes.
6. Documentarlo en `README.md`.

No se debe crear un workflow específico para un paquete salvo que exista una necesidad que no pueda encapsularse en `aur-maintainer`.

## 5. Validación

`aur-maintainer` regenera checksums y `.SRCINFO` durante una actualización y valida el paquete antes de crear o actualizar la PR.

La validación comprueba:

1. `namcap PKGBUILD`;
2. `makepkg --verifysource`;
3. consistencia de `.SRCINFO`;
4. compilación con `makepkg`;
5. `namcap` de los artefactos;
6. instalación mediante `pacman -U`.

`Validate Packages` mantiene además una barrera de CI independiente para cambios que lleguen al repositorio por otras vías.

## 6. Automerge

El workflow de actualización habilita `auto-merge: true`.

`aur-maintainer` crea o actualiza la PR y solicita automerge con método squash. La validación de CI debe seguir siendo una barrera antes del merge.

## 7. Publicación en AUR

Solo `master` publica automáticamente.

`Update AUR Package` delega directamente en `aur-maintainer@v1` con `aur-publish-only: true`.

El Action:

- prepara un checkout temporal del repositorio AUR;
- sincroniza `PKGBUILD`, `.SRCINFO` y los archivos necesarios;
- comprueba si existen cambios;
- crea el commit solo cuando hay cambios;
- hace push a `master`.

La clave SSH y los known hosts son las únicas credenciales específicas que necesita el workflow de publicación.

## 8. Principios de diseño

- Una implementación por responsabilidad.
- `aur-maintainer` es la fuente común de la lógica de actualización y publicación.
- Los workflows de `aur-packages` deben ser finos.
- No duplicar detección de paquetes en workflows.
- No crear matrices de publicación innecesarias.
- Los paquetes declaran su conector mediante configuración.
- Solo `master` publica en AUR.
- La validación no se debe saltar para conseguir automerge.
- Los workflows deben usar los permisos mínimos necesarios.

El objetivo es poder añadir un paquete nuevo mediante configuración y archivos del propio paquete, sin crear infraestructura de CI específica para él.
