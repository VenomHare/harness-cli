import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";

interface ApiKeyInputProps {
  provider: string;
  onSubmit: (apiKey: string) => void;
}

export default function ApiKeyInput({ provider, onSubmit }: ApiKeyInputProps) {
  const [value, setValue] = useState("");

  return (
    <Box backgroundColor="rgb(43, 43, 43)" flexDirection="column" padding={1}>
      <Text bold>Connect {provider}</Text>
      <Text color="grey">Enter your API key. It will be stored locally and never shown.</Text>
      <Box marginTop={1}>
        <Text color="cyan">Key › </Text>
        <TextInput
          value={value}
          onChange={setValue}
          mask="•"
          placeholder="paste key, then press Enter"
          onSubmit={onSubmit}
        />
      </Box>
    </Box>
  );
}
