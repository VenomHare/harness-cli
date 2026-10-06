import React, { useEffect, useState } from "react";
import { Box, Text, render } from "ink";

const frames = [
  ["█", "▄", "▂"],
  ["▄", "█", "▂"],
  ["▂", "▄", "█"],
  ["▄", "█", "▂"],
];

export function Loader() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % frames.length);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box gap={1}>
      {frames[frame]!.map((square, index) => (
        <Text key={index}>{square}</Text>
      ))}
    </Box>
  );
}
