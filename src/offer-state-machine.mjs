/**
 * The original Causeway offer author owns the W3C SCXML 1.0 instance graph.
 * Red Cup XML Engineering reads its standard syntax and closed transition
 * identities. This service continues to guard its own launch, payment,
 * customer scope, rights, and acceptance independently of any SCXML label.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readAtomicScxmlGraph } from "@red-cup-engineering/xml-document-rendering-service/scxml-atomic-graph";

const FLOW_BYTES = readFileSync(new URL("../content/product/offer-flow.scxml", import.meta.url));
const FLOW_TEXT = new TextDecoder("utf-8", { fatal: true }).decode(FLOW_BYTES);
export const FLOW_SOURCE_DIGEST = createHash("sha256").update(FLOW_BYTES).digest("hex");
export const OFFER_FLOW = readAtomicScxmlGraph(FLOW_TEXT);
if (OFFER_FLOW.name !== "aiVisibilityAssuranceOfferFlow" ||
    OFFER_FLOW.initial !== "understand" ||
    OFFER_FLOW.data.preparationState !== "prototype-contract-for-tufte-extraction" ||
    !Array.isArray(OFFER_FLOW.data.conditionallyPayableStages) ||
    OFFER_FLOW.data.conditionallyPayableStages.length !== 1 ||
    OFFER_FLOW.data.conditionallyPayableStages[0] !== "buy" ||
    !OFFER_FLOW.states.some(state => state.id === "closed" && state.final) ||
    OFFER_FLOW.states.filter(state => state.final).length !== 1) {
  throw new TypeError("AI Visibility service refuses an unqualified SCXML flow or payment-stage claim");
}
const questions = OFFER_FLOW.data.customerQuestions;
if (!questions || typeof questions !== "object" || Array.isArray(questions) ||
    Object.entries(questions).some(([id, question]) =>
      !OFFER_FLOW.states.some(state => state.id === id) ||
      typeof question !== "string" || !question.trim())) {
  throw new TypeError("AI Visibility SCXML must carry genuine customer questions for original states");
}
export const STATES = Object.freeze(OFFER_FLOW.states.map(state => state.id));
export const FLOW_QUESTIONS = Object.freeze(Object.entries(questions).map(([state, question]) =>
  Object.freeze({ state, question, conditionallyPayable: state === "buy" })));
const NEXT = new Map(OFFER_FLOW.states.map(state => [
  state.id, new Map(state.transitions.map(t => [t.event, t.target])),
]));

const REQUIRED_TIERS = Object.freeze([
  "triage", "snapshot", "independent-audit", "monitoring", "agency-assurance",
]);

/**
 * A source-owned product hypothesis readout, not a price, contract, offer,
 * payment authorization or AI-search measurement. The source document is
 * supplied by the caller that actually read its original bytes.
 */
export function projectOfferChoices(ladder) {
  if (!ladder || typeof ladder !== "object" || Array.isArray(ladder) ||
      ladder.id !== "ai-visibility-assurance-offer-ladder" ||
      ladder.status !== "hypotheses-not-launch-prices" ||
      !Array.isArray(ladder.candidates) ||
      ladder.candidates.length !== REQUIRED_TIERS.length) {
    throw new TypeError("AI Visibility offer ladder must be the original hypothesis-only catalog");
  }
  const seen = new Set();
  const choices = ladder.candidates.map(candidate => {
    const strings = ["tier", "priceHypothesis", "outcome"];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) ||
        strings.some(key => typeof candidate[key] !== "string" ||
          candidate[key].trim() !== candidate[key] || candidate[key].length === 0 ||
          candidate[key].length > 1000) ||
        !REQUIRED_TIERS.includes(candidate.tier) || seen.has(candidate.tier)) {
      throw new TypeError("invalid, missing or duplicated offer hypothesis tier");
    }
    seen.add(candidate.tier);
    if (candidate.tier === "triage" && candidate.priceHypothesis !== "free") {
      throw new TypeError("the original free triage may not become a paid offer");
    }
    return Object.freeze({
      tier: candidate.tier,
      outcome: candidate.outcome,
      priceHypothesis: candidate.priceHypothesis,
      paymentAllowed: false,
      ...(candidate.continuation ? { continuation: candidate.continuation } : {}),
      ...(candidate.whyExists ? { whyExists: candidate.whyExists } : {}),
      ...(candidate.differentiation ? { differentiation: candidate.differentiation } : {}),
      ...(candidate.rule ? { rule: candidate.rule } : {}),
    });
  });
  return Object.freeze({
    kind: "causeway.ai-visibility.mock-offer-choices/v1",
    source: ladder.id,
    sourceStatus: ladder.status,
    pricesApproved: false,
    paymentAuthorized: false,
    customerSelectionMade: false,
    candidates: Object.freeze(choices),
  });
}

export function transition(order, to, context = {}) {
  if (!order || typeof order !== "object") throw new TypeError("order is required");
  if (!STATES.includes(order.state)) throw new TypeError("unknown current state");
  if (!STATES.includes(to)) throw new TypeError("unknown target state");
  if (NEXT.get(order.state)?.get(`advance.${to}`) !== to) {
    throw new Error(`illegal transition: ${order.state} -> ${to}`);
  }

  const isMock = order.client?.role === "mock-client";
  const launchOpen = context.launchGate === "open";

  if (to === "buy" && isMock) {
    throw new Error("mock clients do not buy; proceed from decide to fulfill");
  }
  if (to === "buy" && !launchOpen) {
    throw new Error("external paid order refused: mock-client launch gate is closed");
  }
  if (order.client?.role !== "mock-client" && ["fulfill","inspect","accept","follow_up","closed"].includes(to)) {
    const paid = order.payment?.state === "settled";
    if (!paid && order.state !== "triaged_out") {
      throw new Error("external fulfillment requires settled payment");
    }
  }
  if (to === "triaged_out" && !context.recommendation) {
    throw new Error("triage-out requires a recorded least-cost recommendation");
  }
  if (to === "accept" && !context.deliverableEvidence) {
    throw new Error("acceptance requires inspectable deliverable evidence");
  }

  return Object.freeze({
    ...order,
    state: to,
    ...(to === "decide" && context.offerLadder !== undefined
      ? { offerChoices: projectOfferChoices(context.offerLadder) } : {}),
    history: Object.freeze([
      ...(order.history ?? []),
      Object.freeze({
        from: order.state,
        to,
        at: context.at ?? null,
        evidence: context.evidence ?? null,
      }),
    ]),
  });
}

export function newOrder({ id, client, concern }) {
  if (!id || !client || !concern) throw new TypeError("id, client, and concern are required");
  return Object.freeze({
    id,
    state: OFFER_FLOW.initial,
    client: Object.freeze({ ...client }),
    concern,
    payment: Object.freeze({ state: client.role === "mock-client" ? "not-required" : "not-started" }),
    history: Object.freeze([]),
  });
}
