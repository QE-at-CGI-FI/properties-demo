#!/bin/sh
# Stryker's command runner calls this once per mutant, with the mutant id in
# __STRYKER_ACTIVE_MUTANT__ (unset for the initial, unmutated run).
day="${DAY:-Thursday}"
if [ -n "$__STRYKER_ACTIVE_MUTANT__" ]; then
  echo "window.__stryker__ = { activeMutant: \"$__STRYKER_ACTIVE_MUTANT__\" };" > "$day/stryker-active.js"
else
  : > "$day/stryker-active.js"
fi
DAY="$day" exec node_modules/.bin/playwright test -c playwright.config.ts
