#!/usr/bin/env bash
set -euo pipefail

package_dir="${1:-}"

if [[ -z "$package_dir" ]]; then
  echo "Usage: $0 <package-directory>" >&2
  exit 2
fi

if [[ ! "$package_dir" =~ ^[A-Za-z0-9._/-]+$ || "$package_dir" == .* || "$package_dir" == */.* || ! -f "$package_dir/PKGBUILD" ]]; then
  echo "Unsupported package directory: $package_dir" >&2
  exit 2
fi

docker run --rm \
  -v "$PWD/$package_dir:/pkg" \
  archlinux:latest \
  bash -c '
    set -euo pipefail

    pacman -Syu --noconfirm --needed base-devel namcap sudo

    useradd -m builder
    echo "builder ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
    chown -R builder:builder /pkg
    cd /pkg

    echo "==> Validating PKGBUILD with namcap"
    sudo -u builder namcap PKGBUILD

    echo "==> Verifying sources and checksums"
    sudo -u builder makepkg --verifysource

    echo "==> Verifying .SRCINFO is synchronized"
    sudo -u builder makepkg --printsrcinfo > .SRCINFO.generated
    diff -u .SRCINFO .SRCINFO.generated
    rm .SRCINFO.generated

    echo "==> Building package"
    sudo -u builder makepkg -sf --noconfirm

    packages=( *.pkg.tar.* )
    if [[ ! -e "${packages[0]}" ]]; then
      echo "No package artifact was produced" >&2
      exit 1
    fi

    echo "==> Validating built package(s)"
    for package in "${packages[@]}"; do
      namcap "$package"
      echo "Package built successfully: $package"
      ls -lh "$package"
    done

    echo "==> Testing package installation"
    pacman -U --noconfirm "${packages[@]}"

    echo "==> Package validation successful"
  '

sudo chown -R "$(id -u):$(id -g)" "$package_dir"
