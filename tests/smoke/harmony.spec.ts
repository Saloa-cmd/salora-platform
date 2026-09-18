import AxeBuilder from "@axe-core/playwright";
import {expect,test,type Page} from "@playwright/test";

const authFixture={
 customer:{displayName:"Harmony QA",loyalty:{membershipCode:"HMY-QATEST123456",tier:"CLASSIC",points:0,ledger:[],redemptions:[]}},
 policy:{code:"HARMONY_V1",pointsPerOmr:10,welcomeBonusPoints:20},
 rewards:[{id:"qa-reward",code:"QA",name:"مكافأة اختبار",pointsCost:100}]
};

async function expectNoSeriousOrCritical(page:Page){
 const result=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
 const blocking=result.violations.filter(v=>v.impact==="serious"||v.impact==="critical");
 expect(blocking,blocking.map(v=>`${v.id}: ${v.help}`).join("\n")).toEqual([]);
}

test.describe("Harmony customer experience",()=>{
 test("anonymous rewards proves only the expected rewards/me 401 and exposes join",async({page})=>{
  const consoleErrors:string[]=[];const badResponses:string[]=[];let expected401=0;
  page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text())});
  page.on("pageerror",e=>consoleErrors.push(`pageerror: ${e.message}`));
  page.on("response",r=>{
   const path=new URL(r.url()).pathname;
   if(path==="/api/rewards/me"&&r.status()===401){expected401++;return}
   if(r.status()>=400)badResponses.push(`${r.status()} ${path}`);
  });
  const r=await page.goto("/rewards",{waitUntil:"networkidle"});expect(r?.status()).toBe(200);
  expect(expected401).toBe(1);expect(badResponses).toEqual([]);
  const unexpectedConsole=consoleErrors.filter(m=>!/^Failed to load resource: the server responded with a status of 401/.test(m));
  expect(unexpectedConsole).toEqual([]);
  await expect(page.getByRole("link",{name:"إنشاء عضوية جديدة"})).toBeVisible();
  await page.getByRole("link",{name:"إنشاء عضوية جديدة"}).click();
  await expect(page).toHaveURL(/\/rewards\/join$/);
  await expect(page.getByRole("heading",{name:"انضم إلى Harmony"})).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("dir","rtl");
  await expect(page.getByLabel("الاسم")).toBeVisible();await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible();await expect(page.getByLabel("كلمة المرور")).toBeVisible();
 });
 test("join form enforces consent and password policy in browser",async({page})=>{
  await page.goto("/rewards/join",{waitUntil:"networkidle"});
  const submit=page.getByRole("button",{name:"إنشاء عضوية Harmony"});await expect(submit).toBeDisabled();
  await page.getByLabel("الاسم").fill("Harmony QA");await page.getByLabel("البريد الإلكتروني").fill("harmony-qa@example.invalid");await page.getByLabel("كلمة المرور").fill("short");
  await page.getByRole("checkbox").check();await expect(submit).toBeEnabled();
  await submit.click();await expect(page.getByLabel("كلمة المرور")).toBeFocused();
 });
 test("join shell has mobile-safe landmarks, labels and touch targets",async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/rewards/join",{waitUntil:"networkidle"});
  await expect(page.locator("main")).toBeVisible();await expect(page.locator("form")).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);expect(overflow).toBe(false);
  const button=page.getByRole("button",{name:"إنشاء عضوية Harmony"});const box=await button.boundingBox();expect(box?.height??0).toBeGreaterThanOrEqual(44);
 });
 test("Harmony anonymous and join surfaces have zero serious/critical axe violations",async({page})=>{
  await page.goto("/rewards",{waitUntil:"networkidle"});await expectNoSeriousOrCritical(page);
  await page.goto("/rewards/join",{waitUntil:"networkidle"});await expectNoSeriousOrCritical(page);
 });
 test("Harmony authenticated dashboard has zero serious/critical axe violations on desktop and mobile RTL",async({page})=>{
  await page.route("**/api/rewards/me",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(authFixture)}));
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.goto("/rewards",{waitUntil:"networkidle"});
   await expect(page.locator("main")).toHaveAttribute("dir","rtl");
   await expect(page.getByText("HMY-QATEST123456")).toBeVisible();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);expect(overflow).toBe(false);
   await expectNoSeriousOrCritical(page);
  }
 });
 test("join critical controls are keyboard reachable with visible focus",async({page})=>{
  await page.goto("/rewards/join",{waitUntil:"networkidle"});
  const order:string[]=[];
  for(let i=0;i<8;i++){await page.keyboard.press("Tab");order.push(await page.evaluate(()=>document.activeElement?.getAttribute("name")||document.activeElement?.getAttribute("type")||document.activeElement?.tagName||""))}
  expect(order.slice(0,4)).toEqual(["INPUT","email","password","checkbox"]);
  await page.getByLabel("الاسم").focus();
  await expect(page.getByLabel("الاسم")).toBeFocused();
  const focusVisible=await page.getByLabel("الاسم").evaluate(el=>getComputedStyle(el).outlineStyle!=="none"||getComputedStyle(el).boxShadow!=="none");
  expect(focusVisible).toBe(true);
 });
});
