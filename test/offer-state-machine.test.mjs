import test from "node:test";
import assert from "node:assert/strict";
import { newOrder, transition } from "../src/offer-state-machine.mjs";

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
