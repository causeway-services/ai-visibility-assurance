# AI Visibility Assurance

<!-- 561-group-standards:badges:start -->
[![Causeway Services](https://img.shields.io/badge/561%20Group-Causeway%20Services-115e69)](https://github.com/causeway-services)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-115e69)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/causeway-services/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

AI Visibility Assurance is an **incubating market-facing micro-enterprise of
Causeway Services**.

It exists to answer a narrower and more useful question than "how do I rank
in AI search?":

> **Is AI-mediated discovery failing this organization in a way that is
> materially worth fixing, and what evidence supports the next action?**

The micro-enterprise deliberately separates six stages that marketing
products often collapse into one score:

1. crawl/index eligibility;
2. entity resolution;
3. retrieval for buyer-relevant questions;
4. citation or mention;
5. factual representation and prominence;
6. conversion into an observable customer action.

The unit may recommend no paid action, a cheaper self-service tool, an
existing SEO provider, a bounded one-time audit, monitoring, or later
implementation. "Do not buy anything" is a valid successful settlement.

## Current phase

**Private mock-client QA.** Morgan Sennhauser is the founding mock client.
External solicitation and paid external orders are prohibited until Morgan
has completed an end-to-end dry run and explicitly approves launch.

The previously created Stripe checkout remains disabled during this phase.
USD 500 is a **provisional test price**, not validated market pricing.

## Product surface

The intended product surface is not a brochure plus checkout. Each offer is
a small executable service application whose customer state moves through:

`understand → qualify → scope → decide → buy → fulfill → inspect → accept → follow-up`

The customer should be able to learn enough before payment to decide that
the service is unnecessary or that a cheaper alternative is sufficient.
After purchase, the same durable state becomes the work order, fulfillment
record, evidence surface, delivery surface, and acceptance receipt.

The first framework-independent HTML prototype lives at
`public/prototype/index.html`. The repeated pattern is a candidate input
to the future Tiling User Form Topology Engine (TUFTE); this repository does
not pretend that engine is already implemented.

## Use the source-owned offer ladder in the private prototype

The five unvalidated service tiers live only in `content/economics/offer-ladder.json`.
The existing `src/offer-state-machine.mjs` reads them as mock-client decision options,
not launch prices, order authority, or current capability evidence.

From this service directory, run:

    npm run build:mock-prototype -- --output /absolute/path/private-prototype.html

The command consumes the canonical JSON and `public/prototype/index.html`, projects
all five options through the existing state machine, escapes HTML text and
records a SHA-256 of exactly the catalog bytes observed. Its output is create-only
(wx, mode 0600); it cannot overwrite the original template or an earlier preview.
Opening this local HTML is a private mock-client experience, not a publication,
checkout, customer order, accepted price, provider contract, or TUFTE installation.

`npm test` covers source consumption, two valid option orders, malformed
or duplicate catalogs, escaped content, create-only materialization and refusals.
Publication and any real paid purchase require the original separate
mock-client acceptance, authorization, release and independent receiving.
