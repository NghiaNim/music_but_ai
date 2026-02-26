import OpenAI from "openai";

export const ONBOARDING_QUESTIONS = [
  "What kind of music do you usually listen to? It can be anything — pop, jazz, film scores, whatever you love.",
  "Have you ever been to a live performance — a concert, a musical, or anything like that? How was the experience?",
  "When you listen to music, what matters most to you — the melody, the rhythm, the emotions it brings out, or something else entirely?",
] as const;

const ONBOARDING_SYSTEM_PROMPT = `You are the Classical Music Connect onboarding assistant — a warm, enthusiastic guide welcoming someone new.

You are having a quick voice conversation. Keep responses SHORT (1-2 sentences max) and conversational. Sound natural, like you're chatting with a friend.

After each user answer, give a brief warm acknowledgment and naturally transition to the next question. Don't repeat what they said back to them verbatim.`;

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

  for (let i = 0; i < input.previousAnswers.length; i++) {
    messages.push({
      role: "assistant",
      content: ONBOARDING_QUESTIONS[i],
    });
    messages.push({ role: "user", content: input.previousAnswers[i]! });
  }

  messages.push({
    role: "assistant",
    content: ONBOARDING_QUESTIONS[input.questionIndex],
  });
  messages.push({ role: "user", content: input.userAnswer });

  const isLastQuestion = input.questionIndex === 2;

  if (isLastQuestion) {
    messages.push({
      role: "system",
      content:
        "The user just answered the last question. Give a warm 1-sentence acknowledgment, then say something like 'Now let me play you some music — I want to see what catches your ear.' Keep it brief and excited.",
    });
  } else {
    messages.push({
      role: "system",
      content: `Give a warm 1-sentence acknowledgment of their answer. Then naturally ask the next question: "${ONBOARDING_QUESTIONS[input.questionIndex + 1]}"`,
    });
  }

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
  const avgRating =
    (ratings.easy + ratings.medium + ratings.hard) / 3;

  const hasLiveExperience =
    answers[1]?.toLowerCase().includes("yes") ||
    answers[1]?.toLowerCase().includes("concert") ||
    answers[1]?.toLowerCase().includes("opera") ||
    answers[1]?.toLowerCase().includes("symphony");

  if (avgRating >= 7 && hasLiveExperience) return "enthusiast";
  if (avgRating >= 4 || hasLiveExperience) return "casual";
  return "new";
}
