#!/usr/bin/env node
/** Create-only private preview from the original five-tier JSON, never a paid offer. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { newOrder, transition } from "../src/offer-state-machine.mjs";

const LADDER = fileURLToPath(new URL("../content/economics/offer-ladder.json", import.meta.url));
const TEMPLATE = fileURLToPath(new URL("../public/prototype/index.html", import.meta.url));
const MARK = '<section id="builder">';
const htmlText = value => String(value).replace(/[&<>"']/gu, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The original offer-state-machine has already admitted these as nonpayable hypotheses. */
export function renderMockOffers(template, choices, sourceDigest) {
  if (typeof template !== "string" || template.split(MARK).length !== 2) {
    throw new TypeError("mock-client template needs exactly one offer insertion boundary");
  }
  if (choices?.kind !== "causeway.ai-visibility.mock-offer-choices/v1" ||
      choices.paymentAuthorized !== false || choices.pricesApproved !== false ||
      choices.customerSelectionMade !== false || choices.candidates?.length !== 5 ||
      !/^[a-f0-9]{64}$/u.test(sourceDigest)) {
    throw new TypeError("only five source-bound, nonpayable mock options may be rendered");
  }
  const cards = choices.candidates.map(item => {
    if (item.paymentAllowed !== false || !item.tier || !item.outcome || !item.priceHypothesis) {
      throw new TypeError("incomplete or payable offer hypothesis");
    }
    return '<div class="card"><strong>' + htmlText(item.tier.replaceAll("-", " ")) + '</strong>' +
      '<p>' + htmlText(item.outcome) + '</p>' +
      '<p class="quiet">Pricing hypothesis only: ' + htmlText(item.priceHypothesis) + '</p></div>';
  }).join("\n");
  const section = '<section id="source-offer-hypotheses" data-source-sha256="' + sourceDigest + '">' +
    '<h2>Five possible next steps, not five things to buy</h2>' +
    '<p>These are unvalidated service and price hypotheses. No tier may be purchased or chosen by this private prototype. Free triage and no purchase remain legitimate outcomes.</p>' +
    '<div class="grid">' + cards + '</div>' +
    '<p class="quiet">Source-byte SHA-256: ' + sourceDigest +
    '. A digest does not prove Git custody, commercial authority, or service installation.</p>' +
    '</section>\n<div class="rule"></div>\n';
  return template.replace(MARK, section + MARK);
}

export async function compileMockPrototype({ read = readFile } = {}) {
  const bytes = await read(LADDER);
  const template = await read(TEMPLATE, "utf8");
  const original = JSON.parse(bytes.toString("utf8"));
  const digest = createHash("sha256").update(bytes).digest("hex");
  let order = newOrder({ id: "ai-visibility-mock-offer-readout",
    client: { role: "mock-client" }, concern: "Find the least-cost warranted action, including no sale" });
  for (const state of ["qualify", "scope"]) order = transition(order, state);
  order = transition(order, "decide", { offerLadder: original });
  if (order.state !== "decide" || order.payment.state !== "not-required") {
    throw new Error("mock readout lost its payment refusal");
  }
  return Object.freeze({
    html: renderMockOffers(template, order.offerChoices, digest),
    sourceDigest: digest, candidateCount: order.offerChoices.candidates.length, paymentAuthorized: false,
  });
}

/** Never modify original source HTML or a deployed site. */
export async function writeMockPrototype(output) {
  if (typeof output !== "string" || output.trim() === "") throw new TypeError("output path required");
  const built = await compileMockPrototype();
  await writeFile(output, built.html, { flag: "wx", mode: 0o600 });
  return Object.freeze({ output, sourceDigest: built.sourceDigest,
    candidateCount: built.candidateCount, paymentAuthorized: false, publication: "not-performed" });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--output") {
    process.stderr.write("Usage: build-mock-prototype --output NEW_HTML_FILE\n");
    process.exitCode = 2;
  } else {
    try { process.stdout.write(JSON.stringify(await writeMockPrototype(args[1])) + "\n"); }
    catch (error) { process.stderr.write("build-mock-prototype: " + error.message + "\n"); process.exitCode = 1; }
  }
}
