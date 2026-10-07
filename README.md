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

Harness loads a `.env` file from the directory where you run it. Create one with the key for the provider you use:

```dotenv
OPENAI_API_KEY=your_key_here
# GROQ_API_KEY=your_key_here
# OPENROUTER_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
```

Do not commit this file.

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
