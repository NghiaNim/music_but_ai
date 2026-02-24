import OpenAI from "openai";

import type { EventContext } from "./prompts";
import {
  buildDiscoverySystemPrompt,
  buildLearningSystemPrompt,
} from "./prompts";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DiscoveryConciergeInput {
  messages: ChatMessage[];
  events: EventContext[];
  userExperience: string;
  apiKey: string;
}

export interface LearningConciergeInput {
  messages: ChatMessage[];
  event: EventContext;
  userExperience: string;
  apiKey: string;
}

function createClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function* streamDiscoveryResponse(
  input: DiscoveryConciergeInput,
): AsyncGenerator<string> {
  const client = createClient(input.apiKey);
  const systemPrompt = buildDiscoverySystemPrompt(
    input.events,
    input.userExperience,
  );

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...input.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

export async function* streamLearningResponse(
  input: LearningConciergeInput,
): AsyncGenerator<string> {
  const client = createClient(input.apiKey);
  const systemPrompt = buildLearningSystemPrompt(
    input.event,
    input.userExperience,
  );

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...input.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

export async function generateBeginnerNotes(
  event: EventContext,
  apiKey: string,
): Promise<string> {
  const client = createClient(apiKey);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 512,
    messages: [
      {
        role: "system",
        content:
          "You generate concise, beginner-friendly notes for classical music events. Write in a warm, encouraging tone.",
      },
      {
        role: "user",
        content: `Generate beginner notes for this event. Include:
1. A one-sentence "what this is" context
2. Three things to listen for during the performance
3. One fun fact about the program or composer

Event: ${event.title}
Program: ${event.program}
Description: ${event.description}
Genre: ${event.genre}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
