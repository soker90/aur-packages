# Arch Linux AUR Package Updater

Repositorio automatizado usando **Renovate** y **GitHub Actions** para mantener paquetes de AUR actualizados, validados y publicados.

## 📦 Paquetes mantenidos

| Paquete | Detección de actualizaciones | AUR | Estado |
|---------|------------------------------|-----|--------|
| **toolhive-studio-bin** | Automática (GitHub Releases + Renovate) | [![AUR](https://img.shields.io/aur/version/toolhive-studio-bin)](https://aur.archlinux.org/packages/toolhive-studio-bin) | [![Renovate](https://github.com/soker90/aur-packages/workflows/Renovate/badge.svg)](https://github.com/soker90/aur-packages/actions/workflows/renovate.yml) |
| **github-copilot-app-bin** | Automática (GitHub Releases + Renovate) | [![AUR](https://img.shields.io/aur/version/github-copilot-app-bin)](https://aur.archlinux.org/packages/github-copilot-app-bin) | [![Renovate](https://github.com/soker90/aur-packages/workflows/Renovate/badge.svg)](https://github.com/soker90/aur-packages/actions/workflows/renovate.yml) |
| **vega-cli-bin** | Automática (detector del instalador oficial) | [![AUR](https://img.shields.io/aur/version/vega-cli-bin)](https://aur.archlinux.org/packages/vega-cli-bin) | [![Vega](https://github.com/soker90/aur-packages/actions/workflows/detect-vega.yml/badge.svg)](https://github.com/soker90/aur-packages/actions/workflows/detect-vega.yml) |

---

## 🔄 Flujo de actualización

Todos los cambios de paquetes pasan por el mismo pipeline de validación antes de publicarse en AUR.

### Renovate: ToolHive Studio y GitHub Copilot

1. **Detección**: Renovate se ejecuta cada 6 horas y revisa las releases de los proyectos upstream.
2. **Pull Request**: cuando hay una versión nueva, Renovate actualiza `pkgver` y crea un PR.
3. **Metadatos AUR**: un post-upgrade task ejecuta el refresco común de checksums y `.SRCINFO` dentro de Arch Linux.
4. **Validación**: el workflow `Validate Packages` comprueba cada paquete afectado con `namcap`, verifica las fuentes, regenera `.SRCINFO`, compila e instala el paquete.
5. **Automerge**: si las comprobaciones requeridas pasan, Renovate puede hacer squash-merge automáticamente.
6. **Publicación**: al llegar el cambio a `master`, `Update AUR Package` sincroniza `PKGBUILD` y `.SRCINFO` con el repositorio correspondiente de AUR.

### Detector de Vega CLI

`vega-cli-bin` no usa Renovate porque la versión y el artefacto se obtienen del instalador oficial de Vega.

1. **Detección**: `Detect Vega CLI` se ejecuta cada 6 horas y también puede lanzarse manualmente.
2. **Instalador oficial**: ejecuta el instalador en un entorno aislado y obtiene la versión y la URL exacta del artefacto.
3. **Validación de la detección**: el script exige una versión semántica válida y exactamente un artefacto Vega reconocible; si el formato upstream cambia, falla en lugar de generar una actualización incorrecta.
4. **Pull Request**: si hay una versión nueva, actualiza `PKGBUILD`, regenera `.SRCINFO` y crea/actualiza el PR.
5. **Validación y automerge**: el mismo workflow `Validate Packages` comprueba el PR y la actualización puede hacer squash-merge automáticamente.
6. **Publicación**: después del merge, `Update AUR Package` publica el paquete en AUR.

---

## 🧪 Validación de paquetes

`Validate Packages` es el workflow común para los paquetes modificados.

- En un PR o push normal, **solo valida los directorios de paquetes que contienen archivos modificados**.
- Cualquier archivo dentro del directorio de un paquete hace que ese paquete se valide, no solo cambios en `PKGBUILD` o `.SRCINFO`.
- Los cambios que solo afectan a la automatización o a otros archivos fuera de los directorios de paquetes no provocan validaciones innecesarias.
- Una ejecución manual de `Validate Packages` puede usar `--all` para validar explícitamente todos los paquetes.

Cada paquete seleccionado se comprueba con:

- `namcap` sobre el `PKGBUILD`
- disponibilidad y checksums de las fuentes mediante `makepkg --verifysource`
- consistencia de `.SRCINFO`
- compilación con `makepkg`
- `namcap` sobre el paquete generado
- instalación mediante `pacman -U`.

### Actualización manual de checksums

`Update Package Sums` sigue disponible para PRs manuales que cambien un `PKGBUILD` y necesiten recalcular automáticamente los checksums y `.SRCINFO`.

Este workflow no sustituye a `Validate Packages`: uno **actualiza metadatos**, mientras el otro **valida el paquete**.

---

## 🔐 Publicación en AUR

`Update AUR Package` se ejecuta después de cambios en `master` que afecten a `PKGBUILD` o `.SRCINFO`. Detecta los paquetes modificados y sincroniza sus archivos con AUR.

Para publicar automáticamente se necesitan estos repository secrets en *Settings → Secrets and variables → Actions*:

- `RENOVATE_TOKEN`: token utilizado por Renovate y por las automatizaciones que necesitan crear o actualizar PRs.
- `AUR_SSH_PRIVATE_KEY`: clave SSH cuya pública está registrada en la cuenta de AUR para publicar los paquetes.

---

## 🛠️ Actualización manual

```bash
cd nombre-del-paquete/

# Editar PKGBUILD
vim PKGBUILD

# Regenerar .SRCINFO
makepkg --printsrcinfo > .SRCINFO

# Subir los cambios
git add PKGBUILD .SRCINFO
git commit -m "Update nombre-del-paquete to version X.Y.Z"
git push origin master
```

Para cambios de fuentes o checksums puedes ejecutar `Update Package Sums` manualmente desde GitHub Actions.

**Importante**: los cambios publicados en el repositorio deben mantener sincronizados `PKGBUILD` y `.SRCINFO`.

El pipeline se encargará de validar el paquete y, una vez integrado en `master`, publicarlo automáticamente en AUR.

---

## 📚 Documentación de mantenimiento

La guía completa para mantener y ampliar la automatización está en [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md). Incluye la arquitectura del sistema, cómo añadir paquetes, el funcionamiento de los conectores de actualización, la validación, el automerge y la publicación en AUR.

Si vas a modificar la automatización del repositorio, consulta esa guía antes de hacer cambios.
