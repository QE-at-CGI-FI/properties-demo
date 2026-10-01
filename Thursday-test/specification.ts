// Bombadil specification for the Thursday version of the ATM app.
//
// Properties: Bombadil's defaults, unchanged.
export {
  noHttpErrorCodes,
  noUncaughtExceptions,
  noUnhandledPromiseRejections,
  noConsoleErrors,
} from "@antithesishq/bombadil/browser/defaults/properties";

// Actions: Bombadil's defaults, except for typing into inputs (see below).
import { extract, actions, weighted } from "@antithesishq/bombadil/browser";
import {
  clicks,
  scroll,
  navigation,
  waitOnce,
} from "@antithesishq/bombadil/browser/defaults/actions";

const numberInputFocused = extract((state) => {
  const element = state.document.activeElement;
  return element instanceof HTMLInputElement && element.type === "number";
});

// Replaces the default `inputs` generator, which in Bombadil 0.7.8
//  - types the letter "d" instead of digits into number inputs, so no amount
//    is ever entered, and
//  - presses Escape and Enter, which stall a headless Chrome run.
const numberInputs = actions(() => {
  if (!numberInputFocused.current) return [];
  return weighted([
    [1, { PressKey: { code: 8 } }], // Backspace
    [1, { PressKey: { code: 9 } }], // Tab
    [6, { TypeText: { text: { Regexp: "[0-9]{1,5}" }, delayMillis: [1, 100] } }],
  ]).generate();
});

export const atmActions = weighted([
  [100, clicks],
  [100, numberInputs],
  [50, scroll],
  [10, navigation],
  [1, waitOnce],
]);

// Add domain-specific properties below this line as the testing grows.
