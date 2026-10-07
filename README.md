# Harness CLI

Harness is an interactive terminal AI agent built with Ink.

## Requirements

- [Bun](https://bun.sh/) 1.4 or newer
- An API key for OpenAI, Groq, OpenRouter, or Anthropic

## Install

```bash
npm install -g @venomhare/harness-cli
```

The package exposes the `harness` command:

```bash
harness
harness --prompt "Explain this repository"
harness --provider openai --model gpt-6-luna
```

## Configuration

On first launch, Harness asks you to choose a provider and enter its API key. The key is masked while entering and saved locally in `~/.harness-cli/secrets.json` with restricted file permissions. Keys are kept per provider, so switching to a provider you have already connected does not ask again.

Harness does not load API keys from `.env` files.

## Development

```bash
bun install
bun run dev
```

Validate the package before releasing it:

```bash
bun run verify
npm pack --dry-run
```

`prepack` runs the same verification automatically for `npm pack` and `npm publish`.

## Publish

```bash
npm login
npm publish --access public
```

The scoped package requires `--access public` on its first publish.

## License

MIT
