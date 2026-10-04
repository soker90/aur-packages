# Arch Linux AUR Package Updater

Repositorio automatizado usando **aur-maintainer** y **GitHub Actions** para mantener paquetes de AUR actualizados, validados y publicados.

## 📦 Paquetes mantenidos

| Paquete | Detección de actualizaciones | AUR |
|---------|------------------------------|-----|
| **toolhive-studio-bin** | GitHub Releases + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/toolhive-studio-bin) |
| **github-copilot-app-bin** | GitHub Releases + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/github-copilot-app-bin) |
| **vega-cli-bin** | Conector personalizado + `aur-maintainer` | [AUR](https://aur.archlinux.org/packages/vega-cli-bin) |

## 🔄 Flujo de actualización

El workflow **Update Packages** se ejecuta cada 6 horas y también puede lanzarse manualmente. Su responsabilidad es únicamente invocar `soker90/aur-maintainer@v1`.

El Action descubre los paquetes configurados, consulta upstream, actualiza `PKGBUILD` y sus metadatos, regenera `.SRCINFO` y checksums, valida el paquete, crea o actualiza la PR y solicita squash-automerge cuando está habilitado.

Después del merge en `master`, **Update AUR Package** vuelve a invocar el mismo Action en modo `aur-publish-only`. El workflow también puede ejecutarse manualmente y publica todos los paquetes configurados; no existe selección manual por paquete.

## 🧪 Validación

`Validate Packages` sigue siendo la barrera de CI para cambios de paquetes. Comprueba `namcap`, fuentes y checksums, consistencia de `.SRCINFO`, compilación, artefactos e instalación mediante `pacman -U`.

La actualización automática ya no necesita un workflow separado para recalcular checksums: `aur-maintainer` lo hace durante su propio pipeline.

## 🔐 Publicación en AUR

Secrets necesarios:

- `RENOVATE_TOKEN`: token utilizado por `aur-maintainer` para crear o actualizar PRs.
- `AUR_SSH_PRIVATE_KEY`: clave SSH cuya pública está registrada en la cuenta de AUR.

La publicación solo se produce desde `master`. `aur-maintainer` sincroniza `PKGBUILD`, `.SRCINFO` y los archivos adicionales necesarios con el repositorio AUR.

## 🛠️ Añadir un paquete

1. Crear el directorio con su `PKGBUILD` y `.SRCINFO`.
2. Añadirlo a `.aur-maintainer.yml`.
3. Crear `update.yml` con el conector correspondiente.
4. Si es necesario, añadir un conector personalizado dentro del propio paquete.
5. Crear el repositorio correspondiente en AUR.
6. Documentar el paquete aquí.

La guía completa está en [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).
