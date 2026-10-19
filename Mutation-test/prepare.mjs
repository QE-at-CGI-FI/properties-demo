// Copies the ATM app and the Playwright spec into this folder, mirroring the
// repo layout (<Day>/index.html next to Playwright-test/), so the unchanged
// spec finds the app at ../<Day>/index.html inside Stryker's sandbox.
//
// The app copy gets one extra line: <script src="stryker-active.js"> before the
// inline script. run-mutant.sh writes that file per run, telling the
// Stryker-instrumented code in the browser which mutant to switch on.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const day = process.env.DAY ?? "Thursday";
const html = readFileSync(`../${day}/index.html`, "utf8");
if (!html.includes("\n<script>")) throw new Error(`No inline <script> in ${day}`);
mkdirSync(day, { recursive: true });
writeFileSync(
  `${day}/index.html`,
  html.replace("\n<script>", '\n<script src="stryker-active.js"></script>\n<script>'),
);
writeFileSync(`${day}/stryker-active.js`, "");
mkdirSync("Playwright-test", { recursive: true });
copyFileSync("../Playwright-test/atm-properties.spec.ts", "Playwright-test/atm-properties.spec.ts");
console.log(`Prepared ${day}/index.html and Playwright-test/atm-properties.spec.ts`);
