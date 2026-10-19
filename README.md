# AI Visibility Assurance

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

The original `content/product/offer-surface-contract.json` was an unused
private proposal whose nine UI stages diverged from the twelve actual runtime
states and transitions in `src/offer-state-machine.mjs`. The authoritative
*Causeway instance flow* is now [`content/product/offer-flow.scxml`](content/product/offer-flow.scxml),
a **W3C SCXML 1.0** statechart. Its `state`, `final` and `transition` elements
represent the twelve actual runtime stages and seventeen existing transition
edges. The original nine customer questions, conditional paid-stage marker,
original contract identity, status, purpose, component ideas, constraints and
candidate TUFTE interface are carried unchanged as literal JSON values in
standard ECMAScript `datamodel/data` elements; no meaningful old field was
lost. Original JSON Git blob `e4a7132aa8e73793e832f56c8ee4344a2ec850da`
remains recoverable in history, rather than retained as an active parallel
truth. The earlier parent Public Services proposal snapshot remains historical
and is not promoted into a second active source.

The *actual source owner* is this Causeway product. The bounded **Engineering
consumer** is the original `@red-cup-engineering/xml-document-rendering-service`
`./scxml-atomic-graph` projection proposed at candidate version `0.2.0`;
it reuses the original XML 1.0/Namespaces reader and admits a narrow, strict
SCXML atomic subset. It is not an executable full-SCXML interpreter. The real
`transition` application now uses that source graph instead of another
hardcoded `STATES`/`NEXT` map, and separately retains the existing
mock-client, external-launch, payment, evidence and customer-acceptance gates.
SCXML's presence, a stage named `buy`, and an eventual `launchGate`
argument do **not** approve a sale, authorize payment or make a price live.


## Use the source-owned offer ladder in the private prototype

The five unvalidated service tiers live only in `content/economics/offer-ladder.json`.
The existing `src/offer-state-machine.mjs` reads them as mock-client decision options,
not launch prices, order authority, or current capability evidence.

From this service directory, run:

    npm run build:mock-prototype -- --output /absolute/path/private-prototype.html

The command consumes the canonical five-tier JSON *and the standard SCXML statechart*
through the existing state machine, plus `public/prototype/index.html`. It
projects the five nonpayable choices **and the nine actually authored customer
stage questions** into the private HTML, escapes text and records SHA-256
identities of the exact option and SCXML bytes loaded. Its output is create-only
(wx, mode 0600); it cannot overwrite the original template or an earlier preview.
Opening this local HTML is a private mock-client experience, not a publication,
checkout, customer order, accepted price, provider contract, or TUFTE installation.

`npm test` covers source consumption, two valid option orders, malformed
or duplicate catalogs, escaped content, create-only materialization and refusals.
Publication and any real paid purchase require the original separate
mock-client acceptance, authorization, release and independent receiving.
