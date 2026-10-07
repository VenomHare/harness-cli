import { Box, Text, useInput } from 'ink'
import { DEFAULT_MODEL, getModelDetails, SUPPORTED_MODELS, SUPPORTED_PROVIDERS } from '../lib/models'
import { useMemo, useState } from 'react';
import { log } from '../lib/config';

interface Params {
    currentProvider: string,
    onSelect: (e: string) => void
}
const PROVIDERS_DISPLAY_LIMIT = 9;

const ChangeProviderMenu = ({ currentProvider, onSelect }: Params) => {
    const providers = SUPPORTED_PROVIDERS ?? ["Not_Supported"];

    const [selectedIndex, setSelectedIndex] = useState(providers?.indexOf(currentProvider) ?? 0);
    const [provider, setProvider] = useState(currentProvider);

    useInput((_, key) => {
        if (key.upArrow) setSelectedIndex(s => Math.max(0, s - 1));
        if (key.downArrow) setSelectedIndex(s => Math.min(providers.length - 1, s + 1))
        if (key.return) onSelect(provider);
    })

    const displayProviders = useMemo(() => {
        setProvider(providers[selectedIndex] ?? DEFAULT_MODEL.provider);
        const half = Math.ceil(PROVIDERS_DISPLAY_LIMIT / 2);
        if (selectedIndex < half) {
            log(`1 | 0 ${PROVIDERS_DISPLAY_LIMIT}`)
            return providers.slice(0, PROVIDERS_DISPLAY_LIMIT);
        }
        else if (selectedIndex < providers.length - half - 1) {
            log(`2 | 0 ${selectedIndex - half + 1} ${Math.min(selectedIndex + half, providers.length - 1)}`);
            return providers.slice(selectedIndex - half + 1, Math.min(selectedIndex + half, providers.length - 1))
        }
        else {
            log(`3 | ${providers.length - PROVIDERS_DISPLAY_LIMIT}`);
            return providers.slice(Math.max(providers.length - PROVIDERS_DISPLAY_LIMIT, 0));
        }
    }, [selectedIndex])

    return (
        <Box
            backgroundColor={"rgb(43, 43, 43)"}
            flexDirection='column'
            paddingTop={2}
            paddingX={1}
        >
            <Text bold> Select the Provider</Text>
            <Text color={"grey"}>Add Provider API Key in .env as <>{"{{PROVIDER_NAME}}_API_KEY"} variable</></Text>
            <Box flexDirection='column' flexWrap='nowrap' marginY={1} height={5}>
                {
                    displayProviders.map((p) => <Box key={p} backgroundColor={provider == p ? "rgb(255, 27, 11)" : "rgb(43, 43, 43)"}>
                        <Text color={provider == p ? "whiteBright" : "white"}>
                            {provider == p && "> "}
                            {p}
                        </Text>
                    </Box>
                    )
                }
            </Box>
            <Text color={"rgb(138, 138, 138)"}>ENTER to Select | Up/Down Arrow to Change</Text>
        </Box>
    )
}

export default ChangeProviderMenu