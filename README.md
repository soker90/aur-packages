# Arch Linux AUR Package Updater

Repositorio automatizado usando **aur-maintainer** y **GitHub Actions** para mantener paquetes de AUR actualizados, validados y publicados.

## 📦 Paquetes mantenidos

| Paquete | Detección de actualizaciones | AUR |
|---------|------------------------------|-----|
| **toolhive-studio-bin** | GitHub Releases + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/toolhive-studio-bin) |
| **github-copilot-app-bin** | GitHub Releases + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/github-copilot-app-bin) |
| **qt-sudo** | GitHub Releases + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/qt-sudo) |
| **vega-cli-bin** | Conector personalizado + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/vega-cli-bin) |

## 🔄 Flujo de actualización

El workflow **AUR Maintainer** se ejecuta cada 6 horas y también puede lanzarse manualmente. Su responsabilidad es únicamente invocar `soker90/aur-maintainer`.

La Action descubre los paquetes configurados, consulta upstream, actualiza `PKGBUILD` y sus metadatos, regenera `.SRCINFO` y checksums, valida el paquete, crea la rama `update/...`, crea o actualiza la PR y solicita squash-automerge cuando está habilitado.

Después del merge en `master`, **AUR Maintainer** vuelve a invocar la misma Action en modo `aur-publish-only`. El workflow también permite seleccionar manualmente el modo `publish`.

## 🧪 Validación

La validación del `PKGBUILD` forma parte del pipeline de `aur-maintainer`. El repositorio consumidor no mantiene un workflow de validación separado.

## 🔐 Publicación en AUR

Secrets necesarios:

- `RENOVATE_TOKEN`: token utilizado por `aur-maintainer` para crear o actualizar PRs.
- `AUR_SSH_PRIVATE_KEY`: clave SSH cuya pública está registrada en la cuenta de AUR.

La publicación solo se produce desde `master`. `aur-maintainer` sincroniza `PKGBUILD`, `.SRCINFO` y los archivos adicionales necesarios con el repositorio AUR.

## 🛠️ Añadir un paquete

1. Crear el directorio con su `PKGBUILD` y `.SRCINFO`.
2. Añadirlo a `.aur-maintainer.yml`.
3. Elegir un connector integrado o añadir únicamente el código necesario para un custom connector dentro del propio paquete.
4. Crear el repositorio correspondiente en AUR.
5. Documentar el paquete aquí.

La guía completa está en [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).
