# Harness CLI

Harness is an interactive terminal AI agent built with Ink.

## Installation

Option 1: Bun package manager

```bash
bun add -g @venomhare/harness-cli
```

Option 2: GitHub releases (direct download)

1. Download the prebuilt binary for your platform from the [GitHub releases page](https://github.com/VenomHare/harness-cli/releases):
   - `harness-linux-x64` — Linux x64
   - `harness-darwin-arm64` — macOS Apple Silicon
   - `harness-darwin-x64` — macOS Intel
   - `harness-windows-x64.exe` — Windows x64
2. Make it executable (Linux/macOS):
   ```bash
   chmod +x harness-linux-x64
   ```
3. Move it to a directory on your `PATH`, e.g.:
   ```bash
   sudo mv harness-linux-x64 /usr/local/bin/harness
   ```

## Configuration

The CLI stores per-provider API keys locally in `~/.harness-cli/secrets.json` (created with `0600` permissions on first run). You will be prompted for the API key on first launch via the interactive TUI, or you can pre-seed it:

```bash
echo '{ "openai": "sk-..." }' > ~/.harness-cli/secrets.json
chmod 600 ~/.harness-cli/secrets.json
```

## Usage

```bash
# Start interactive session
harness

# Run with an initial prompt
harness -p "Fix the failing test in src/foo.ts"

# Select a provider / model
harness --provider openai --model gpt-4o
```

### OS-specific notes

- **Linux**: Make sure your download is `chmod +x`'d before running, e.g. `chmod +x harness-linux-x64 && ./harness-linux-x64`. If the binary was downloaded from outside the `PATH` directory, `chmod +x` is required before first use.
- **macOS (Apple Silicon / Intel)**: To suppress Gatekeeper warnings for the downloaded binary on first run, remove the quarantine attribute:
  ```bash
  xattr -d com.apple.quarantine harness-darwin-arm64
  ```
  (use the matching `darwin-x64` binary for Intel Macs)
- **Windows**: No extra step needed for `bun add -g` installs. For the direct `.exe` download, run it from a directory where you have write permission or select **Yes** if SmartScreen prompts you.

### Building from source

```bash
git clone https://github.com/VenomHare/harness-cli
cd harness-cli
bun install
bun run build:binary:all   # or build:binary for current platform
```

