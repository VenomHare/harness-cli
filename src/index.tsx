#!/usr/bin/env bun

import { parseArgs } from 'node:util'
import { render } from 'ink';
import { App } from './tui/app';

const { values } = parseArgs({
    options: {
        "prompt": { type: "string", short: "p" },
        "model": { type: "string", short: "m" },
        "provider": { type: "string" }
    },
})

render(<App defaultPrompt={values.prompt} provider={values.provider} model={values.model} />)
