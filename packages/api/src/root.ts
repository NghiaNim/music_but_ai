import { authRouter } from "./router/auth";
import { chatRouter } from "./router/chat";
import { eventRouter } from "./router/event";
import { postRouter } from "./router/post";
import { userEventRouter } from "./router/user-event";
import { userProfileRouter } from "./router/user-profile";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  chat: chatRouter,
  event: eventRouter,
  post: postRouter,
  userEvent: userEventRouter,
  userProfile: userProfileRouter,
});

export type AppRouter = typeof appRouter;
