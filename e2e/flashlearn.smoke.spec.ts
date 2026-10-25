import { test, expect } from "@playwright/test";

test("home renders, study options appear, and routes have no 404", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.goto("/");
  await expect(page.getByText("PIXEL QUEST STUDY WORLD")).toBeVisible();
  await expect(page.getByText("YOUR LEARNING ADVENTURE STARTS HERE")).toBeVisible();
  await expect(page.getByText("250K+")).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { name: /Study Coach/i })).toBeVisible();
  await page.goto("/coach");
  await expect(page.getByRole("heading", { name: "Your Study Coach" })).toBeVisible();
  await page.goto("/drill");
  await expect(page.getByText("Create a study session before entering Exam Drill.")).toBeVisible();
  await expect(page.getByText("Oops! Page not found")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("private session survives reload; exam drill and coach use real answers", async ({ page }) => {
  const sample = {
    id: "smoke-session", title: "Physics Optics", videoUrl: "",
    createdAt: "2026-10-23T00:00:00Z",
    generation: { options: { difficulty: "medium", examLevel: "neet", includeNumericals: false, questionCount: 5, subject: "physics", chapter: "Optics" }, references: [] },
    flashcards: [{ id: "fc-0", front: "What is refraction?", back: "Light changing direction", difficulty: "hard" }],
    quizQuestions: Array.from({ length: 5 }, (_, i) => ({
      id: "q-" + i,
      question: "Optics sample question " + i + "?",
      options: ["Correct", "Wrong B", "Wrong C", "Wrong D"],
      correctIndex: 0, explanation: "Verified synthetic test fixture", topic: "Optics",
      questionType: "conceptual",
    })),
    roadmap: [],
  };
  await page.addInitScript(session => {
    if (!sessionStorage.getItem("flashlearn-e2e-seeded")) {
      localStorage.setItem("flashlearn-private-sessions-v1", JSON.stringify([session]));
      localStorage.setItem("flashlearn-current-session-v1", session.id);
      sessionStorage.setItem("flashlearn-e2e-seeded", "true");
    }
  }, sample);
  await page.goto("/");
  await page.goto("/drill");
  await expect(page.getByRole("heading", { name: "Timed Exam Drill" })).toBeVisible();
  await page.getByRole("button", { name: "Start drill" }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.getByText("Optics sample question " + i + "?")).toBeVisible();
    await page.getByRole("button", { name: "A. Correct" }).click();
    if (i < 4) await page.getByRole("button", { name: "Next" }).click();
  }
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("20 / 20")).toBeVisible();
  await page.reload();
  await page.goto("/coach");
  await expect(page.getByRole("heading", { name: "Your Study Coach" })).toBeVisible();
  await expect(page.getByText("100%").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export my study data" })).toBeVisible();
});

test("mobile layout keeps content within viewport", async ({ page }, info) => {
  test.skip(!info.project.name.includes("mobile"), "Mobile-specific test");
  await page.goto("/");
  await expect(page.getByText("PIXEL QUEST STUDY WORLD")).toBeVisible();
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.viewport + 2);
});

test("animated world is viewport-bounded and offscreen effects pause", async ({ page }) => {
  await page.goto("/");
  const field = page.locator(".world-backdrop");
  await expect(field).toBeVisible();
  const height = await field.evaluate(el => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThan(200);
  expect(height).toBeLessThanOrEqual(1102);

  // Preserve animated sprite artwork but avoid processing it when not visible.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator(".world-backdrop .starfield").first()).toHaveClass(/motion-paused/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(".world-backdrop .starfield").first()).not.toHaveClass(/motion-paused/);
});

test("input remains interactive without re-creating quest artwork", async ({ page }) => {
  await page.goto("/");
  const field = page.locator(".world-backdrop");
  const sameBackdrop = await field.evaluate(el => { (el as HTMLElement).dataset.stabilityCheck = "mounted"; return true; });
  expect(sameBackdrop).toBe(true);
  await page.getByRole("textbox", { name: /youtube/i }).fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await expect(field).toHaveAttribute("data-stability-check", "mounted");
});

test("JEE and NEET sample quests work instantly without AI or login", async ({ page }) => {
  const apiCalls: string[] = [];
  page.on("request", req => { if (req.url().includes("/functions/v1/")) apiCalls.push(req.url()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Try JEE Physics demo" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await expect(page.getByText(/A body starts from rest and accelerates uniformly/)).toBeVisible();
  await page.getByRole("button", { name: "9 m" }).click();
  await expect(page.getByText(/s = ut \+ ½at²/)).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem("flashlearn-private-sessions-v1") || "[]");
    return rows.find((r: { title: string }) => r.title === "SAMPLE · JEE Main Physics")?.quizQuestions?.[0]?.userAnswer;
  })).toBe(2);
  await page.reload();
  await expect(page.getByText(/A body starts from rest and accelerates uniformly/)).toBeVisible();
  expect(apiCalls).toHaveLength(0);
  await page.goto("/");
  await page.getByRole("button", { name: "Try NEET Biology demo" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await expect(page.getByText(/Which cell structures translate messenger RNA/)).toBeVisible();
  expect(apiCalls).toHaveLength(0);
});

test("daily review queue schedules cards and retains due date after refresh", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try NEET Biology demo" }).click();
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Daily Review Queue" })).toBeVisible();
  await expect(page.getByText("5 cards due now")).toBeVisible();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: "Good" }).click();
  await expect(page.getByText("4 cards due now")).toBeVisible();
  await page.reload();
  await expect(page.getByText("4 cards due now")).toBeVisible();
});
test("timed drill mistakes survive refresh in Mistake Book", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try NEET Biology demo" }).click();
  await page.goto("/drill");
  await page.getByRole("button", { name: "Start drill" }).click();
  await page.getByRole("button", { name: "A. Lysosomes" }).click();
  await page.getByRole("button", { name: "Finish and grade answers" }).click();
  await page.goto("/mistakes");
  await expect(page.getByRole("heading", { name: "Mistake Book" })).toBeVisible();
  await expect(page.getByText("5 distinct questions to revisit")).toBeVisible();
  await expect(page.getByText("Your answer: Lysosomes")).toBeVisible();
  await page.reload();
  await expect(page.getByText("5 distinct questions to revisit")).toBeVisible();
});

test("study backup import preserves existing sessions and restores new ones", async ({ page }) => {
  await page.goto("/coach");
  const backup = {
    version: 1,
    sessions: [{
      id:"imported-quest",title:"Imported Chemistry",createdAt:"2026-10-25T00:00:00Z",videoUrl:"",
      flashcards:[{id:"c1",front:"Atom",back:"Smallest basic unit",difficulty:null}],
      quizQuestions:[],roadmap:[],
    }],
  };
  await page.getByLabel("Import study backup").setInputFiles({
    name:"flash-learn-study-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByText("Restored 1 study sessions. Existing sessions were kept.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Imported Chemistry" })).toBeVisible();
});
