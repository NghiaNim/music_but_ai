import type { TRPCRouterRecord } from "@trpc/server";

import { BADGE_DEFINITIONS, BADGE_LEVELS } from "@acme/validators";

import { protectedProcedure } from "../trpc";

type BadgeLevel = (typeof BADGE_LEVELS)[number];

function buildAchievementText(input: {
  category: "attended" | "listened";
  baseLabel: string;
  composer?: string;
  requirement: number;
}) {
  if (input.category === "attended") {
    const composerText = input.composer
      ? `${input.composer} pieces`
      : "featured pieces";
    return `Attend ${input.requirement} concerts featuring ${composerText}`;
  }
  const eraName = input.baseLabel.replace(" Era Enthusiast", "");
  return `Listen to ${input.requirement} ${eraName} era pieces`;
}

function getBadgeLevel(progress: number): BadgeLevel {
  let current = BADGE_LEVELS[0] as BadgeLevel;
  for (const level of BADGE_LEVELS) {
    if (progress >= level.requirement) current = level;
  }
  return current;
}

export const badgesRouter = {
  forUser: protectedProcedure.query(async ({ ctx }) => {
    const userEvents = await ctx.db.query.UserEvent.findMany({
      with: { event: true },
      where: (table, { eq }) => eq(table.userId, ctx.session.user.id),
    });

    const attended = userEvents.filter((event) => event.status === "attended");
    const composerCounts = new Map<string, number>();

    for (const userEvent of attended) {
      const composer = userEvent.event.program.split(":")[0]?.trim();
      if (!composer) continue;
      composerCounts.set(composer, (composerCounts.get(composer) ?? 0) + 1);
    }

    return BADGE_DEFINITIONS.map((badge) => {
      const progress = badge.composer
        ? (composerCounts.get(badge.composer) ?? 0)
        : 0;
      const currentLevel = getBadgeLevel(progress);
      const nextLevel =
        BADGE_LEVELS.find((level) => level.level === currentLevel.level + 1) ??
        currentLevel;

      return {
        ...badge,
        progress,
        currentLevel,
        nextLevel,
        earned: progress >= currentLevel.requirement,
        label: `${badge.baseLabel} ${currentLevel.numeral}`,
        achievement: buildAchievementText({
          category: badge.category,
          baseLabel: badge.baseLabel,
          composer: badge.composer,
          requirement: currentLevel.requirement,
        }),
        requirementText: `${buildAchievementText({
          category: badge.category,
          baseLabel: badge.baseLabel,
          composer: badge.composer,
          requirement: nextLevel.requirement,
        })} to unlock Level ${nextLevel.numeral}.`,
      };
    });
  }),
} satisfies TRPCRouterRecord;
