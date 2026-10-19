# Mutation-test

Mutation testing of the Playwright property test
(`../Playwright-test/atm-properties.spec.ts`) with [Stryker](https://stryker-mutator.io/).
Stryker mutates the inline `<script>` of the Thursday ATM app and runs the
unchanged spec once per mutant. Monday is not used: its known bugs make the
unmutated test fail, and mutation testing needs a passing baseline.

    npm install
    npx playwright install webkit
    npm run mutate        # about 25 minutes, 421 mutants, 4 in parallel

The report is written to `reports/mutation/thursday.html`.

How it fits together:

- `prepare.mjs` copies `../Thursday/index.html` and the spec here, keeping the
  repo layout so the spec finds `../Thursday/index.html` inside Stryker's sandbox.
  The app copy gets one extra `<script src="stryker-active.js">` line.
- `run-mutant.sh` is Stryker's test command. It writes the active mutant id
  into `stryker-active.js`, which switches that mutant on in the browser,
  and then runs Playwright headless (`playwright.config.ts`).
- `SEED` and `STEPS` pass through to the spec, as in `Playwright-test`.
