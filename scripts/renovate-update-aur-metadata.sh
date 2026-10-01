#!/usr/bin/env bash

set -euo pipefail

package_file="${1:-}"

if [[ -z "$package_file" ]]; then
  echo "Usage: $0 <PKGBUILD>" >&2
  exit 2
fi

if [[ ! "$package_file" =~ ^[A-Za-z0-9._/-]+/PKGBUILD$ ]]; then
  echo "Unsupported package file: $package_file" >&2
  exit 2
fi

if [[ ! -f "$package_file" ]]; then
  echo "PKGBUILD not found: $package_file" >&2
  exit 2
fi

docker run --rm \
  -v "$PWD:/workspace" \
  archlinux:latest \
  bash -c "
    set -e
    pacman -Syu --noconfirm --needed base-devel pacman-contrib git sudo

    useradd -m builder
    echo 'builder ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers
    chown -R builder:builder /workspace

    cd /workspace
    sudo -u builder bash .github/scripts/aur-refresh-metadata.sh '$package_file'
  "
