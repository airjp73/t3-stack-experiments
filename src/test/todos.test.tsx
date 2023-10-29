import "dotenv/config";
import { test, beforeAll, expect } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";
import Todos from "~/pages/todos";
import { render, screen } from "@testing-library/react";
import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import {} from "@trpc/server";
import { createInnerTRPCContext } from "~/server/api/trpc";
import { type Session } from "next-auth";
import SuperJSON from "superjson";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const id = String(Date.now());

beforeAll(async () => {
  await db.$executeRaw`delete from todo`;
  const server = setupServer(
    http.all("http://localhost/api/trpc/:trpc", async ({ request, params }) => {
      const { trpc } = params;
      const session: Session = {
        expires: "2021-05-01T00:00:00.000Z",
        user: {
          id,
          name: "Test User",
        },
      };
      const body =
        request.method === "GET"
          ? JSON.parse(new URL(request.url).searchParams.get("input"))
          : await request.json();
      const caller = appRouter.createCaller(
        createInnerTRPCContext({ session }),
      );

      const commands = trpc.split(",");

      const promises: any[] = [];
      Object.entries(body).forEach(([key, value], i) => {
        let c: any = caller;
        const path = commands[i].split(".");
        for (const p of path) {
          c = c[p];
        }

        try {
          const d = SuperJSON.deserialize(value);
          const prom = c(d);
          promises.push(prom);
        } catch (error) {
          console.log(error);
          throw error;
        }
      });
      try {
        const responses = await Promise.all(promises);
        const all = responses.map((r) => ({
          result: { data: SuperJSON.serialize(r) },
        }));
        return HttpResponse.json(all);
      } catch (error) {
        console.log(error);
        throw error;
      }
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
