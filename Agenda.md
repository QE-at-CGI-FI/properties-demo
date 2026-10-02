# What I will show you

![screenshot](Screenshot.png)

- New tool in the house: Bombadil
- What is a _property_ and how do tester reason about them
- Separation:
  - Authoring (always AI!)
  - Execution (generated vs. handcrafted)
  - Oracles (always-true statements vs. specific checks)
- Should we talk driver protocols CDP Bombadil vs. CDP Playwright vs. WebDriver BiDi, that all matters now more with AI.
- Properties mix up with old tools too!
- New tool so... Tested Prestashop and D365FO.
- Note: Authoring with AI, but not running agentic testing, just deterministic generated tests. Less token harmed by knowing the difference.
- Note: This _manual automation_ demo belongs in a frame of true automation with pipelines.
- Next practice:
  - PR to fix the tool so that it works with D365 FO.
  - Report / fix the three problems + the hundreds of API problems this found on Prestashop, for common good?

And how:

1. Default properties
   - no HTTP error codes,
   - no uncaught exceptions,
   - no unhandled promise rejections,
   - no console errors.
2. Testing an app before I fixed it this week
3. State extractors, generators, properties and helpers
4. More properties
   - 20 more properties with antithesis research skill run on source code
5. Properties on Playwright

# What I would also want to show you...

- Local LLM use for notetaking and summarizing
- 2nd brain aka. LLM Wiki, and how that is different from RAG. Maybe go Caveman?

# Prompt log

```
I have a project here called atm that I was fixing on Tuesday this week. I want a Monday's version of
that html app brought to this project, into folder Monday. And today's version of that html app
brought to this project, into folder Thursday. Would you be able to do that for me?
```

```
Use playwright-cli to look at Monday and Thursday apps, and build basic property-based testing with
default properties for each, into folders Monday-test and Thursday-test. I want to use Bombadil for
property-based testing https://antithesishq.github.io/bombadil/index.html
```

```
I want to be able to run Monday-test saying 'demo Monday' and Thursday-test by saying 'demo Thursday'
on command line. Make my wish come true, like magic!
```

```
There's also project here called exploring-bombadil, with full set of tests. Bring those here under Full-test
folder. Now, I want to say 'magic Monday' to run this test for 60 seconds on Monday version, and 'magic Thursday' on the Monday version.
```

```
Just for the show of it, create me one playwright tests that uses the properties like I specified for Full-test.
Let me run it with 'magic playwright Monday' or 'magic playwright Tuesday'. Run it headful. Make it use webkit as bro
```
