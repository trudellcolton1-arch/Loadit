import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PAYMENT_STATES,
  LEGAL_TRANSITIONS,
  canTransition,
  assertTransition,
  recordTransition,
  type PaymentState,
} from "./stateMachine";
import { IllegalTransitionError } from "./errors";

test("the happy path is legal end to end", () => {
  const path: PaymentState[] = [
    "quoted",
    "intake_pending",
    "intake_confirmed",
    "converting",
    "paying_out",
    "settled",
  ];
  for (let i = 0; i < path.length - 1; i++) {
    assert.doesNotThrow(() => assertTransition(path[i], path[i + 1]));
  }
});

test("every live state can fail; failed can only heal", () => {
  for (const s of ["quoted", "intake_pending", "intake_confirmed", "converting", "paying_out"] as const) {
    assert.equal(canTransition(s, "failed"), true);
  }
  assert.deepEqual([...LEGAL_TRANSITIONS.failed], ["healing"]);
});

test("healing resumes only at legal re-entry points", () => {
  assert.equal(canTransition("healing", "quoted"), true);
  assert.equal(canTransition("healing", "intake_pending"), true);
  assert.equal(canTransition("healing", "converting"), true);
  assert.equal(canTransition("healing", "failed"), true);
  // Healing may never fabricate progress:
  assert.equal(canTransition("healing", "intake_confirmed"), false);
  assert.equal(canTransition("healing", "paying_out"), false);
  assert.equal(canTransition("healing", "settled"), false);
});

test("settled is terminal", () => {
  for (const to of PAYMENT_STATES) {
    assert.equal(canTransition("settled", to), false, `settled → ${to} must be illegal`);
  }
});

test("only transitions in the table are legal — everything else throws", () => {
  for (const from of PAYMENT_STATES) {
    for (const to of PAYMENT_STATES) {
      const legal = LEGAL_TRANSITIONS[from].includes(to);
      assert.equal(canTransition(from, to), legal, `${from} → ${to}`);
      if (legal) {
        assert.doesNotThrow(() => assertTransition(from, to));
      } else {
        assert.throws(() => assertTransition(from, to), IllegalTransitionError);
      }
    }
  }
});

test("skipping steps is illegal", () => {
  assert.throws(() => assertTransition("quoted", "paying_out"), IllegalTransitionError);
  assert.throws(() => assertTransition("quoted", "settled"), IllegalTransitionError);
  assert.throws(() => assertTransition("intake_pending", "settled"), IllegalTransitionError);
  assert.throws(() => assertTransition("intake_pending", "converting"), IllegalTransitionError);
  assert.throws(() => assertTransition("converting", "settled"), IllegalTransitionError);
  // No going backwards, either.
  assert.throws(() => assertTransition("converting", "intake_confirmed"), IllegalTransitionError);
  assert.throws(() => assertTransition("paying_out", "converting"), IllegalTransitionError);
});

test("recordTransition appends only legal transitions", () => {
  let history = recordTransition([], "quoted", "intake_pending", "door opened");
  history = recordTransition(history, "intake_pending", "intake_confirmed");
  assert.equal(history.length, 2);
  assert.equal(history[0].from, "quoted");
  assert.equal(history[1].to, "intake_confirmed");
  assert.throws(() => recordTransition(history, "intake_confirmed", "settled"), IllegalTransitionError);
});
