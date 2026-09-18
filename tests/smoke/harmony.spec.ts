import {expect,test} from "@playwright/test";

test.describe("Harmony customer experience",()=>{
 test("anonymous rewards journey exposes join without Control Tower",async({page})=>{
  const errors:string[]=[];page.on("console",m=>{if(m.type()==="error"&&!m.text().includes("401 (Unauthorized)"))errors.push(m.text())});page.on("pageerror",e=>errors.push(e.message));
  const unauthorized=page.waitForResponse(r=>r.url().includes("/api/rewards/me")&&r.status()===401);
  const r=await page.goto("/rewards",{waitUntil:"networkidle"});expect(r?.status()).toBe(200);await unauthorized;
  await expect(page.getByRole("link",{name:"إنشاء عضوية جديدة"})).toBeVisible();
  await page.getByRole("link",{name:"إنشاء عضوية جديدة"}).click();
  await expect(page).toHaveURL(/\/rewards\/join$/);
  await expect(page.getByRole("heading",{name:"انضم إلى Harmony"})).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("dir","rtl");
  await expect(page.getByLabel("الاسم")).toBeVisible();await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible();await expect(page.getByLabel("كلمة المرور")).toBeVisible();
  expect(errors).toEqual([]);
 });
 test("join form enforces consent and password policy in browser",async({page})=>{
  await page.goto("/rewards/join",{waitUntil:"networkidle"});
  const submit=page.getByRole("button",{name:"إنشاء عضوية Harmony"});await expect(submit).toBeDisabled();
  await page.getByLabel("الاسم").fill("Harmony QA");await page.getByLabel("البريد الإلكتروني").fill("harmony-qa@example.invalid");await page.getByLabel("كلمة المرور").fill("short");
  await page.getByRole("checkbox").check();await expect(submit).toBeEnabled();
  await submit.click();await expect(page.getByLabel("كلمة المرور")).toBeFocused();
 });
 test("join shell has mobile-safe landmarks, labels and touch targets",async({page})=>{
  await page.goto("/rewards/join",{waitUntil:"networkidle"});
  await expect(page.locator("main")).toBeVisible();await expect(page.locator("form")).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);expect(overflow).toBe(false);
  const button=page.getByRole("button",{name:"إنشاء عضوية Harmony"});const box=await button.boundingBox();expect(box?.height??0).toBeGreaterThanOrEqual(44);
 });
});