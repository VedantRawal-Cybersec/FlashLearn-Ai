import {test,expect} from "@playwright/test";
test("JEE Advanced example accepts multiple selections and scores transparently",async({page})=>{
 await page.goto("/advanced-formats");
 await expect(page.getByRole("heading",{name:"Advanced Format Workshop"})).toBeVisible();
 await page.getByLabel("adv-p: The direction of velocity changes continuously.").check();
 await page.getByLabel("adv-p: Acceleration points toward the centre.").check();
 await page.getByLabel("adv-p: Speed is constant but velocity is not constant.").check();
 await page.getByRole("button",{name:"Check selections"}).click();
 await expect(page.getByText(/1 exact · 0 incorrect · 2 skipped/)).toBeVisible();
 await page.getByRole("button",{name:"Board-style self-assessment"}).click();
 await expect(page.getByText("Self-assessed: 0/3")).toBeVisible();
});
test("Hindi and Kannada glossary remains usable on narrow screens",async({page})=>{
 await page.goto("/languages");
 await expect(page.getByRole("heading",{name:"Bilingual Concept Glossary"})).toBeVisible();
 await page.getByRole("combobox",{name:"Learning language"}).selectOption("kn");
 await page.getByRole("textbox",{name:"Search concept"}).fill("Acceleration");
 await expect(page.getByText("ವೇಗೋತ್ಕರ್ಷ")).toBeVisible();
});
