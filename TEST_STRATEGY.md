# Test Strategy — Product Hunt

## 1. Objectives

As the sole QA engineer, my priority would be to protect the core user journeys, maintain trust in product and engagement data, and identify high-impact regressions early. I would use a risk-based approach, combining automated regression tests with focused exploratory and security testing.

## 2. Highest-Priority Areas

| Priority | Area | What matters and why |
|---|---|---|
| P0 | Authentication and authorization | Ensure protected actions require authentication, sessions behave correctly, and unauthorized requests cannot modify data. |
| P0 | Core product interactions | Validate product discovery, product details, upvoting, and vote-count consistency because these directly affect user trust and engagement. |
| P1 | Search and navigation | Verify relevant search results, empty states, category navigation, and product links so users can reliably discover products. |
| P1 | GraphQL API correctness | Validate response structures, field types, errors, pagination, cursor handling, and consistency between list and detail queries. |
| P1 | Security and privacy | Check access control, input validation, safe error responses, sensitive-data exposure, and rate limiting using authorized, low-impact tests. |
| P2 | Compatibility and resilience | Cover critical journeys across supported browsers, network failures, loading states, and API failures. |

## 3. Test Approach

- **API automation:** Use TypeScript and Bun to validate successful requests, authentication failures, response schemas, product lookups, pagination, and GraphQL errors.
- **UI automation:** Use Playwright for critical end-to-end journeys, navigation, search, product details, and authentication-dependent interactions.
- **Exploratory testing:** Investigate edge cases, inconsistent UI states, unusual inputs, and workflows that automated tests may miss.
- **Regression and CI:** Run reliable API and UI suites on pull requests and important changes. Keep tests deterministic and investigate failures before release.
- **Security testing:** Start with authentication and authorization boundaries, then cover input handling, privacy, and rate limiting without destructive or high-volume testing.

## 4. Test Data and Environments

Use stable, known product records and controlled test accounts where available. Keep access tokens in environment variables or CI secrets, never in source control. Avoid destructive changes to production data and clearly separate test-environment limitations from product defects.

## 5. Success Criteria and Prioritization

Block a release for confirmed critical security issues, unauthorized data modification, or failures in essential user journeys. Prioritize defects by user impact, likelihood, and scope. Track reproducible findings with steps, expected versus actual behavior, evidence, severity, and regression coverage.

## 6. What I Would Improve With More Time

Expand coverage for authorization and mutation behavior, cross-browser testing, API failure handling, pagination boundaries, accessibility, and performance. Use production-safe monitoring and defect trends to continuously refine the highest-risk tests.