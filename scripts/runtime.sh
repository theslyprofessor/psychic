#!/usr/bin/env bash
# Runtime detection helper - sources into shell scripts
# Usage: source scripts/runtime.sh && $PKG install

# Detect and set package manager based on RUNTIME env var
detect_pkg_manager() {
  local runtime="${RUNTIME:-npm}"
  
  case "$runtime" in
    bun)
      if command -v bun &> /dev/null; then
        echo "bun"
      else
        echo "npm"  # Fallback
      fi
      ;;
    pnpm)
      if command -v pnpm &> /dev/null; then
        echo "pnpm"
      else
        echo "npm"  # Fallback
      fi
      ;;
    yarn)
      if command -v yarn &> /dev/null; then
        echo "yarn"
      else
        echo "npm"  # Fallback
      fi
      ;;
    *)
      echo "npm"
      ;;
  esac
}

# Export for use in scripts
export PKG="${PKG:-$(detect_pkg_manager)}"

# Map common commands to runtime-specific equivalents
pkg_exec() {
  case "$PKG" in
    bun) bunx "$@" ;;
    pnpm) pnpm exec "$@" ;;
    yarn) yarn exec "$@" ;;
    *) npx "$@" ;;
  esac
}

# Export function for subshells
export -f pkg_exec
