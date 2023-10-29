import "dotenv/config";
import { test, beforeAll, expect } from "vitest";
import { setupServer } from "msw/node";
import { http } from "msw";
import Todos from "~/pages/todos";
import { render, screen } from "@testing-library/react";
import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import {} from "@trpc/server";
import { createInnerTRPCContext } from "~/server/api/trpc";
import { type Session } from "next-auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const id = String(Date.now());

beforeAll(async () => {
  await db.$executeRaw`delete from todo`;
  const server = setupServer(
    http.all("http://localhost/api/trpc/:trpc", async ({ request }) => {
      const session: Session = {
        expires: "2021-05-01T00:00:00.000Z",
        user: {
          id,
          name: "Test User",
        },
      };
      const r = await fetchRequestHandler({
        endpoint: "api/trpc/",
        req: request,
        router: appRouter,
        createContext: () => createInnerTRPCContext({ session }),
      });
      return r;
    }),
  );

  server.listen();
});

const WithT = api.withTRPC(Todos);
test("creates todos", async () => {
  render(<WithT />);
  await db.todo.create({
    data: {
      content: "Test todo",
    },
  });
  await screen.findByText("Test todo");
  await userEvent.type(screen.getByTestId("input"), "Test todo 2");
  await userEvent.click(screen.getByText("Add"));
  expect(await screen.findAllByText("Test todo 2")).toHaveLength(2);
});
