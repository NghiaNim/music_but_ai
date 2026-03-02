import { z } from "zod/v4";

export const Difficulty = z.enum(["beginner", "intermediate", "advanced"]);
export type Difficulty = z.infer<typeof Difficulty>;

export const Genre = z.enum([
  "orchestral",
  "opera",
  "chamber",
  "solo_recital",
  "choral",
  "ballet",
  "jazz",
]);
export type Genre = z.infer<typeof Genre>;

export const EventStatus = z.enum(["saved", "attended"]);
export type EventStatus = z.infer<typeof EventStatus>;

export const ChatMode = z.enum(["discovery", "learning"]);
export type ChatMode = z.infer<typeof ChatMode>;

export const ChatRole = z.enum(["user", "assistant"]);
export type ChatRole = z.infer<typeof ChatRole>;

export const ExperienceLevel = z.enum(["new", "casual", "enthusiast"]);
export type ExperienceLevel = z.infer<typeof ExperienceLevel>;

export const EventFiltersSchema = z.object({
  search: z.string().optional(),
  genre: Genre.optional(),
  difficulty: Difficulty.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
export type EventFilters = z.infer<typeof EventFiltersSchema>;

export const SendChatMessageSchema = z.object({
  sessionId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  mode: ChatMode,
  content: z.string().min(1).max(4000),
});
export type SendChatMessage = z.infer<typeof SendChatMessageSchema>;

export const UpdateUserProfileSchema = z.object({
  experienceLevel: ExperienceLevel,
});
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;

export const ToggleEventStatusSchema = z.object({
  eventId: z.string().uuid(),
  status: EventStatus,
});
export type ToggleEventStatus = z.infer<typeof ToggleEventStatusSchema>;

export const SaveReflectionSchema = z.object({
  userEventId: z.string().uuid(),
  reflection: z.string().max(280),
});
export type SaveReflection = z.infer<typeof SaveReflectionSchema>;
