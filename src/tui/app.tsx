import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { useState } from "react"
import { v4 as uuid } from "uuid"
import { Loader } from "./Loader";
import type { ContentBlock, Message, Provider } from "../types";
import { COMMANDS, CommandsMenu } from "./CommandsMenu";
import { getConfig } from "../lib/config";
import { getProvider } from "../providers/main";
import { runAgent } from "../agent/main";
import { tools } from "../tools";
import { SYSTEM_PROMPT } from "../agent/system";
import Markdown from "@jescalan/ink-markdown";

console.clear();
const config = await getConfig();

export function App({ defaultPrompt, provider: arg_provider, model: arg_model }: { defaultPrompt?: string, provider: Provider, model?: string }) {
    const [prompt, setPrompt] = useState(defaultPrompt ?? "");
    const [loading, setLoading] = useState(false);

    const [provider, setProvider] = useState<Provider>(arg_provider ?? getProvider(config.provider));
    const [model, setModel] = useState(arg_model ?? config.model);
    const [messages, setMessages] = useState<Message[]>([]);
    const [commandsMenu, setCommandsMenu] = useState(false);

    useInput(async (_, key) => {
        if (key.return && prompt.trim() !== "" && !loading) {
            const cmd = prompt.split(" ")[0];
            if (prompt.startsWith("/") && COMMANDS.includes(cmd ?? "")) {
                if (cmd == "/exit") {
                    process.exit(0);
                }

            }
            setLoading(true)
            const appendedMessages: Message[] = [...messages, {
                role: "user",
                content: prompt
            }]
            setMessages(appendedMessages)
            setPrompt("")
            runAgent({
                provider,
                model,
                messages: appendedMessages,
                tools,
                system: SYSTEM_PROMPT,
                async onEvent(event) {
                    if (event.type === "message") {
                        setMessages((m) => [...m, event.message]);
                    }
                    else if (event.type == "tool_end") {
                        // setMessages((m) => [...m, {
                        //     role: "toolResult",
                        //     toolCallId: event.toolCall.id,
                        //     toolName: event.toolCall.name,
                        //     content: event.result,
                        //     isError: event.isError
                        // }])
                    }
                    else if (event.type == "turn_end") {

                    }
                    else if (event.type == "done") {
                        setLoading(false);
                        // console.log(event.message.usage);
                    }
                },
            })
        }
    })

    return (<>

        <Header />
        <Box flexDirection="column" gap={1}>
            {
                messages.map((m) => {
                    const key = uuid();
                    if (m.role == "user") {
                        return <Box backgroundColor={"rgb(45, 45, 45)"} key={key}>
                            <Text>{m.content}</Text>
                        </Box>
                    }

                    if (m.role === "assistant") {
                        let calls = [];
                        let text = "";
                        for (const c of m.content) {
                            if (c.type === "toolCall") {
                                calls.push(`${c.name} ${JSON.stringify(c.arguments)}`);
                            }
                            else {
                                text += c.text;
                            }
                        }

                        return <Box flexDirection="column" key={key}>
                            <Markdown>{text}</Markdown>
                            {
                                calls.map((c, i) => <>
                                    <Text color={"white"} key={`${c}-${i}`}>{c}</Text>
                                </>)
                            }
                        </Box>
                    }
                    // if (m.role === "toolResult") {
                        // return <Text color={m.isError ? "red" : "grey" } key={m.toolCallId || key}></Text>
                    // }
                    return <></>
                })


            }
        </Box>


        <Box height={2} ></Box >
        {loading && <Loader />}
        {commandsMenu && <CommandsMenu updatePrompt={setPrompt} closeMenu={() => setCommandsMenu(false)} />}
        <Box
            backgroundColor={"rgb(45, 45, 45)"}
            padding={1}
        >
            <Text>❯ </Text>
            <TextInput
                key={prompt}
                value={prompt}
                onChange={(e) => {
                    if (e.startsWith("/") && !e.endsWith(" ") && prompt.split(" ").length == 1) {
                        setCommandsMenu(true)
                    }
                    else {
                        setCommandsMenu(false)
                    }
                    setPrompt(e)
                }} />
        </Box>
        <Box justifyContent="space-between">
            <Box gap={1}>
                <Text color={"yellow"}>{provider.name}</Text>
                <Text color={"whiteBright"}>{model}</Text>
            </Box>
            <Text color={"cyan"}>{process.cwd()}</Text>
        </Box>
    </>)
}

function Header() {
    return (<>
        <Box marginTop={2} marginBottom={1} flexDirection="column">
            <Text color={"greenBright"} bold >Harness CLI</Text>
            <Text color={"cyan"}>{process.cwd().replace(process.env.HOME!, "~")}</Text>
        </Box>
    </>)
}
