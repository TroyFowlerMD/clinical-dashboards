// Auto-check logic: when field A is checked, field B should auto-check with a rationale note.
// The user can manually uncheck B (override). If the trigger un-checks, the auto is reversed
// ONLY if the user hasn't manually overridden.

import { useRef, useEffect, useCallback } from "react";

export interface AutoCheckRule {
  // The field that gets auto-checked
  targetField: string;
  // Returns true if this rule's trigger condition is met
  condition: () => boolean;
  // Short explanation shown as the auto-note
  rationale: string;
}

/**
 * useAutoCheck — manages auto-check state for a single target field.
 *
 * Returns:
 *   autoActive   — whether this field is currently auto-checked (used to show the banner)
 *   userOverrode — user has manually unchecked despite trigger being active
 *   applyAuto    — call this in an effect to apply the rule to state
 */
export function buildAutoCheckManager() {
  // This is a plain object tracking overrides per field key, used by panels directly.
  // Each panel manages its own override state via useState.
  return {};
}

// Given a set of rules for a dimension, compute which fields should be auto-checked
// and what their rationale is. Returns a map of fieldName -> rationale string (if auto-active).
export function computeAutoChecks(rules: AutoCheckRule[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const rule of rules) {
    if (rule.condition()) {
      // Collect all rationales for this target (multiple triggers may apply)
      const existing = result.get(rule.targetField);
      if (existing) {
        result.set(rule.targetField, existing + "; " + rule.rationale);
      } else {
        result.set(rule.targetField, rule.rationale);
      }
    }
  }
  return result;
}
