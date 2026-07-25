# Arch Linux AUR Package Updater

Repositorio automatizado para mantener actualizado el paquete `toolhive-studio-bin` en AUR.

## 📦 Paquete

| Paquete | Versión | AUR | Estado |
|---------|---------|-----|--------|
| toolhive-studio-bin | [![AUR version](https://img.shields.io/aur/version/toolhive-studio-bin)](https://aur.archlinux.org/packages/toolhive-studio-bin) | [![AUR](https://aur.archlinux.org/packages/toolhive-studio-bin)](https://aur.archlinux.org/packages/toolhive-studio-bin) | [![Renovate](https://github.com/soker90/paquetes-archinux/workflows/Renovate/badge.svg)](https://github.com/soker90/paquetes-archinux/actions/workflows/renovate.yml) |

## 🔄 Funcionamiento

Este repositorio utiliza **Renovate** y **GitHub Actions** para automatizar la actualización del paquete en AUR:

1. **Renovate** revisa cada 6 horas si hay nuevas versiones del proyecto [stacklok/toolhive-studio](https://github.com/stacklok/toolhive-studio)
2. Cuando detecta una nueva versión, crea automáticamente un Pull Request actualizando:
   - `pkgver` en el PKGBUILD
   - `sha256sums` con el checksum del nuevo paquete
3. El workflow de validación verifica que el PKGBUILD sea correcto
4. Al hacer merge del PR, el workflow `update-aur` sube automáticamente los cambios a AUR

## 🛠️ Configuración

### Secrets necesarios en GitHub

Para que la automatización funcione, necesitas configurar estos secrets en tu repositorio:

- `RENOVATE_TOKEN`: Personal Access Token de GitHub con permisos de `repo` y `workflow`
- `AUR_SSH_PRIVATE_KEY`: Tu clave SSH privada para autenticarte en AUR

### Añadir tu clave SSH a AUR

1. Genera una clave SSH si no tienes una:
   ```bash
   ssh-keygen -t ed25519 -C "tu@email.com"
   ```

2. Añade la clave pública a tu cuenta de AUR:
   - Ve a https://aur.archlinux.org/account/
   - Sección "My Account" → "SSH Public Key"
   - Pega el contenido de `~/.ssh/id_ed25519.pub`

3. Añade la clave privada como secret en GitHub:
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `AUR_SSH_PRIVATE_KEY`
   - Value: contenido de `~/.ssh/id_ed25519`

### Configurar Renovate Token

1. Crea un Personal Access Token en GitHub:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Genera un token con scopes: `repo`, `workflow`

2. Añádelo como secret:
   - Name: `RENOVATE_TOKEN`
   - Value: tu token

## 📝 Mantenimiento Manual

Si necesitas actualizar manualmente:

```bash
cd toolhive-studio-bin
# Edita PKGBUILD con la nueva versión
makepkg --printsrcinfo > .SRCINFO
git add PKGBUILD .SRCINFO
git commit -m "Update to version X.Y.Z"
git push
```

El workflow `update-aur` se ejecutará automáticamente y subirá los cambios a AUR.

## 📖 Basado en

Este proyecto está inspirado en [Arch-Linux-AUR-Packages-Updater](https://github.com/JasonLandbridge/Arch-Linux-AUR-Packages-Updater) de JasonLandbridge.

## 📄 Licencia

Apache 2.0
