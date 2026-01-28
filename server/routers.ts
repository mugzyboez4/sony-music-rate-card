import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { lookupFollowers } from "./followerLookup";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Follower Lookup API
  followers: router({
    lookup: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        const { name } = input;
        const result = await lookupFollowers(name);
        return result;
      }),
  }),

  // Trend Verification API
  trend: router({
    verify: publicProcedure
      .input(z.object({ trackUrl: z.string() }))
      .mutation(async ({ input }) => {
        // Mock verification logic (simulates Chartmetric API response)
        // In production, replace with actual API call to Chartmetric/Soundcharts
        
        const { trackUrl } = input;
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock response: randomly determine if track is viral
        // In production, this would query real data and apply threshold logic
        const isViral = Math.random() > 0.3; // 70% chance of being viral for demo
        const velocityPercent = isViral ? Math.floor(Math.random() * 150) + 50 : Math.floor(Math.random() * 40);
        
        return {
          success: true,
          isViral,
          data: {
            trackUrl,
            velocityPercent,
            platform: 'TikTok',
            message: isViral 
              ? `Track velocity is up +${velocityPercent}% on TikTok this week. Discount applied automatically.`
              : `Track velocity is +${velocityPercent}% on TikTok. Does not meet threshold (>50%) for discount.`
          }
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
