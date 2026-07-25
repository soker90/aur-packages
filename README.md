# Arch Linux AUR Package Updater

Repositorio automatizado usando **Renovate** y **GitHub Actions** para monitorear y actualizar automáticamente paquetes de AUR.

## 📦 Paquetes Mantenidos

| Paquete | Tipo de Actualización | AUR | Estado |
|---------|-----------------------|-----|--------|
| **toolhive-studio-bin** | Automática (GitHub Releases) | [![AUR](https://img.shields.io/aur/version/toolhive-studio-bin)](https://aur.archlinux.org/packages/toolhive-studio-bin) | [![Renovate](https://github.com/soker90/aur-packages/workflows/Renovate/badge.svg)](https://github.com/soker90/aur-packages/actions/workflows/renovate.yml) |
| **github-copilot-app-bin** | Automática (GitHub Releases) | [![AUR](https://img.shields.io/aur/version/github-copilot-app-bin)](https://aur.archlinux.org/packages/github-copilot-app-bin) | [![Renovate](https://github.com/soker90/aur-packages/workflows/Renovate/badge.svg)](https://github.com/soker90/aur-packages/actions/workflows/renovate.yml) |
| **vega-cli-bin** | Manual (CDN de Amazon) | [![AUR](https://img.shields.io/aur/version/vega-cli-bin)](https://aur.archlinux.org/packages/vega-cli-bin) | [![Renovate](https://github.com/soker90/aur-packages/workflows/Renovate/badge.svg)](https://github.com/soker90/aur-packages/actions/workflows/renovate.yml) |

---

## 🔄 Tipos de Actualizaciones y Funcionamiento

### 1. Paquetes 100% Automáticos (`toolhive-studio-bin`, `github-copilot-app-bin`)
Estos paquetes se actualizan automáticamente utilizando el siguiente flujo:
1. **Monitoreo**: Cada 6 horas, **Renovate** revisa el repositorio upstream en GitHub (`stacklok/toolhive-studio` y `github/app`) para detectar nuevas versiones.
2. **Creación de Pull Request**: Si encuentra un nuevo tag o release upstream, Renovate crea un PR actualizando la variable `pkgver` en el `PKGBUILD`.
3. **Cálculo de Checksums**: GitHub Actions activa el workflow `Update Package Sums` que corre `updpkgsums` y `.SRCINFO` en un contenedor Arch Linux para actualizar las firmas SHA256 automáticamente y sube el commit al PR.
4. **Verificación**: Un contenedor Arch Linux compila y testea el paquete (`Build and Test Packages`) e instala el software con `pacman -U` para comprobar que funciona correctamente.
5. **Merge y Publicación**: Al hacer merge del PR, el workflow `Update AUR Package` empuja los cambios directamente al repositorio de AUR.

#### ⚙️ Requisitos para el funcionamiento automático:
Para que las actualizaciones automáticas se publiquen sin intervención, el repositorio de GitHub necesita estos dos **repository secrets** configurados en *Settings -> Secrets and variables -> Actions*:
- `RENOVATE_TOKEN`: Personal Access Token (classic) con scopes `repo` y `workflow` para que Renovate pueda crear los PRs.
- `AUR_SSH_PRIVATE_KEY`: Clave SSH privada específica (`aur-bot@github-actions`) cuya versión pública está registrada en tu cuenta de AUR para poder subir los commits mediante SSH.

---

### 2. Paquetes Manuales (`vega-cli-bin`)
Algunos paquetes no pueden automatizarse con Renovate porque las urls de origen son dinámicas o propietarias. Por ejemplo, `vega-cli-bin` descarga sus recursos directamente del CDN de Amazon Web Services (`kepler-static-artifacts.kepler.labcollab.net`), el cual no ofrece una API de releases estables como GitHub.

Para estos casos, la actualización se hace de la siguiente manera:
1. Editas el `PKGBUILD` localmente con la nueva versión y el checksum descargado.
2. Haces commit y push de tus cambios a la rama `master`.
3. El workflow en GitHub Actions detecta el cambio, ejecuta las pruebas de compilación/instalación e inmediatamente empuja la actualización a AUR sin necesidad de que hagas commits manuales en el entorno ssh.aur.

#### 💡 ¿Para qué sirve tenerlos en este repositorio si son manuales?
- **Validación Automática**: En cada cambio manual, GitHub Actions compilará el paquete en un contenedor Arch Linux limpio y verificará que el `PKGBUILD` pase los checks de `namcap` e instalación, detectando errores de dependencias de empaquetado antes de subirlos a producción.
- **Centralización**: Tienes la receta de todos tus paquetes AUR en un mismo sitio centralizado.
- **Pipeline de Despliegue (CD)**: El workflow gestionará de forma transparente tus credenciales del bot de AUR y la subida de los cambios a `aur.archlinux.org` tras el commit, eliminando la necesidad de gestionar comandos SSH en múltiples terminales locales.

---

## 🛠️ Mantenimiento Manual

Si necesitas desplegar una corrección rápida en cualquiera de los paquetes, basta con hacer lo siguiente en tu máquina local:

```bash
# Cambiar al directorio del paquete
cd github-copilot-app-bin/

# Editar PKGBUILD...

# Generar archivo .SRCINFO con makepkg
# (Asegúrate de estar en tu sistema Arch o tener instalado base-devel)
makepkg --printsrcinfo > .SRCINFO

# Subir al repositorio
git add PKGBUILD .SRCINFO
git commit -m "Fix: manual correction for github-copilot-app-bin"
git push origin master
```

El pipeline de GitHub Actions se encargará de validar la compilación y propagar los cambios a AUR automáticamente.
