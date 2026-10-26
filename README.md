# Spare QA Automation Assessment

## Overview

This repository contains UI end-to-end tests, GraphQL API tests, and exploratory testing findings for Product Hunt. The goal is to validate important user journeys, API behavior, and error handling while distinguishing confirmed defects from observations.

## Project Structure

```text
.
├── .github/workflows/tests.yml
├── api/
│   ├── src/client.ts
│   └── tests/posts.test.ts
├── ui/
│   ├── tests/
│   │   ├── homepage.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── product-details.spec.ts
│   │   └── search.spec.ts
│   └── playwright.config.ts
├── .env.example
├── FINDINGS.md
├── TEST_STRATEGY.md
└── README.md
```

## Setup

**Prerequisites:** [Bun](https://bun.sh/) and a Product Hunt API access token.

1. Clone the public repository and enter its directory.
2. Install dependencies for both suites:

   ```bash
   cd api
   bun install --frozen-lockfile

   cd ../ui
   bun install --frozen-lockfile
   ```

3. Create a `.env` file in the repository root using `.env.example` as a template. Set `PRODUCTHUNT_ACCESS_TOKEN` to your own valid token. Keep `.env` private and never commit it.
4. Install the Playwright Chromium browser:

   ```bash
   cd ui
   bunx playwright install chromium
   ```

## Running the Test Suites

### API tests

From the `api/` directory:

```bash
bun test
```

The suite covers successful requests, missing and invalid authentication, response types, post lookup, nonexistent posts, pagination, and GraphQL validation errors.

### UI end-to-end tests

From the `ui/` directory:

```bash
bunx playwright test
```

To run with a visible browser:

```bash
bunx playwright test --headed
```

The suite covers homepage content, product links and details, primary navigation, category navigation, search results, and no-results behavior.

## Summary of Findings

- **API:** Authentication failures and GraphQL validation errors return observable error responses. Post lookup and pagination behavior were also tested.
- **UI:** The tested homepage, navigation, product details, and search flows behaved as expected during exploratory testing.
- **Confirmed defects:** No confirmed defects were identified in the scenarios tested.
- **Limitations:** These results apply only to the tested scenarios and environment; they do not establish that the entire application is defect-free.

See [FINDINGS.md](FINDINGS.md) for the detailed exploratory observations and [TEST_STRATEGY.md](TEST_STRATEGY.md) for the testing approach.

## Architecture Decisions

- **TypeScript** provides typed API response models and test code.
- **Playwright** provides browser automation, locator-based assertions, and automatic waiting for UI conditions.
- **Bun's test runner and native `fetch`** keep the API test setup lightweight.
- **Separate API and UI suites** allow each suite to be installed, run, and diagnosed independently.
- **GitHub Actions** runs the API and UI suites as separate CI jobs. The API job reads its token from the `PRODUCTHUNT_ACCESS_TOKEN` repository secret.

## What I'd Do With More Time

- Add cross-browser and mobile viewport coverage.
- Expand API coverage for rate limits, malformed inputs, and additional pagination edge cases.
- Add more UI scenarios for filters, empty states, accessibility, and network failures.
- Improve test data management and add stronger isolation to reduce dependence on live application data.
- Run the workflow on GitHub, review CI artifacts, and refine retries or diagnostics based on actual failures.
- Continue exploratory testing and validate potential issues before reporting them as defects.