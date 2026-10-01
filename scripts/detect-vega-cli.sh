#!/usr/bin/env bash
set -euo pipefail

installer_url="https://sdk-installer.vega.labcollab.net/get_vvm.sh"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

installer="$work_dir/get_vvm.sh"
log_file="$work_dir/curl.log"
home_dir="$work_dir/home"
mkdir -p "$home_dir" "$work_dir/bin"

curl -fsSL --retry 3 --retry-all-errors "$installer_url" -o "$installer"
chmod 700 "$installer"

cat > "$work_dir/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$VEGA_CURL_LOG"
exec /usr/bin/curl "$@"
EOF
chmod 700 "$work_dir/bin/curl"

export HOME="$home_dir"
export PATH="$work_dir/bin:$PATH"
export VEGA_CURL_LOG="$log_file"
export NONINTERACTIVE=true
export SKIP_SDK_INSTALL=true

bash "$installer" >/dev/null

vega_bin="$HOME/vega/bin/vega"
if [[ ! -x "$vega_bin" ]]; then
  echo "Vega CLI was not installed by the official installer" >&2
  exit 1
fi

version="$("$vega_bin" --version | sed -n 's/^Vega CLI Version: //p' | head -n1)"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Unable to determine Vega CLI version" >&2
  "$vega_bin" --version >&2 || true
  exit 1
fi

mapfile -t artifact_urls < <(
  grep -Eo 'https://kepler-static-artifacts\.kepler\.labcollab\.net/[0-9a-f]{2}/[0-9a-f]{64}' "$log_file" |
    sort -u
)

if (( ${#artifact_urls[@]} != 1 )); then
  echo "Expected exactly one Vega CLI artifact URL, found ${#artifact_urls[@]}" >&2
  printf '%s\n' "${artifact_urls[@]}" >&2
  exit 1
fi

artifact_url="${artifact_urls[0]}"
sha256="${artifact_url##*/}"

printf 'version=%s\n' "$version"
printf 'url=%s\n' "$artifact_url"
printf 'sha256=%s\n' "$sha256"
