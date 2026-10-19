import test from "node:test";
import assert from "node:assert/strict";
import { newOrder, transition, STATES, OFFER_FLOW, FLOW_QUESTIONS, FLOW_SOURCE_DIGEST } from "../src/offer-state-machine.mjs";

test("external payment is fail-closed before Leader launch approval", () => {
  let order = newOrder({
    id:"external-1",
    client:{ role:"external" },
    concern:"I do not know whether AI answers represent us correctly",
  });
  order = transition(order,"qualify");
  order = transition(order,"scope");
  order = transition(order,"decide");
  assert.throws(
    () => transition(order,"buy",{ launchGate:"closed" }),
    /launch gate is closed/u,
  );
});

test("mock client can dry-run fulfillment without payment", () => {
  let order = newOrder({
    id:"morgan-mock-1",
    client:{ role:"mock-client" },
    concern:"I want to know whether this is worth buying instead of a subscription tool",
  });
  for (const state of ["qualify","scope","decide","fulfill","inspect"]) {
    order = transition(order,state);
  }
  order = transition(order,"accept",{ deliverableEvidence:"mock-evidence-bundle" });
  assert.equal(order.state,"accept");
  assert.equal(order.payment.state,"not-required");
});

test("the service may settle by recommending no purchase", () => {
  let order = newOrder({
    id:"external-2",
    client:{ role:"external" },
    concern:"Mostly curious whether AI visibility matters at all",
  });
  order = transition(order,"qualify");
  order = transition(order,"triaged_out",{
    recommendation:"No paid work warranted; use the free self-check and revisit only if the observed failure changes.",
  });
  order = transition(order,"closed");
  assert.equal(order.state,"closed");
});

test("mock client cannot accidentally enter the buy state", () => {
  let order = newOrder({
    id:"morgan-mock-2",
    client:{ role:"mock-client" },
    concern:"dry run",
  });
  for (const state of ["qualify","scope","decide"]) order = transition(order,state);
  assert.throws(() => transition(order,"buy",{ launchGate:"open" }), /mock clients do not buy/u);
});


test("the original 12-state W3C SCXML source, not a duplicate JS map, selects actual allowed transitions", () => {
  assert.equal(OFFER_FLOW.format, "W3C-SCXML-1.0/atomic-graph");
  assert.equal(OFFER_FLOW.name, "aiVisibilityAssuranceOfferFlow");
  assert.equal(OFFER_FLOW.initial, "understand");
  assert.equal(STATES.length, 12);
  assert.deepEqual(STATES, OFFER_FLOW.states.map(state => state.id));
  assert.deepEqual(OFFER_FLOW.states.find(s => s.id === "decide").transitions.map(t => t.target),
    ["buy", "fulfill", "triaged_out"]);
  assert.equal(OFFER_FLOW.states.find(s => s.id === "closed").final, true);
  assert.deepEqual(OFFER_FLOW.data.conditionallyPayableStages, ["buy"]);
  assert.equal(FLOW_QUESTIONS.length, 9);
  assert.equal(FLOW_QUESTIONS.find(s => s.state === "scope").question,
    "What exactly would you test or deliver?");
  assert.equal(FLOW_QUESTIONS.find(s => s.state === "buy").conditionallyPayable, true);
  assert.match(FLOW_SOURCE_DIGEST, /^[a-f0-9]{64}$/u);
});

test("the authored SCXML revisions and no-sale route move real mock orders while authorization remains distinct", () => {
  let order = newOrder({ id: "graph-selected-1", client: { role: "mock-client" },
    concern: "I need evidence before committing to SEO expense" });
  assert.equal(order.state, OFFER_FLOW.initial);
  order = transition(order, "qualify");
  order = transition(order, "scope");
  order = transition(order, "decide");
  order = transition(order, "fulfill");
  order = transition(order, "inspect");
  order = transition(order, "revision_requested");
  order = transition(order, "fulfill");
  order = transition(order, "inspect");
  order = transition(order, "accept", { deliverableEvidence: "private-mock-evidence" });
  order = transition(order, "closed");
  assert.equal(order.state, "closed");
  assert.equal(order.history.length, 10);
  assert.equal(order.payment.state, "not-required");
  assert.throws(() => transition(order, "fulfill"), /illegal transition/u);

  let noSale = newOrder({ id: "graph-selected-2", client: { role: "external" },
    concern: "Probably no impact" });
  noSale = transition(noSale, "qualify");
  noSale = transition(noSale, "triaged_out", { recommendation: "No paid work warranted" });
  noSale = transition(noSale, "closed");
  assert.equal(noSale.state, "closed");
  assert.equal(noSale.payment.state, "not-started");
});
