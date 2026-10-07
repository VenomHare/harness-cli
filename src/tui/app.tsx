import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import { useMemo, useState } from "react"
import { v4 as uuid } from "uuid"
import { Loader } from "./loader";
import type { AssistantMessage, ContentBlock, Message, Model, Provider, Usage } from "../types";
import { COMMANDS, CommandsMenu } from "./commands-menu";
import { getConfig, log, saveConfig } from "../lib/config";
import { getProvider } from "../providers/main";
import { runAgent } from "../agent/main";
import { tools } from "../tools";
import { SYSTEM_PROMPT } from "../agent/system";
import Markdown from "@jescalan/ink-markdown";
import ChangeModelMenu from "./change-model-menu";
import { getModelDetails } from "../lib/models";
import ChangeProviderMenu from "./change-provider-menu";

console.clear();
const config = await getConfig();
const cwd = process.cwd().replace(process.env.HOME!, "~");

export function App({ defaultPrompt, provider: arg_provider, model: arg_model }: { defaultPrompt?: string, provider?: string, model?: string }) {
    const [prompt, setPrompt] = useState(defaultPrompt ?? "");
    const [loading, setLoading] = useState(false);
    const modelDetails = useMemo(() => getModelDetails(arg_model ?? config.model, arg_provider ?? config.provider), [arg_model, config.model, config.provider, arg_provider]);

    const [provider, setProvider] = useState<Provider>(getProvider(modelDetails.provider));
    const [model, setModel] = useState<Model>(modelDetails);

    const [usage, setUsage] = useState<Usage>({ input: 0, output: 0 });

    const [providerChangeMenuOpen, setProviderChangeMenuOpen] = useState(false);
    const [modelChangeMenuOpen, setModelChangeMenuOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [commandsMenu, setCommandsMenu] = useState(false);

    useInput(async (_, key) => {
        if (key.return && prompt.trim() !== "" && !loading) {
            const cmd = prompt.split(" ")[0]?.toLowerCase();
            if (prompt.startsWith("/") && COMMANDS.includes(cmd ?? "")) {
                if (cmd == "/exit") {
                    process.exit(0);
                }
                else if (cmd == "/model") {
                    setModelChangeMenuOpen(true)
                    setCommandsMenu(false);
                    setPrompt("");
                }
                else if (cmd == "/provider") {
                    setProviderChangeMenuOpen(true)
                    setCommandsMenu(false);
                    setPrompt("");
                }
                return
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
                model: model.id,
                messages: appendedMessages,
                tools,
                system: SYSTEM_PROMPT,
                async onEvent(event) {
                    if (event.type === "message") {
                        if (event.message.role === "assistant") {
                            const msg: AssistantMessage = event.message;
                            log("msg :: " +JSON.stringify(msg.usage));
                            setUsage(u => ({
                                output: u.output + msg.usage.output,
                                input: u.input + msg.usage.input,
                            }))
                        }
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
                        log(JSON.stringify(event.message.usage));
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
                                    <Text color={"white"} key={`${c} - ${i}`}>{c}</Text>
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

        {
            !modelChangeMenuOpen && !providerChangeMenuOpen && <>
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
                        <Text color={"yellowBright"}>{provider.name}</Text>
                        <Text color={"whiteBright"}>{model.id}</Text>
                        {
                            model.is_free &&
                            <Text color={"grey"}>(FREE)</Text>
                        }
                    </Box>
                    <Box gap={2}>
                        {
                            usage.input !== 0 &&
                            <Text dimColor>Usage: {usage.input + usage.output}({usage.input}/{usage.output})</Text>
                        }
                        <Text color={"cyan"}>{cwd}</Text>
                    </Box>
                </Box>
            </>
        }
        {
            modelChangeMenuOpen &&
            <ChangeModelMenu
                provider={provider.name}
                currentModel={model}
                onSelect={(model) => {
                    setModel(model);
                    saveConfig({ model: model.id })
                    setModelChangeMenuOpen(false);
                }}
            />
        }
        {
            providerChangeMenuOpen &&
            <ChangeProviderMenu
                currentProvider={provider.name}
                onSelect={(p) => {
                    setProvider(getProvider(p));
                    saveConfig({ provider: p });
                    setModelChangeMenuOpen(true);
                    setProviderChangeMenuOpen(false);
                }}
            />
        }
    </>)
}

function Header() {
    return (<>
        <Box marginTop={2} marginBottom={1} flexDirection="column">
            <Text color={"greenBright"} bold >Harness CLI</Text>
            <Text color={"cyan"}>{cwd}</Text>
        </Box>
    </>)
}
