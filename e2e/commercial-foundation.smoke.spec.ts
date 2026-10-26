import {test,expect} from "@playwright/test";
test("learning insights and shareable Study Circle are accessible without login",async({page})=>{
  await page.goto("/insights");
  await expect(page.getByRole("heading",{name:"Learning Insights"})).toBeVisible();
  await expect(page.getByText("No recorded attempts yet.")).toBeVisible();
  await page.goto("/circles?track=neet");
  await expect(page.getByRole("heading",{name:"Study Circle Challenges"})).toBeVisible();
  await expect(page.getByRole("combobox",{name:"Challenge track"})).toHaveValue("neet");
  await page.getByRole("button",{name:"Begin this challenge"}).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await expect(page.getByText(/Which cell structures translate messenger RNA/)).toBeVisible();
});
test("real saved attempts appear in private insights without sign-in",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:"Try NEET Biology demo"}).click();
  await page.getByRole("button",{name:"Ribosomes"}).click();
  for(let i=0;i<4;i++){
    await page.getByRole("button",{name:"Next"}).click();
    await page.getByRole("button",{name:["Thymine","Nephron","Xylem","ATP"][i]}).click();
  }
  await page.getByRole("button",{name:"See Results"}).click();
  await page.goto("/insights");
  await expect(page.getByText("5",{exact:true}).first()).toBeVisible();
  await expect(page.getByRole("button",{name:"Export CSV"})).toBeEnabled();
});
