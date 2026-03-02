import OpenAI from "openai";

export const ONBOARDING_QUESTIONS = [
  "What kind of music do you like?",
] as const;

const ONBOARDING_SYSTEM_PROMPT = `You are the Classica onboarding assistant — a warm, enthusiastic guide welcoming someone new.

You are having a quick voice conversation. Keep responses SHORT (1-2 sentences max) and conversational. Sound natural, like you're chatting with a friend.

Give a warm acknowledgment of their answer. Don't repeat what they said back verbatim.`;

export interface OnboardingReplyInput {
  questionIndex: number;
  userAnswer: string;
  previousAnswers: string[];
  apiKey: string;
}

export async function generateOnboardingReply(
  input: OnboardingReplyInput,
): Promise<string> {
  const client = new OpenAI({ apiKey: input.apiKey });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: ONBOARDING_SYSTEM_PROMPT },
  ];

  messages.push({
    role: "assistant",
    content: ONBOARDING_QUESTIONS[0]!,
  });
  messages.push({ role: "user", content: input.userAnswer });

  messages.push({
    role: "system",
    content:
      "The user just told you what music they like. Give a warm 1-sentence acknowledgment, then say something like 'Now let me play you some music — I want to see what catches your ear.' Keep it brief and excited.",
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 150,
    temperature: 0.8,
    messages,
  });

  return response.choices[0]?.message?.content ?? "";
}

export function computeExperienceLevel(
  answers: string[],
  ratings: { easy: number; medium: number; hard: number },
): "new" | "casual" | "enthusiast" {
  const avgRating = (ratings.easy + ratings.medium + ratings.hard) / 3;

  const answer = (answers[0] ?? "").toLowerCase();
  const mentionsClassical =
    answer.includes("classical") ||
    answer.includes("orchestra") ||
    answer.includes("symphony") ||
    answer.includes("opera") ||
    answer.includes("chamber") ||
    answer.includes("piano concerto");

  if (avgRating >= 7 && mentionsClassical) return "enthusiast";
  if (avgRating >= 4 || mentionsClassical) return "casual";
  return "new";
}
