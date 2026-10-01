// One Playwright test that checks the ATM properties from
// ../Full-test/bombadil/specification.ts over a seeded random walk.
//
//   npm run monday      (DAY=Monday, the default)
//   npm run thursday    (DAY=Thursday)
//   SEED=7 STEPS=500 npm run thursday
//
// Property names match the Bombadil specification. Covered here: the state
// invariants and the withdrawal step properties. Not covered: the clock and
// reload properties and the exploration-guidance (`eventually`) ones.

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

const day = process.env.DAY ?? "Monday";
const seed = Number(process.env.SEED ?? 1);
const steps = Number(process.env.STEPS ?? 300);

// Small seeded random generator, so a failing walk can be replayed.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- State extractor: the rendered DOM, as the Bombadil extractors read it ---

async function readState(page: Page) {
  return page.evaluate(() => {
    const num = (sel: string) => {
      const m = document.querySelector(sel)?.textContent?.match(/-?\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };
    const first = document.querySelector("#history .history-item");
    const latestFail = !!first?.querySelector(".hi-fail");
    const bills = {
      100: num("#count100"),
      50: num("#count50"),
      20: num("#count20"),
      10: num("#count10"),
    };
    return {
      balance: num("#dispBalance"),
      accountLimit: num("#dispAccLimit"),
      accountWithdrawnHere: num("#dispAccWithdrawn"),
      accountWithdrawnElsewhere:
        parseInt(
          document.querySelector<HTMLInputElement>("#inputElsewhere")!.value,
          10,
        ) || 0,
      accountRemaining: num("#dispAccRemaining"),
      atmLimit: num("#dispAtmLimit"),
      atmWithdrawn: num("#dispAtmWithdrawn"),
      atmRemaining: num("#dispAtmRemaining"),
      bills,
      cashInAtm: bills[100] * 100 + bills[50] * 50 + bills[20] * 20 + bills[10] * 10,
      historyCount: document.querySelectorAll(
        "#history .hi-amount, #history .hi-fail",
      ).length,
      latestOk: !!first?.querySelector(".hi-amount"),
      latestReason: latestFail ? first!.children[1]?.textContent?.trim() ?? "" : "",
      message: document.querySelector("#messageBox")?.textContent ?? "",
    };
  });
}
type State = Awaited<ReturnType<typeof readState>>;

// --- Properties ---------------------------------------------------------------

// `always(...)` invariants: must hold in every state.
const invariants: Record<string, (s: State) => boolean> = {
  balanceNeverNegative: (s) => s.balance >= 0,
  cashCountsNeverNegative: (s) => Object.values(s.bills).every((n) => n >= 0),
  totalCashNeverNegative: (s) => s.cashInAtm >= 0,
  remainingFiguresNeverNegative: (s) =>
    s.accountRemaining >= 0 && s.atmRemaining >= 0,
  atmWithdrawalsRespectAtmLimit: (s) => s.atmWithdrawn <= s.atmLimit,
  accountWithdrawalsRespectAccountLimit: (s) =>
    s.accountWithdrawnHere + s.accountWithdrawnElsewhere <= s.accountLimit,
  withdrawnElsewhereNeverExceedsAccountLimit: (s) =>
    s.accountWithdrawnElsewhere <= s.accountLimit,
};

// Step properties: compare the state before and after one WITHDRAW click.
const withdrawalProperties: Record<
  string,
  (pre: State, post: State, raw: string) => boolean
> = {
  declinedWithdrawalsDontConsumeCounters: (pre, post) =>
    !(logged(pre, post) && !post.latestOk) ||
    (post.balance === pre.balance &&
      post.accountWithdrawnHere === pre.accountWithdrawnHere &&
      post.atmWithdrawn === pre.atmWithdrawn &&
      post.cashInAtm === pre.cashInAtm),
  cashDecreaseMatchesRequestedAmount: (pre, post, raw) =>
    !(logged(pre, post) && post.latestOk) ||
    post.cashInAtm === pre.cashInAtm - parseInt(raw, 10),
  successfulWithdrawalIsPositiveMultipleOfTen: (pre, post, raw) =>
    !(logged(pre, post) && post.latestOk) ||
    (parseInt(raw, 10) > 0 && parseInt(raw, 10) % 10 === 0),
  fractionalAmountRejectedNotTruncated: (pre, post, raw) =>
    !/[.,]/.test(raw) || !logged(pre, post),
  overdrawnAccountBlocksFurtherWithdrawals: (pre, post) =>
    !(logged(pre, post) && computedAccountRemaining(pre) < 0) || !post.latestOk,
  declineMessageStaysGeneric: (pre, post) =>
    !(logged(pre, post) && !post.latestOk) ||
    post.latestReason === "" ||
    !post.message.includes(post.latestReason),
};

const logged = (pre: State, post: State) =>
  post.historyCount === pre.historyCount + 1;
const computedAccountRemaining = (s: State) =>
  s.accountLimit - s.accountWithdrawnHere - s.accountWithdrawnElsewhere;

// --- The test -----------------------------------------------------------------

test(`ATM properties hold over a random walk (${day}, seed ${seed})`, async ({
  page,
}) => {
  const random = mulberry32(seed);
  const pick = <T>(xs: T[]): T => xs[Math.floor(random() * xs.length)];
  const trail: string[] = [];

  await page.goto("file://" + path.resolve(__dirname, "..", day, "index.html"));
  await page.getByRole("button", { name: "DEBUG" }).click();
  await page.getByRole("button", { name: "ADMIN" }).click();

  const check = (ok: boolean, property: string, s: State) =>
    expect(
      ok,
      `${property} was violated after:\n  ${trail.slice(-6).join("\n  ")}\n` +
        `state: ${JSON.stringify(s)}`,
    ).toBe(true);

  const applyAll = async () => {
    for (const apply of await page.getByRole("button", { name: "APPLY" }).all()) {
      await apply.click();
    }
  };

  // Action generators, with the same boundary values as the Bombadil spec.
  const actions = [
    async (s: State) => {
      const amount = pick([
        0, 10, 15, -10, 20, 50, 1000, 300.5, 10.5,
        s.accountRemaining, s.accountRemaining + 10,
        s.atmRemaining, s.atmRemaining + 10,
        s.balance, s.balance + 10,
      ]);
      trail.push(`withdraw ${amount}`);
      await page.locator("#amountInput").fill(String(amount));
      await page.getByRole("button", { name: "WITHDRAW" }).click();
      const post = await readState(page);
      for (const [name, holds] of Object.entries(withdrawalProperties)) {
        check(holds(s, post, String(amount)), name, post);
      }
    },
    async (s: State) => {
      const value = pick([0, s.accountLimit, s.accountLimit + 10, s.accountLimit * 2]);
      trail.push(`set withdrawn elsewhere to ${value}`);
      await page.locator("#inputElsewhere").fill(String(value));
    },
    async () => {
      const [id, value] = pick<[string, number]>([
        ["cfgBalance", 0], ["cfgBalance", 100], ["cfgBalance", 5000],
        ["cfgAtmLimit", 0], ["cfgAtmLimit", 300],
        ["cfgAccLimit", 0], ["cfgAccLimit", 500],
        ["refill100", 0], ["refill100", 20], ["refill50", 0], ["refill50", 20],
        ["refill20", 0], ["refill20", 20], ["refill10", 0], ["refill10", 20],
      ]);
      trail.push(`set ${id} to ${value} and apply`);
      await page.locator(`#${id}`).fill(String(value));
      await applyAll();
    },
    async () => {
      const [acc, atm] = pick([[500, 100], [100, 500], [300, 300], [200, 400], [400, 200]]);
      trail.push(`set account limit ${acc}, ATM limit ${atm} and apply`);
      await page.locator("#cfgAccLimit").fill(String(acc));
      await page.locator("#cfgAtmLimit").fill(String(atm));
      await applyAll();
    },
  ];

  for (let step = 0; step < steps; step++) {
    await pick(actions)(await readState(page));
    const s = await readState(page);
    for (const [name, holds] of Object.entries(invariants)) {
      check(holds(s), name, s);
    }
  }
});
