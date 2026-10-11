export const STATES = Object.freeze([
  "understand",
  "qualify",
  "scope",
  "decide",
  "buy",
  "fulfill",
  "inspect",
  "accept",
  "follow_up",
  "triaged_out",
  "revision_requested",
  "closed",
]);

const NEXT = Object.freeze({
  understand: new Set(["qualify"]),
  qualify: new Set(["scope", "triaged_out"]),
  scope: new Set(["decide", "triaged_out"]),
  decide: new Set(["buy", "fulfill", "triaged_out"]),
  buy: new Set(["fulfill"]),
  fulfill: new Set(["inspect"]),
  inspect: new Set(["accept", "revision_requested"]),
  revision_requested: new Set(["fulfill"]),
  accept: new Set(["follow_up", "closed"]),
  follow_up: new Set(["closed"]),
  triaged_out: new Set(["closed"]),
  closed: new Set(),
});

export function transition(order, to, context = {}) {
  if (!order || typeof order !== "object") throw new TypeError("order is required");
  if (!STATES.includes(order.state)) throw new TypeError("unknown current state");
  if (!STATES.includes(to)) throw new TypeError("unknown target state");
  if (!NEXT[order.state].has(to)) throw new Error(`illegal transition: ${order.state} -> ${to}`);

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
    state: "understand",
    client: Object.freeze({ ...client }),
    concern,
    payment: Object.freeze({ state: client.role === "mock-client" ? "not-required" : "not-started" }),
    history: Object.freeze([]),
  });
}
