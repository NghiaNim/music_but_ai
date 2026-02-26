import { authRouter } from "./router/auth";
import { chatRouter } from "./router/chat";
import { eventRouter } from "./router/event";
import { onboardingRouter } from "./router/onboarding";
import { postRouter } from "./router/post";
import { userEventRouter } from "./router/user-event";
import { userProfileRouter } from "./router/user-profile";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  chat: chatRouter,
  event: eventRouter,
  onboarding: onboardingRouter,
  post: postRouter,
  userEvent: userEventRouter,
  userProfile: userProfileRouter,
});

export type AppRouter = typeof appRouter;
