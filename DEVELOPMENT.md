# Development Environment Setup

This project supports multiple development environments and package managers for maximum flexibility.

## Quick Start

### Option 1: Using Devbox (Recommended)

[Devbox](https://www.jetify.com/devbox) provides a reproducible development environment with all dependencies.

```bash
# Install devbox (if not already installed)
curl -fsSL https://get.jetify.com/devbox | bash

# Enter devbox shell
devbox shell

# Initialize PostgreSQL (first time only)
devbox run db:init

# Install dependencies
devbox run setup

# Run tests
devbox run test

# Start development server
devbox run dev
```

### Option 2: Using Your Preferred Runtime

Set the `RUNTIME` environment variable to use your preferred package manager:

```bash
# Using Bun (fastest)
RUNTIME=bun npm install
RUNTIME=bun npm run build
RUNTIME=bun npm test

# Using pnpm
RUNTIME=pnpm npm install
RUNTIME=pnpm npm run build
RUNTIME=pnpm npm test

# Using Yarn
RUNTIME=yarn npm install
RUNTIME=yarn npm run build

# Using npm (default)
npm install
npm run build
npm test
```

### Option 3: Using the Runtime Wrapper Script

```bash
# Make the script executable (first time only)
chmod +x scripts/run

# Use it like your package manager
RUNTIME=bun ./scripts/run install
RUNTIME=bun ./scripts/run build
RUNTIME=pnpm ./scripts/run test

# Set RUNTIME in your shell to avoid repeating it
export RUNTIME=bun
./scripts/run install
./scripts/run build
./scripts/run test
```

---

## Runtime Selection

### Environment Variables

| Variable | Description | Default | Valid Values |
|----------|-------------|---------|--------------|
| `RUNTIME` | Package manager to use | `npm` | `npm`, `pnpm`, `yarn`, `bun` |
| `NODE_ENV` | Node environment | `development` | `development`, `test`, `production` |
| `PSYCHIC_FRAMEWORK` | HTTP framework | `express` | `express`, `hono` |

### How It Works

The `RUNTIME` environment variable is checked in this order:

1. Explicitly set: `RUNTIME=bun npm run build`
2. Shell export: `export RUNTIME=bun`
3. `.envrc` file (if using direnv)
4. `devbox.json` env section
5. Default to `npm`

### Setting Permanent Runtime Preference

#### Using direnv (Recommended)

```bash
# Install direnv
# macOS: brew install direnv
# Linux: apt-get install direnv

# Enable direnv in your shell (~/.bashrc or ~/.zshrc)
eval "$(direnv hook bash)"  # or zsh

# Allow direnv for this project
cd /path/to/psychic
direnv allow

# Edit .envrc to set your preferred runtime
echo 'export RUNTIME=bun' >> .envrc
direnv allow
```

#### Using Shell Profile

Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`:

```bash
# Set default runtime for Psychic development
export RUNTIME=bun
```

#### Using Devbox

Edit `devbox.json`:

```json
{
  "env": {
    "RUNTIME": "bun"
  }
}
```

---

## Package Manager Comparison

| Feature | npm | pnpm | yarn | bun |
|---------|-----|------|------|-----|
| Speed | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Disk Usage | High | Low | Medium | Medium |
| Workspace Support | ✅ | ✅ | ✅ | ✅ |
| Lock File | package-lock.json | pnpm-lock.yaml | yarn.lock | bun.lockb |
| Built-in Runtime | ❌ | ❌ | ❌ | ✅ (JS/TS) |

### Recommendations

- **Development (local)**: Use **Bun** for fastest iteration
- **CI/CD**: Use **pnpm** for consistent, fast builds
- **Production**: Either npm or pnpm (most stable)
- **Team**: Use **npm** if you want universal compatibility

---

## Available Scripts

All scripts work with any package manager via `RUNTIME` env var:

```bash
# Build
npm run build              # Build both CJS and ESM
npm run build:test-app     # Build test application

# Test
npm run uspec              # Run unit tests
npm run fspec              # Run feature tests

# Development
npm run dev                # Start development server with hot reload
npm run console            # Start REPL console

# Code Quality
npm run lint               # Lint TypeScript files
npm run format             # Format code with Prettier

# CLI Tools
npm run psy                # Run Psychic CLI (test env)
npm run psyts              # Run Psychic CLI (TypeScript)
npm run gpsy               # Run global Psychic CLI
```

### Using Different Runtimes

```bash
# Same command, different runtimes
RUNTIME=npm npm run build
RUNTIME=pnpm npm run build
RUNTIME=yarn npm run build
RUNTIME=bun npm run build

# Or export once
export RUNTIME=bun
npm run build
npm run test
npm run dev
```

---

## Database Setup

### Using Devbox (PostgreSQL included)

```bash
devbox shell
devbox run db:init       # Initialize PostgreSQL
devbox run db:start      # Start PostgreSQL
devbox run db:stop       # Stop PostgreSQL
```

PostgreSQL data is stored in `.devbox/postgres/` (gitignored).

### Manual PostgreSQL Setup

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb psychic_test

# Linux
sudo apt-get install postgresql-16
sudo systemctl start postgresql
sudo -u postgres createdb psychic_test

# Verify
psql psychic_test -c "SELECT version();"
```

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/psychic_test

# Node
NODE_ENV=test

# Runtime
RUNTIME=bun

# Framework
PSYCHIC_FRAMEWORK=express  # or 'hono'
```

---

## Framework Selection

Psychic supports multiple HTTP frameworks via the adapter pattern.

### Express (Default)

```bash
# No configuration needed - Express is the default
npm run build
npm run dev
```

### Hono (High Performance)

```bash
# Set framework via environment variable
PSYCHIC_FRAMEWORK=hono npm run dev

# Or in .env
echo 'PSYCHIC_FRAMEWORK=hono' >> .env

# Performance: 6.3x faster than Express!
# Express: ~60,000 req/sec
# Hono:    ~380,000 req/sec (on Bun runtime)
```

### Framework + Runtime Combinations

```bash
# Express + npm (traditional, widely supported)
RUNTIME=npm PSYCHIC_FRAMEWORK=express npm run dev

# Express + Bun (faster execution)
RUNTIME=bun PSYCHIC_FRAMEWORK=express npm run dev

# Hono + Bun (maximum performance 🚀)
RUNTIME=bun PSYCHIC_FRAMEWORK=hono npm run dev

# Hono + Node (still fast, more compatible)
RUNTIME=npm PSYCHIC_FRAMEWORK=hono npm run dev
```

---

## IDE Setup

### VS Code

Recommended extensions:

- **ESLint** - `dbaeumer.vscode-eslint`
- **Prettier** - `esbenp.prettier-vscode`
- **TypeScript Vue Plugin** - `Vue.volar`
- **Devbox** - `jetpack-io.devbox`

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["typescript", "javascript"],
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```

### Cursor / Windsurf

Same as VS Code. These editors are VS Code-based and use the same extensions.

---

## Troubleshooting

### "Command not found" errors

Make sure your chosen runtime is installed:

```bash
# Check what's installed
command -v npm && echo "npm: $(npm --version)"
command -v pnpm && echo "pnpm: $(pnpm --version)"
command -v yarn && echo "yarn: $(yarn --version)"
command -v bun && echo "bun: $(bun --version)"

# Install missing runtimes
npm install -g pnpm        # Install pnpm
npm install -g yarn        # Install yarn
curl -fsSL https://bun.sh/install | bash  # Install bun
```

### PostgreSQL connection errors

```bash
# Check if PostgreSQL is running
pg_isready

# If using devbox
devbox run db:start

# Check connection
psql psychic_test -c "SELECT 1;"
```

### TypeScript errors after switching runtimes

```bash
# Clean and rebuild
rm -rf node_modules dist
RUNTIME=bun npm install  # Use your preferred runtime
npm run build
```

### Lock file conflicts

Different package managers create different lock files. Git ignore them:

```bash
# .gitignore already includes:
package-lock.json  # npm
pnpm-lock.yaml     # pnpm
yarn.lock          # yarn
bun.lockb          # bun
```

Choose ONE package manager for your team to avoid conflicts.

---

## Contributing

When contributing to this project:

1. **Use any runtime you prefer** for local development
2. **Don't commit lock files** (they're gitignored)
3. **Test with multiple runtimes** if changing dependencies
4. **Update this doc** if adding new scripts or features

---

## Resources

- **Devbox Documentation**: https://www.jetify.com/docs/devbox
- **Bun Documentation**: https://bun.sh/docs
- **pnpm Documentation**: https://pnpm.io
- **Hono Documentation**: https://hono.dev
- **Psychic Framework**: See main [README.md](./README.md)

---

## Quick Reference

```bash
# Development workflow
devbox shell                    # Enter dev environment
devbox run db:init              # First time: setup database
devbox run setup                # Install dependencies
devbox run dev                  # Start dev server

# Or without devbox
export RUNTIME=bun              # Choose your runtime
npm install                     # Install deps
npm run build                   # Build project
npm run test                    # Run tests
npm run dev                     # Start dev server

# Framework switching
PSYCHIC_FRAMEWORK=hono npm run dev     # Use Hono
PSYCHIC_FRAMEWORK=express npm run dev  # Use Express (default)

# Runtime switching
RUNTIME=bun npm run build       # Use Bun
RUNTIME=pnpm npm run build      # Use pnpm
RUNTIME=npm npm run build       # Use npm (default)
```
