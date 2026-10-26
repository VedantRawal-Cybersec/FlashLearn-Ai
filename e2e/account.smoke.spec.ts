import {test,expect} from "@playwright/test";
test("optional account screen does not upload without authorization",async({page})=>{
  const writes:string[]=[];
  page.on("request",request=>{
    if(request.method()!=="GET"&&request.url().includes("private_study_sessions"))writes.push(request.url());
  });
  await page.goto("/account");
  await expect(page.getByRole("heading",{name:"Secure Backup"})).toBeVisible();
  await expect(page.getByText(/Cloud storage is optional/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Email me a sign-in link"})).toBeDisabled();
  await page.goto("/coach");
  await expect(page.getByRole("button",{name:"Export my study data"})).toBeVisible();
  expect(writes).toHaveLength(0);
});
