# Exploratory Testing & Security Assessment

**Product:** Product Hunt  
**API:** Product Hunt GraphQL API (`https://api.producthunt.com/v2/api/graphql`)  
**Assessment type:** Exploratory UI testing, API behavior testing, and limited security assessment  
**Status:** Completed within the available time

## 1. Executive Summary

Exploratory testing covered the Product Hunt homepage, navigation, category navigation, product details, search behavior, and selected GraphQL API operations.

The UI and API automation suites completed successfully, with **10 UI tests and 8 API tests passing**.

One reproducible UI inconsistency was identified: when a logged-out user clicks the upvote button, the displayed vote count increases even though authentication is required. Closing the authentication prompt leaves the increased count visible until the page is reloaded. The observed behavior suggests an optimistic UI update that is not rolled back; whether the vote is persisted on the server was not verified.

API exploration covered authentication failures, GraphQL validation errors, product lookup, pagination, and invalid cursors. No confirmed API security vulnerability was established during this assessment.

## 2. Scope and Approach

### UI exploration

- Homepage rendering and product links
- Primary navigation and category navigation
- Product detail page navigation
- Search using a known product name and a query with no matching results
- Logged-out upvote behavior and authentication prompt
- Basic navigation and visible content consistency

### API exploration

- Valid GraphQL requests
- Requests with missing or invalid authentication tokens
- GraphQL field validation errors
- Existing and nonexistent product lookups
- Pagination and cursor advancement
- Invalid cursor handling
- Response status codes and error structures
- Available rate-limit response headers

### Ethical boundaries

Testing was limited to ordinary product interactions and low-impact API requests. No destructive actions, credential attacks, automated high-volume requests, or attempts to access other users' private data were performed.

## 3. Findings Summary

| ID | Finding | Severity | Status |
|---|---|---|---|
| F-01 | Upvote count remains incremented after authentication is cancelled | Medium (provisional) | Reproduced |
| F-02 | Pagination returned 20 posts for both `first: 21` and `first: 100` | Low / Informational | Observed; expected limit unclear |
| F-03 | `first: 0` returned no edges while `hasNextPage` was `true` | Low / Informational | Observed; contract unclear |
| F-04 | Unknown GraphQL field returned HTTP 200 with a structured validation error | Informational | Observed |
| F-05 | Missing and invalid tokens returned HTTP 401 authentication errors | Positive security observation | Observed |
| F-06 | Existing and nonexistent product lookups behaved consistently with expected lookup semantics | Informational | Observed |
| F-07 | Invalid cursor returned HTTP 200 with a GraphQL error | Informational | Observed |

Severity ratings are provisional and reflect the observed user impact, not a verified production incident.

---

## 4. Detailed Findings

### F-01 — Upvote count remains incremented after authentication is cancelled

**Area:** UI / Authentication / Voting  
**Severity:** Medium (provisional)  
**Status:** Reproduced manually

**Steps to reproduce**

1. Open a product page while logged out.
2. Note the displayed upvote count.
3. Click the upvote button.
4. Observe the authentication or sign-in prompt.
5. Close the prompt without signing in.
6. Observe the displayed upvote count.
7. Reload the page and check the count again.

**Expected behavior**

If authentication is required and the user cancels the authentication flow, the displayed count should remain unchanged or revert to its original value.

**Actual behavior**

The count increases immediately after clicking upvote. Closing the authentication prompt does not restore the original count in the current tab. Reloading the page restores the original count.

**Impact**

The interface temporarily displays a vote count that may not reflect the persisted server-side state. This can mislead users and reduce confidence in displayed engagement metrics.

**Assessment**

The behavior is consistent with an optimistic UI update that is not rolled back when authentication is cancelled. Server-side persistence and enforcement were not independently verified. This finding does **not** establish an authentication bypass or an unauthorized persisted vote.

**Recommendation**

- Revert optimistic vote-count changes when authentication is cancelled or the vote request fails.
- Ensure unauthenticated vote mutations are rejected server-side.
- Add regression coverage for cancelling the authentication prompt and for failed vote requests.

### F-02 — Pagination returned the same number of posts for different requested page sizes

**Area:** GraphQL API / Pagination  
**Severity:** Low / Informational  
**Status:** Observed; requires clarification

**Observation**

Requests using `first: 21` and `first: 100` both returned 20 posts.

**Expected behavior**

The API should return a page size consistent with its documented pagination contract and any documented maximum page-size limit.

**Actual behavior**

Both requested sizes returned 20 posts in the observed responses.

**Impact**

If undocumented, this behavior may confuse API consumers who expect the requested page size to be honored.

**Recommendation**

Confirm whether the API intentionally caps page sizes at 20. Document the limit and validate pagination behavior against the published contract before treating this as a defect.

### F-03 — Zero-sized pagination request returned `hasNextPage: true`

**Area:** GraphQL API / Pagination  
**Severity:** Low / Informational  
**Status:** Observed; contract unclear

**Observation**

A request using `first: 0` returned an empty `edges` collection while reporting `hasNextPage: true`.

**Expected behavior**

The response should be consistent with the API's documented handling of zero-sized pages and its definition of `hasNextPage`.

**Actual behavior**

No edges were returned, but `hasNextPage` was true.

**Impact**

Consumers may interpret the response as indicating another page is available even though the current request returned no records. The exact impact depends on the intended pagination semantics.

**Recommendation**

Clarify whether zero is a valid page size. If it is unsupported, return a clear validation error; otherwise, ensure the page metadata follows the documented contract.

### F-04 — GraphQL validation errors returned HTTP 200

**Area:** GraphQL API / Error handling  
**Severity:** Informational  
**Status:** Observed; not necessarily a defect

**Observation**

A request referencing an unknown GraphQL field returned HTTP 200 with a structured GraphQL validation error identifying the invalid field.

**Expected behavior**

GraphQL clients should be able to distinguish successful execution from GraphQL validation failures by inspecting the response body, including its `errors` field.

**Actual behavior**

The HTTP response used status 200 despite containing a GraphQL validation error.

**Assessment**

This can be valid GraphQL behavior. HTTP 200 alone should not be interpreted as proof that a GraphQL operation succeeded.

**Recommendation**

Ensure client code checks the GraphQL response body for errors instead of relying solely on the HTTP status code.

### F-05 — Missing and invalid tokens were rejected

**Area:** API security / Authentication  
**Severity:** Positive security observation  
**Status:** Observed

**Observation**

Requests made with a missing token and an invalid token returned HTTP 401 and an authentication error identifying an invalid OAuth token.

**Expected behavior**

Requests requiring authentication should reject missing or invalid credentials.

**Actual behavior**

Both cases were rejected with HTTP 401.

**Assessment**

This is consistent with expected authentication enforcement for the tested requests. It does not establish that all endpoints, scopes, or mutation operations enforce authorization correctly.

**Recommendation**

Retain authentication regression tests and extend authorization coverage when time permits. Error messages should provide useful troubleshooting information without disclosing credentials or sensitive internal details.

### F-06 — Product lookup behavior was consistent for existing and nonexistent IDs

**Area:** GraphQL API / Product lookup  
**Severity:** Informational  
**Status:** Observed

**Observation**

An existing product could be retrieved by ID, and a nonexistent product ID returned `null`.

**Assessment**

This is consistent with common GraphQL lookup behavior. No inconsistency was identified in the tested cases.

**Recommendation**

Retain regression coverage for both existing and nonexistent product IDs.

### F-07 — Invalid cursor returned a structured GraphQL error

**Area:** GraphQL API / Pagination / Error handling  
**Severity:** Informational  
**Status:** Observed

**Observation**

An invalid cursor produced an HTTP 200 response containing a GraphQL error with the message `Invalid input`.

**Assessment**

The response communicates the invalid input, although the HTTP status alone does not indicate the operation failed. This is not, by itself, evidence of a defect.

**Recommendation**

Ensure clients handle GraphQL errors correctly and consider documenting invalid-cursor behavior.

---

## 5. UI Test Observations

The automated UI suite contained 10 passing tests covering:

- Homepage loading and visible product links
- Homepage sections and footer links
- Primary navigation and category navigation
- Navigation menu interaction
- Product detail navigation
- Search for a known product
- Search with a query that returns no results

Manual exploration also confirmed that the tested search queries produced results consistent with the queries in the observed cases.

Some punctuation and partial-term search behavior was explored, but the observations were not sufficient to establish a reproducible search defect. No search bug is claimed in this report.

## 6. API Test Observations

The automated API suite contained 8 passing tests covering:

- Successful post retrieval with a valid token
- Rejection of missing and invalid tokens
- Post field types
- Consistency between a post returned in a list and a single-post lookup
- Handling of nonexistent post IDs
- Pagination cursor advancement and avoiding overlap between pages
- GraphQL validation errors for an unknown field

The tested pagination sequence advanced its cursor and returned non-overlapping results. The page-size and zero-sized-page observations described in F-02 and F-03 warrant clarification but are not confirmed defects.

## 7. Security Assessment

### Authentication

Missing and invalid tokens were rejected with HTTP 401 in the tested scenarios. This is a positive observation, but the assessment did not cover every protected operation.

### Authorization

The logged-out upvote behavior was investigated at the UI level. The displayed count remained incremented after authentication was cancelled, but no evidence was collected to determine whether a vote was persisted server-side. Authorization enforcement for vote mutations therefore remains unverified.

### Input validation and error handling

The API returned structured GraphQL errors for an unknown field and an invalid cursor. These observations demonstrate error reporting for the tested inputs, not comprehensive validation of all malformed or unexpected requests.

### Rate limiting

Rate-limit-related response headers were observed. The assessment did not establish the enforcement threshold, behavior after the limit is reached, or whether rate limiting can be bypassed.

### Sensitive data exposure

No confirmed sensitive-data exposure was identified in the scenarios tested. Profile-field exposure, malformed JSON handling, CORS preflight behavior, requests without `Content-Type`, and GET requests to the GraphQL endpoint were outside the executed test coverage. These areas should be considered **not assessed**, rather than secure or defective.

## 8. Limitations

- Testing was time-boxed and exploratory rather than exhaustive.
- API behavior was assessed only for the requests and inputs described above.
- The upvote inconsistency was reproduced in the UI, but server-side vote persistence was not verified.
- API page-size limits and zero-sized pagination semantics were not confirmed against an authoritative contract.
- No comprehensive authorization, cross-user access, rate-limit enforcement, or sensitive-data exposure assessment was performed.
- Additional bug reports received from another source were not independently reproduced and are not included as confirmed findings.

## 9. Recommendations and Next Steps

1. Fix or investigate the upvote count rollback behavior and add regression tests.
2. Clarify pagination limits and the expected semantics of `first: 0`.
3. Continue checking GraphQL response bodies for errors, regardless of HTTP status.
4. Expand security coverage to include authorization of mutations, input handling, CORS behavior, and rate-limit enforcement.
5. Preserve the passing API and UI suites in CI to detect regressions.

## 10. Conclusion

The assessment identified one reproducible UI inconsistency involving an upvote count after cancelled authentication, along with API behaviors that merit clarification around pagination.

The tested API and UI automation suites passed. Missing and invalid credentials were rejected in the tested API scenarios, and no confirmed API security vulnerability was established within the limited scope of this assessment.

Findings are classified according to the available evidence. Untested scenarios are explicitly identified as not assessed rather than reported as either confirmed defects or verified-safe behavior.
