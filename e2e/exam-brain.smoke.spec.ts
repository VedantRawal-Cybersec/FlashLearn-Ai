import { test, expect } from "@playwright/test";

test("new learning modules load on desktop and mobile without missing routes",async({page})=>{
  for(const [route,heading] of [
    ["/brain","Exam Brain"],["/rescue","Rescue Mode"],["/planner","Exam-Day Planner"],
    ["/labs","Concept Lab"],["/clinic","Step Clinic"],["/pattern-lab","Exam Pattern Lab"],
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading",{name:heading,exact:true})).toBeVisible();
    await expect(page.getByText("Oops! Page not found")).toHaveCount(0);
  }
});
test("concept lab reacts to sliders and chemistry-style DNA choices",async({page})=>{
  await page.goto("/labs");
  await expect(page.getByRole("heading",{name:"Concept Lab"})).toBeVisible();
  await page.getByRole("slider",{name:"Incline angle"}).fill("45");
  await expect(page.getByText("45°").first()).toBeVisible();
  await page.getByRole("button",{name:"DNA base pairing"}).click();
  await page.getByRole("button",{name:"C",exact:true}).click();
  await expect(page.getByText("Cytosine pairs with guanine")).toBeVisible();
});
test("planner persists entered study time and checkboxes",async({page})=>{
  await page.goto("/planner");
  await page.getByRole("spinbutton",{name:"Daily available minutes"}).fill("120");
  await page.getByRole("checkbox").first().check();
  await page.reload();
  await expect(page.getByRole("spinbutton",{name:"Daily available minutes"})).toHaveValue("120");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
});
test("numerical JEE pattern practice supports integer entry and score",async({page})=>{
  await page.goto("/pattern-lab");
  await expect(page.getByText("75 questions")).toBeVisible();
  await page.getByRole("button",{name:"Begin mini practice"}).click();
  await page.getByRole("button",{name:"Go to question 6"}).click();
  await page.getByRole("spinbutton",{name:"Integer answer"}).fill("24");
  await page.getByRole("button",{name:"Submit early"}).click();
  await expect(page.getByText("4 / 32")).toBeVisible();
});
test("Rescue mission uses real wrong answers and records a retest",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Try NEET Biology demo"}).click();
  await page.getByRole("button",{name:"Lysosomes"}).click();
  for(let i=0;i<4;i++){
    await page.getByRole("button",{name:"Next"}).click();
    await page.getByRole("button",{name:["Thymine","Nephron","Xylem","ATP"][i]}).click();
  }
  await page.getByRole("button",{name:"See Results"}).click();
  await page.goto("/brain");
  await expect(page.getByText("Cell biology").first()).toBeVisible();
  await page.goto("/rescue");
  await expect(page.getByText(/which RNA type delivers amino acids to the ribosome/i)).toBeVisible();
  await page.getByRole("button",{name:"C. tRNA"}).click();
  await page.getByRole("button",{name:"Check my reasoning"}).click();
  await expect(page.getByText("Correct on this retry.")).toBeVisible();
});

test("exam pattern mistakes persist separately after refresh",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Try NEET Biology demo"}).click();
  await page.goto("/pattern-lab");
  await page.getByRole("button",{name:"Begin mini practice"}).click();
  await page.getByRole("button",{name:"Submit early"}).click();
  await page.goto("/mistakes");
  await expect(page.getByText(/distinct questions to revisit/)).toBeVisible();
  await expect(page.getByText(/Which cell structures translate messenger RNA/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Which cell structures translate messenger RNA/)).toBeVisible();
});
