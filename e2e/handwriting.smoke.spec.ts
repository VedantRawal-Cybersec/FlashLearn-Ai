import {test,expect} from "@playwright/test";
test("handwriting review cannot call paid AI without sign-in or an image",async({page})=>{
  const calls:string[]=[];
  page.on("request",r=>{if(r.url().includes("/functions/v1/analyze-handwriting"))calls.push(r.url())});
  await page.goto("/handwriting");
  await expect(page.getByRole("heading",{name:"Handwritten Solution Review"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Analyze handwritten work"})).toBeDisabled();
  await page.getByLabel("Handwritten solution image").setInputFiles({
    name:"fake.pdf",mimeType:"application/pdf",buffer:Buffer.from("not a photo")
  });
  await expect(page.getByText("Use a PNG, JPEG, or WebP photo.")).toBeVisible();
  expect(calls).toHaveLength(0);
});
