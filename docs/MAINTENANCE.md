# Guía de mantenimiento y automatización

Este repositorio usa `soker90/aur-maintainer` como motor común para detectar
actualizaciones, preparar paquetes, validarlos, crear PRs y publicar en AUR.

## 1. Arquitectura

El flujo normal es:

```text
Upstream
   │
   ▼
AUR Maintainer
   ├── detectar actualización
   ├── actualizar PKGBUILD/metadatos
   ├── regenerar .SRCINFO
   ├── validar
   └── crear PR update/<paquete>
            │
            ▼
         automerge
            │
            ▼
          master
            │
            ▼
       aur-publish-only
            │
            ▼
           AUR
```

La lógica de actualización, validación y publicación vive en `aur-maintainer`.
Este repositorio solo aporta configuración, `PKGBUILD` y código específico de
custom connectors.

## 2. Workflow

`.github/workflows/aur-maintainer.yml` es únicamente un wrapper de GitHub
Actions. Ejecuta `aur-maintainer` de forma programada o manual.

El modo `maintain` detecta actualizaciones, modifica los paquetes, valida el
resultado y crea PRs. El modo `publish` publica los paquetes en AUR. Tras una
PR fusionada en `master`, la publicación se ejecuta automáticamente.

No debe existir lógica de detección de paquetes, matrices de validación ni
scripts de actualización en este repositorio.

## 3. Configuración de paquetes

La configuración general está en `.aur-maintainer.yml` y cada entrada declara
la ruta y el connector que debe utilizar:

```yaml
packages:
  - path: github-copilot-app-bin
    connector: github-release
    config:
      repository: github/app
    updates: {}

  - path: toolhive-studio-bin
    connector: github-release
    config:
      repository: stacklok/toolhive-studio
    updates: {}

  - path: vega-cli-bin
    connector: custom
    config: {}
    updates:
      source: 'source=("vega-${version}-linux-x86_64.tar.gz::${source}")'
      sha256: '_sha256=${sha256}'
```

Los paquetes no necesitan `update.yml`. Un custom connector puede conservar
su implementación específica dentro del directorio del paquete, por ejemplo
`vega-cli-bin/connector/detect.sh`.

## 4. Añadir un paquete

1. Crear el directorio con `PKGBUILD` y `.SRCINFO`.
2. Crear el repositorio correspondiente en AUR.
3. Añadir el paquete a `.aur-maintainer.yml`.
4. Elegir un connector integrado o añadir un custom connector solo cuando sea
   necesario.
5. Documentarlo en `README.md`.

## 5. Validación

`aur-maintainer` valida los paquetes durante el proceso de actualización. La
validación incluye `namcap`, fuentes y checksums, consistencia de `.SRCINFO`,
compilación, artefactos e instalación mediante `pacman -U`.

No existe un workflow de validación paralelo en `aur-packages`: así evitamos
duplicar la lógica y mantenemos una única implementación.

## 6. Automerge

`aur-maintainer` crea o actualiza la PR y solicita automerge con método squash
cuando `auto-merge` está habilitado. La validación de la Action debe seguir
siendo una barrera antes del merge.

## 7. Publicación en AUR

Solo `master` publica automáticamente.

La publicación delega directamente en `aur-maintainer` con
`aur-publish-only: true`.

Secrets necesarios:

- `RENOVATE_TOKEN`: token utilizado para crear o actualizar PRs.
- `AUR_SSH_PRIVATE_KEY`: clave SSH cuya pública está registrada en AUR.

## 8. Principios de diseño

- `aur-maintainer` es la fuente común de la lógica de mantenimiento.
- `aur-packages` es declarativo.
- No duplicar detección ni validación de paquetes.
- Los paquetes declaran su connector mediante configuración.
- Los custom connectors son la única lógica específica permitida.
- Solo `master` publica en AUR.

El objetivo es poder añadir un paquete nuevo mediante configuración y los
archivos propios del paquete, sin crear infraestructura de CI específica.