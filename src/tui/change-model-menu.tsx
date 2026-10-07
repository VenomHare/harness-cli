import { Box, Text, useInput } from 'ink'
import { DEFAULT_MODEL, getModelDetails, SUPPORTED_MODELS } from '../lib/models'
import { useMemo, useState } from 'react';
import { log } from '../lib/config';
import type { Model } from '../types';

interface Params {
    provider: string,
    currentModel: Model,
    onSelect: (e: Model) => void
}
const MODELS_DISPLAY_LIMIT = 9;

const ChangeModelMenu = ({ provider, currentModel, onSelect }: Params) => {
    const models = SUPPORTED_MODELS[provider] ?? [{ id: "Not_Supported", is_free: false }];

    const [selectedIndex, setSelectedIndex] = useState(models.findIndex(m => m.id === currentModel.id) ?? 0);
    const [model, setModel] = useState<string>(currentModel.id ?? models[selectedIndex]?.id ?? DEFAULT_MODEL.id);

    useInput((_, key) => {
        if (key.upArrow) setSelectedIndex(s => Math.max(0, s - 1));
        if (key.downArrow) setSelectedIndex(s => Math.min(models.length - 1, s + 1))
        if (key.return) onSelect(getModelDetails(model, provider));
    })

    const displayModels = useMemo(() => {
        log(`Selected: ${selectedIndex} ${models.indexOf(currentModel)} ${currentModel}`);
        setModel(models[selectedIndex]?.id ?? DEFAULT_MODEL.id);
        const half = Math.ceil(MODELS_DISPLAY_LIMIT / 2);
        if (selectedIndex < half) {
            log(`2 | 0 ${MODELS_DISPLAY_LIMIT}`);
            return models.slice(0, MODELS_DISPLAY_LIMIT);
        }
        else if (selectedIndex < models.length - half - 1) {
            log(`2 | ${selectedIndex - half + 1} ${Math.min(selectedIndex + half, models.length - 1)}`);
            return models.slice(selectedIndex - half + 1, Math.min(selectedIndex + half, models.length - 1))
        }
        else {
            log(`3 | ${models.length - MODELS_DISPLAY_LIMIT}`);
            return models.slice(Math.max(models.length - MODELS_DISPLAY_LIMIT, 0));
        }
    }, [selectedIndex])

    return (
        <Box
            backgroundColor={"rgb(43, 43, 43)"}
            flexDirection='column'
            paddingTop={2}
            paddingX={1}
        >
            <Text bold> Select the model to use</Text>
            <Text color={"grey"}>Try /provider to change provider to access more models</Text>
            <Box flexDirection='column' flexWrap='nowrap' marginY={1} height={10}>
                {
                    displayModels.map((m, i) => <Box key={m.id} backgroundColor={model == m.id ? "rgb(255, 27, 11)" : "rgb(43, 43, 43)"}>
                        <Text color={model == m.id ? "whiteBright" : "white"}>
                            {model == m.id && "> "}
                            {m.id}
                        </Text>
                        {
                            m.is_free &&
                            <Text color={'grey'}>(FREE)</Text>
                        }
                    </Box>
                    )
                }
            </Box>
            <Text color={"rgb(138, 138, 138)"}>ENTER to Select | Up/Down Arrow to Change</Text>
        </Box>
    )
}

export default ChangeModelMenu