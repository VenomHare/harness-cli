#!/usr/bin/env bun

import { config } from 'dotenv'
import { parseArgs } from 'node:util'
import { render } from 'ink';
import { App } from './tui/app';

// Load .env from the directory in which the user runs `harness`.
config({ quiet: true });

const { values } = parseArgs({
    options: {
        "prompt": { type: "string", short: "p" },
        "model": { type: "string", short: "m" },
        "provider": { type: "string" }
    },
})

render(<App defaultPrompt={values.prompt} provider={values.provider} model={values.model} />)