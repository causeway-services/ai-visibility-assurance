import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { projectOfferChoices, newOrder, transition, FLOW_SOURCE_DIGEST, FLOW_QUESTIONS } from "../src/offer-state-machine.mjs";
import { compileMockPrototype, renderMockOffers, writeMockPrototype } from "../scripts/build-mock-prototype.mjs";

const source = () => JSON.parse(readFileSync(new URL("../content/economics/offer-ladder.json", import.meta.url), "utf8"));
const template = () => readFileSync(new URL("../public/prototype/index.html", import.meta.url), "utf8");

test("the original five-tier JSON drives an actual mock-client decision, not just verification", () => {
  const original = source();
  let order = newOrder({ id: "mock-ladder", client: { role: "mock-client" }, concern: "least-cost evidence" });
  for (const step of ["qualify", "scope"]) order = transition(order, step);
  order = transition(order, "decide", { offerLadder: original });
  assert.equal(order.state, "decide");
  assert.equal(order.offerChoices.source, original.id);
  assert.equal(order.offerChoices.sourceStatus, "hypotheses-not-launch-prices");
  assert.equal(order.offerChoices.candidates.length, 5);
  assert.deepEqual(order.offerChoices.candidates.map(candidate => candidate.tier),
    ["triage", "snapshot", "independent-audit", "monitoring", "agency-assurance"]);
  assert.equal(order.offerChoices.candidates[0].priceHypothesis, "free");
  assert.equal(order.offerChoices.candidates[2].priceHypothesis, "USD 500 provisional");
  assert.equal(order.offerChoices.paymentAuthorized, false);
  assert.equal(order.offerChoices.pricesApproved, false);
  assert.equal(order.offerChoices.customerSelectionMade, false);
  assert.equal(order.payment.state, "not-required");
  assert.equal(order.history.at(-1).to, "decide");
  assert.equal(order.offerChoices.candidates.every(option => option.paymentAllowed === false), true);
  assert.throws(() => transition(order, "buy", { launchGate: "open" }), /mock clients do not buy/u);
});

test("a different valid authored option order stays a nonpayable decision rather than an invented ranking", () => {
  const original = source();
  const copy = { ...original, candidates: [...original.candidates].reverse() };
  const options = projectOfferChoices(copy);
  assert.deepEqual(options.candidates.map(option => option.tier),
    ["agency-assurance", "monitoring", "independent-audit", "snapshot", "triage"]);
  assert.equal(options.candidates[0].priceHypothesis, "B2B/white-label or portfolio pricing unvalidated");
  assert.equal(options.paymentAuthorized, false);
});

test("missing, duplicated, priced-free, or marketed-as-approved catalogs refuse", () => {
  const original = source();
  assert.throws(() => projectOfferChoices({ ...original, status: "published-prices" }), /hypothesis-only/u);
  assert.throws(() => projectOfferChoices({ ...original, candidates: original.candidates.slice(0, 4) }), /hypothesis-only/u);
  assert.throws(() => projectOfferChoices({ ...original, candidates: [...original.candidates.slice(0, 4), original.candidates[0]] }), /duplicated/u);
  assert.throws(() => projectOfferChoices({ ...original, candidates: original.candidates.map(c =>
    c.tier === "triage" ? { ...c, priceHypothesis: "USD 100" } : c) }), /free triage/u);
  assert.throws(() => projectOfferChoices({ ...original, candidates: original.candidates.map(c =>
    c.tier === "snapshot" ? { ...c, outcome: "" } : c) }), /invalid/u);
});

test("the actual canonical JSON and existing HTML become a visible mock offer surface with exact source-byte identity", async () => {
  const built = await compileMockPrototype();
  assert.equal(built.paymentAuthorized, false);
  assert.equal(built.candidateCount, 5);
  assert.equal(built.flowQuestionCount, 9);
  assert.equal(built.flowSourceDigest, FLOW_SOURCE_DIGEST);
  assert.match(built.sourceDigest, /^[a-f0-9]{64}$/u);
  assert.equal(built.html.includes('data-source-sha256="' + built.sourceDigest + '"'), true);
  assert.equal((built.html.match(/Pricing hypothesis only:/gu) ?? []).length, 5);
  assert.match(built.html, /No tier may be purchased/u);
  assert.match(built.html, /USD 500 provisional/u);
  assert.match(built.html, /Free triage and no purchase/u);
  assert.match(built.html, /source-offer-flow/u);
  assert.match(built.html, /W3C statechart/u);
  assert.match(built.html, /What exactly would you test or deliver/u);
  assert.match(built.html, /What am I agreeing to and paying for/u);
  assert.ok(built.html.includes(`data-flow-scxml-sha256="${FLOW_SOURCE_DIGEST}"`));
  assert.equal(FLOW_QUESTIONS.filter(x => x.conditionallyPayable).length, 1);
  assert.match(built.html, /unavailable in this private mock/u);
  assert.doesNotMatch(built.html, /<button[^>]*>Buy</u);
  assert.match(built.html, /<section id="builder">/u);
  assert.equal((built.html.match(/id="builder"/gu) ?? []).length, 1);
  assert.equal(template().includes('id="source-offer-hypotheses"'), false, "original template remains unchanged");
});

test("rendering is escaped and refuses an unbound, unknown or duplicated template consumer", () => {
  const original = source();
  const choices = projectOfferChoices({ ...original,
    candidates: original.candidates.map(c => c.tier === "snapshot"
      ? { ...c, outcome: "<script>alert('x')</script>" } : c) });
  const digest = "a".repeat(64);
  const page = renderMockOffers(template(), choices, digest);
  assert.match(page, /&lt;script&gt;alert/u);
  assert.doesNotMatch(page, /<script>alert/u);
  assert.throws(() => renderMockOffers(template() + '<section id="builder">', choices, digest), /exactly one/u);
  assert.throws(() => renderMockOffers(template(), { ...choices, paymentAuthorized: true }, digest), /nonpayable/u);
  assert.throws(() => renderMockOffers(template(), choices, "main"), /nonpayable/u);
});

test("a lawful local materialization is create-only, read-backable and does not modify the original source", async () => {
  const directory = mkdtempSync(join(tmpdir(), "ai-visibility-options-"));
  const output = join(directory, "private-prototype.html");
  const originalTemplate = template();
  try {
    const first = await writeMockPrototype(output);
    assert.equal(first.candidateCount, 5);
    assert.equal(first.paymentAuthorized, false);
    assert.equal(first.flowSourceDigest, FLOW_SOURCE_DIGEST);
    assert.equal(first.flowQuestionCount, 9);
    assert.equal(first.publication, "not-performed");
    assert.equal(existsSync(output), true);
    assert.equal(readFileSync(output, "utf8").includes(first.sourceDigest), true);
    await assert.rejects(() => writeMockPrototype(output), /EEXIST/u);
    assert.equal(template(), originalTemplate);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
