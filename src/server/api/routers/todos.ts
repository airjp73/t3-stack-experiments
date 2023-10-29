import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const todoRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ page: z.number() }))
    .query(({ ctx }) => {
      return ctx.db.todo.findMany({
        orderBy: { createdAt: "desc" },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        content: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.todo.create({
        data: {
          content: input.content,
        },
      });
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.todo.delete({
        where: {
          id: input.id,
        },
      });
    }),

  complete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.todo.update({
        where: {
          id: input.id,
        },
        data: {
          isCompleted: true,
        },
      });
    }),
});
