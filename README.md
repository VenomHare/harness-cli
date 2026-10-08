# Harness CLI

An interactive terminal AI agent built with [Ink](https://github.com/vadimdemedes/ink).

## How to Use

### 1. Direct Binary Install from [Release Page](https://github.com/VenomHare/harness-cli/releases) (Easiest way)

Download the binary for your platform from the [Release Page](https://github.com/VenomHare/harness-cli/releases), then in your terminal:

```bash
cd downloaded-folder && ./harness-linux-x64
```

Replace `harness-linux-x64` with the downloaded binary name (e.g. `harness-darwin-arm64`, `harness-windows-x64.exe`).

No dependencies required.

### 2. Install using Bun

Bun is required for this method. Install it first if you don't have it:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then clone and run:

```bash
bun add -g @venomhare/harness-cli
harness
```

## Configuration

The CLI stores per-provider API keys locally in `~/.harness-cli/secrets.json` (created with `0600` permissions on first run). You will be prompted for the API key on first launch via the interactive TUI, or you can pre-seed it:

```bash
echo '{ "openai": "sk-..." }' > ~/.harness-cli/secrets.json
chmod 600 ~/.harness-cli/secrets.json
```

### OS-specific notes

- **Linux**: Make sure your download is `chmod +x`'d before running, e.g. `chmod +x harness-linux-x64 && ./harness-linux-x64`. If the binary was downloaded from outside the `PATH` directory, `chmod +x` is required before first use.
- **macOS (Apple Silicon / Intel)**: To suppress Gatekeeper warnings for the downloaded binary on first run, remove the quarantine attribute:
  ```bash
  xattr -d com.apple.quarantine harness-darwin-arm64
  ```
  (use the matching `darwin-x64` binary for Intel Macs)
- **Windows**: 
  - **Important**: Install Bun using the official installer (`powershell -c "irm bun.sh/install.ps1|iex"`), **not** via npm (`npm install -g bun`). The npm-installed version is a PowerShell script and will not work with npm-generated CLI wrappers.
  - For the direct `.exe` download, run it from a directory where you have write permission or select **Yes** if SmartScreen prompts you.

### Building from source

```bash
git clone https://github.com/VenomHare/harness-cli
cd harness-cli
bun install
bun run build:binary:all   # or build:binary for current platform
```

### [MIT License](./LICENSE)