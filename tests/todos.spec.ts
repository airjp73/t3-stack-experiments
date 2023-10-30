import { test, expect } from "@playwright/test";
import { db } from "~/server/db";

test.beforeAll(async () => {
  await db.$executeRaw`delete from todo`;
});

test("creates a todo", async ({ page, context }) => {
  await db.todo.create({
    data: {
      content: "Test todo",
    },
  });
  await context.addCookies([
    {
      name: "testing-123",
      value: "testing-123",
      url: "http://localhost:3000",
    },
  ]);

  await page.goto("http://localhost:3000/todos");

  await expect(page.getByText("Test todo")).toBeVisible();
  await page.getByTestId("input").fill("Test todo 2");
  await page.getByText("Add").click();
  await expect(page.getByText("Test todo 2")).toHaveCount(2);
});
