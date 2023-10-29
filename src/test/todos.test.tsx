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
import { createInnerTRPCContext, createTRPCContext } from "~/server/api/trpc";
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
      const url = new URL(request.url);
      const caller = appRouter.createCaller(
        createInnerTRPCContext({ session }),
      );
      let c: any = caller;
      const path = trpc.split(".");
      for (const p of path) {
        c = c[p];
      }

      const getBody = async () => {
        const body = await request.json();
        return SuperJSON.deserialize(body["0"]);
      };
      try {
        const res =
          request.method === "GET" ? await c() : await c(await getBody());
        const r = SuperJSON.serialize(res);
        const r2 = [{ result: { data: r } }];
        return HttpResponse.json(r2);
      } catch (err) {
        console.log(err);
        throw err;
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
  expect(await screen.findByText("Test todo 2")).toBeInTheDocument();
});
