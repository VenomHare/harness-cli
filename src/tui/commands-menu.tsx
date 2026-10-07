import { Box, Text, useInput } from "ink";
import React, { useState } from "react";

export const COMMANDS = ["/model", "/provider", "/exit"]

export function CommandsMenu({ updatePrompt, closeMenu }: {
    updatePrompt: React.Dispatch<React.SetStateAction<string>>,
    closeMenu: () => void
}) {

    const [selectedIndex, setSelectedIndex] = useState(0)

    useInput((_, key) => {
        if (key.upArrow) {
            setSelectedIndex(Math.max(selectedIndex - 1, 0))
        }
        if (key.downArrow) {
            setSelectedIndex(Math.min(selectedIndex + 1, COMMANDS.length - 1))
        }
        if (key.tab) {
            updatePrompt(p => COMMANDS[selectedIndex] ?? p);
            closeMenu();
        }
    })

    return (<Box backgroundColor={"rgb(65, 65, 65)"} flexDirection="column">
        {
            COMMANDS.map((c, i) => <Box paddingX={2} backgroundColor={selectedIndex == i ? "rgb(255, 27, 11)" : undefined} key={c + i}>
                <Text color={selectedIndex === i ? "whiteBright" : "grey"}>{c}</Text>
            </Box>)
        }
    </Box>)
}