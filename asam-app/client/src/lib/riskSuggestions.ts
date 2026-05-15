// Clinical logic for auto-suggesting ASAM dimension risk ratings
// Physician always retains final authority.
// Logic aligned with ASAM 3rd Edition criteria.

import type { D1Core, D1Extra, D2Core, D3Core, D4Core, D5Core, D6Core } from "@shared/schema";

export interface RiskSuggestion {
  suggested: 0 | 1 | 2 | 3 | 4;
  rationale: string;
  alert: string | null;
  alertLevel: "critical" | "warning" | null;
}

// ── D1: Acute Intoxication / Withdrawal ─────────────────────────────────────
export function computeD1Suggestion(core: D1Core, extra: D1Extra): RiskSuggestion {
  const reasons: string[] = [];
  let score = 0;
  let alert: string | null = null;
  let alertLevel: "critical" | "warning" | null = null;

  const isCritical = core.historyOfDTs || core.historyOfWithdrawalSeizures || core.ivFluidOrPressor;
  if (isCritical) {
    score = 4;
    const flags = [
      core.historyOfDTs && "prior DTs",
      core.historyOfWithdrawalSeizures && "prior withdrawal seizures",
      core.ivFluidOrPressor && "IV fluid/vasopressor need",
    ].filter(Boolean).join(", ");
    reasons.push(`Severe risk: ${flags}`);
    alert = `High-risk withdrawal history detected (${flags}). ASAM criteria support a minimum D1 rating of 3–4. Medical supervision and detox pharmacology are strongly indicated.`;
    alertLevel = "critical";
  }

  const ciwaNum = parseClinicalScore(core.ciwaScore);
  const cowsNum = parseClinicalScore(core.cowsScore);

  if (ciwaNum !== null) {
    if (ciwaNum >= 15) {
      score = Math.max(score, 4); reasons.push(`CIWA-Ar ${ciwaNum} (severe ≥15)`);
      if (!alert) { alert = `CIWA-Ar ${ciwaNum} indicates severe alcohol withdrawal. Benzodiazepine protocol and medical monitoring required.`; alertLevel = "critical"; }
    } else if (ciwaNum >= 10) {
      score = Math.max(score, 3); reasons.push(`CIWA-Ar ${ciwaNum} (moderate-severe 10–14)`);
      if (!alert) { alert = `CIWA-Ar ${ciwaNum} suggests moderate-severe withdrawal. Consider symptom-triggered or fixed-schedule benzodiazepine protocol.`; alertLevel = "warning"; }
    } else if (ciwaNum >= 5) {
      score = Math.max(score, 2); reasons.push(`CIWA-Ar ${ciwaNum} (mild-moderate 5–9)`);
    } else if (ciwaNum > 0) {
      score = Math.max(score, 1); reasons.push(`CIWA-Ar ${ciwaNum} (mild <5)`);
    }
  }

  if (cowsNum !== null) {
    if (cowsNum >= 25) {
      score = Math.max(score, 4); reasons.push(`COWS ${cowsNum} (severe ≥25)`);
      if (!alert) { alert = `COWS ${cowsNum} indicates severe opioid withdrawal. Buprenorphine induction or full agonist stabilization indicated.`; alertLevel = "critical"; }
    } else if (cowsNum >= 13) {
      score = Math.max(score, 3); reasons.push(`COWS ${cowsNum} (moderate 13–24)`);
      if (!alert) { alert = `COWS ${cowsNum} indicates moderate opioid withdrawal. Buprenorphine induction should be considered.`; alertLevel = "warning"; }
    } else if (cowsNum >= 5) {
      score = Math.max(score, 2); reasons.push(`COWS ${cowsNum} (mild 5–12)`);
    } else if (cowsNum > 0) {
      score = Math.max(score, 1); reasons.push(`COWS ${cowsNum} (minimal <5)`);
    }
  }

  if (core.activeWithdrawal && core.activeIntoxication) {
    score = Math.max(score, 3); reasons.push("Active withdrawal + intoxication simultaneously");
  } else if (core.activeWithdrawal) {
    score = Math.max(score, 2); reasons.push("Active withdrawal signs present");
  } else if (core.activeIntoxication) {
    score = Math.max(score, 2); reasons.push("Active intoxication at admission");
  }

  if (core.requiresDetoxPharmacology) { score = Math.max(score, 3); reasons.push("Detox pharmacology required"); }
  if (core.requiresMedicalMonitoring) { score = Math.max(score, 2); reasons.push("Medical monitoring needed"); }

  if (core.polySubstanceUse && score >= 2) {
    score = Math.min(4, score + 1) as 0|1|2|3|4;
    reasons.push("Polysubstance use amplifies risk");
    if (!alert && score >= 3) { alert = "Polysubstance use with active withdrawal increases risk of unpredictable severity."; alertLevel = "warning"; }
  }

  if (extra.priorDetoxMultiple && score >= 2) { score = Math.min(4, score + 1) as 0|1|2|3|4; reasons.push("Kindling risk (multiple prior detoxes)"); }
  if (extra.neurologicVulnerability && score >= 2) {
    score = Math.min(4, Math.max(score, 3)) as 0|1|2|3|4; reasons.push("Neurologic vulnerability lowers seizure threshold");
    if (!alert) { alert = "Neurologic vulnerability (TBI, seizure disorder) significantly elevates withdrawal seizure risk."; alertLevel = "warning"; }
  }
  if (extra.chronicHeavyUse && score === 0) { score = 1; reasons.push("Chronic heavy use — physiologic dependence expected"); }

  if (reasons.length === 0) return { suggested: 0, rationale: "No active withdrawal or intoxication indicators checked", alert: null, alertLevel: null };
  return { suggested: score as 0|1|2|3|4, rationale: reasons.join(" · "), alert, alertLevel };
}

// ── D2: Biomedical Conditions ────────────────────────────────────────────────
export function computeD2Suggestion(core: D2Core): RiskSuggestion {
  const reasons: string[] = [];
  let score = 0;
  let alert: string | null = null;
  let alertLevel: "critical" | "warning" | null = null;

  // Critical: requires daily nursing or IV-level needs
  if (core.requiresDailyNursingMonitoring) { score = Math.max(score, 3); reasons.push("Requires daily nursing monitoring"); }
  if (core.requiresLabOrVitalMonitoring) { score = Math.max(score, 2); reasons.push("Lab/vital monitoring needed"); }

  // Active serious medical conditions → severity 3–4
  if (core.infectiousDisease) {
    score = Math.max(score, 3); reasons.push("Active infectious disease (HIV/HCV/endocarditis)");
    if (!alert) { alert = "Active infectious disease requires medical monitoring and medication management at this level of care."; alertLevel = "warning"; }
  }
  if (core.hepaticDisease) {
    score = Math.max(score, 3); reasons.push("Hepatic disease");
    if (!alert) { alert = "Hepatic disease affects medication metabolism and increases withdrawal risk. Medical oversight required."; alertLevel = "warning"; }
  }
  if (core.cardiovascularDisease) {
    score = Math.max(score, 3); reasons.push("Cardiovascular disease");
    if (!alert) { alert = "Cardiovascular disease requires medical stabilization prior to intensive SUD treatment."; alertLevel = "warning"; }
  }
  if (core.pregnancyOrPostpartum) {
    score = Math.max(score, 3); reasons.push("Pregnancy or postpartum");
    alert = "Pregnancy/postpartum requires specialized obstetric coordination and close maternal-fetal monitoring."; alertLevel = "critical";
  }
  if (core.activeMedicalCondition) { score = Math.max(score, 2); reasons.push("Active medical condition"); }
  if (core.diabetesOrMetabolicCondition) { score = Math.max(score, 2); reasons.push("Diabetes/metabolic condition"); }
  if (core.recentHospitalization) { score = Math.max(score, 2); reasons.push("Recent hospitalization within 30 days"); }
  if (core.medicationManagementNeeded) { score = Math.max(score, 2); reasons.push("Complex medication management needed"); }

  if (reasons.length === 0) return { suggested: 0, rationale: "No active biomedical conditions documented", alert: null, alertLevel: null };
  return { suggested: score as 0|1|2|3|4, rationale: reasons.join(" · "), alert, alertLevel };
}

// ── D3: Psychiatric / Behavioral / Cognitive ─────────────────────────────────
export function computeD3Suggestion(core: D3Core): RiskSuggestion {
  const reasons: string[] = [];
  let score = 0;
  let alert: string | null = null;
  let alertLevel: "critical" | "warning" | null = null;

  // Immediate safety → 4
  if (core.activeSuicidalIdeation || core.recentSuicideAttempt || core.activeHomicidalIdeation) {
    score = 4;
    const flags = [
      core.activeSuicidalIdeation && "active SI",
      core.recentSuicideAttempt && "recent suicide attempt",
      core.activeHomicidalIdeation && "active HI",
    ].filter(Boolean).join(", ");
    reasons.push(`Active safety risk: ${flags}`);
    alert = `Immediate safety risk identified (${flags}). Safety planning and psychiatric evaluation required before any step-down consideration.`;
    alertLevel = "critical";
  }

  if (core.activePsychosis) { score = Math.max(score, 4); reasons.push("Active psychosis"); if (!alert) { alert = "Active psychosis requires inpatient psychiatric stabilization concurrent with SUD treatment."; alertLevel = "critical"; } }
  if (core.activeMania) { score = Math.max(score, 4); reasons.push("Active mania/hypomania"); if (!alert) { alert = "Active mania requires mood stabilization before lower-intensity SUD care is safe."; alertLevel = "critical"; } }
  if (core.gravityDisabilityPresent) { score = Math.max(score, 4); reasons.push("Gravely disabled"); }
  if (core.impairedRealityTesting) { score = Math.max(score, 3); reasons.push("Impaired reality testing"); }
  if (core.severeMoodDisturbance) { score = Math.max(score, 3); reasons.push("Severe mood disturbance"); }
  if (core.severeAnxietyOrPanic) { score = Math.max(score, 2); reasons.push("Severe anxiety/panic"); }
  if (core.requiresPsychMedManagement) { score = Math.max(score, 3); reasons.push("Requires psychiatric medication management"); }
  if (core.requiresPsychiatricMonitoring) { score = Math.max(score, 2); reasons.push("Requires psychiatric monitoring"); }
  if (core.impairedSelfCare) { score = Math.max(score, 2); reasons.push("Impaired self-care/ADLs"); }

  // Co-occurring diagnoses add to baseline
  const dxCount = [core.diagnosedMDD, core.diagnosedBipolar, core.diagnosedSchizophreniaSpectrum, core.diagnosedPTSD, core.diagnosedADHD, core.diagnosedPersonalityDisorder].filter(Boolean).length;
  if (dxCount >= 2) { score = Math.max(score, 2); reasons.push(`${dxCount} co-occurring psychiatric diagnoses`); }
  else if (dxCount === 1) { score = Math.max(score, 1); reasons.push("Co-occurring psychiatric diagnosis"); }

  if (reasons.length === 0) return { suggested: 0, rationale: "No active psychiatric indicators documented", alert: null, alertLevel: null };
  return { suggested: score as 0|1|2|3|4, rationale: reasons.join(" · "), alert, alertLevel };
}

// ── D4: Readiness to Change ──────────────────────────────────────────────────
export function computeD4Suggestion(core: D4Core): RiskSuggestion {
  const reasons: string[] = [];
  let score = 0;
  let alert: string | null = null;
  let alertLevel: "critical" | "warning" | null = null;

  // Precontemplation + denial = highest barrier
  if (core.stagePrecontemplation && core.deniesToHaveProblem) {
    score = Math.max(score, 4); reasons.push("Precontemplation + denial — significant engagement challenge");
    alert = "Patient in precontemplation with denial of problem. MI-focused intervention required. Consider LOC impact of low readiness on treatment engagement."; alertLevel = "warning";
  } else if (core.stagePrecontemplation || core.deniesToHaveProblem) {
    score = Math.max(score, 3); reasons.push(core.stagePrecontemplation ? "Precontemplation stage" : "Denies having a problem");
  }
  if (core.externalPressureOnly) { score = Math.max(score, 3); reasons.push("External pressure only — no intrinsic motivation"); }
  if (core.ambivalentAboutTreatment) { score = Math.max(score, 2); reasons.push("Ambivalent about treatment"); }
  if (core.refusedMedicationAssistedTreatment) { score = Math.max(score, 2); reasons.push("Refused MAT"); }
  if (core.limitedInsightIntoSeverity) { score = Math.max(score, 2); reasons.push("Limited insight into illness severity"); }
  if (core.stageContemplation) { score = Math.max(score, 2); reasons.push("Contemplation stage — ambivalence present"); }
  if (core.stagePreparation) { score = Math.max(score, 1); reasons.push("Preparation stage"); }
  if (core.stageAction) { score = Math.max(score, 0); reasons.push("Action stage — actively engaged"); }

  if (reasons.length === 0) return { suggested: 0, rationale: "No motivation or readiness barriers documented", alert: null, alertLevel: null };
  return { suggested: score as 0|1|2|3|4, rationale: reasons.join(" · "), alert, alertLevel };
}

// ── D5: Relapse / Continued Use Potential ───────────────────────────────────
export function computeD5Suggestion(core: D5Core): RiskSuggestion {
  const reasons: string[] = [];
  let score = 0;
  let alert: string | null = null;
  let alertLevel: "critical" | "warning" | null = null;

  if (core.dailyOrNearDailyUse && core.useToPreventWithdrawal) {
    score = Math.max(score, 4); reasons.push("Daily use to prevent withdrawal — physiologic dependence driving continued use");
    alert = "Physiologic dependence with daily use indicates high risk of relapse without medically supervised detox and MAT."; alertLevel = "warning";
  } else if (core.dailyOrNearDailyUse) {
    score = Math.max(score, 3); reasons.push("Daily or near-daily use pattern");
  }
  if (core.relapsedFromPriorLevel) { score = Math.max(score, 3); reasons.push("Relapsed from prior level of care"); }
  if (core.multiplePriorTreatmentEpisodes) { score = Math.max(score, 2); reasons.push("Multiple prior treatment episodes"); }
  if (core.priorASAM37Admission) { score = Math.max(score, 2); reasons.push("Prior ASAM 3.7 admission"); }
  if (core.coOccurringDisorderUntreated) {
    score = Math.max(score, 3); reasons.push("Untreated co-occurring disorder driving relapse");
    if (!alert) { alert = "Untreated co-occurring psychiatric disorder is a primary relapse driver — integrated treatment essential."; alertLevel = "warning"; }
  }
  if (core.triggerRichEnvironment) { score = Math.max(score, 2); reasons.push("Trigger-rich home/social environment"); }
  if (core.cravingsHighAtAdmission) { score = Math.max(score, 2); reasons.push("High cravings at admission"); }
  if (core.lackOfCopingSkills) { score = Math.max(score, 2); reasons.push("Lacks adequate coping skills"); }
  if (core.priorDetoxOnlyNoFollowup) { score = Math.max(score, 2); reasons.push("Prior detox only — no step-down follow-up"); }

  if (reasons.length === 0) return { suggested: 0, rationale: "No relapse risk indicators documented", alert: null, alertLevel: null };
  return { suggested: score as 0|1|2|3|4, rationale: reasons.join(" · "), alert, alertLevel };
}

// ── D6: Recovery / Living Environment ───────────────────────────────────────
export function computeD6Suggestion(core: D6Core): RiskSuggestion {
  const reasons: string[] = [];
  let score = 0;
  let alert: string | null = null;
  let alertLevel: "critical" | "warning" | null = null;

  if (core.homelessOrUnstableHousing) {
    score = Math.max(score, 4); reasons.push("Homeless or unstable housing");
    alert = "Homelessness is a critical discharge barrier. A safe discharge environment must be secured before step-down is clinically appropriate."; alertLevel = "critical";
  }
  if (core.unsafeOrAbusiveHomeEnvironment) {
    score = Math.max(score, 4); reasons.push("Unsafe or abusive home environment");
    if (!alert) { alert = "Unsafe or abusive home environment — discharge plan must address safety and may require APS/DV referral."; alertLevel = "critical"; }
  }
  if (core.livesWithActiveSubstanceUsers) { score = Math.max(score, 3); reasons.push("Lives with active substance users"); }
  if (core.noAftercarePlanInPlace) { score = Math.max(score, 3); reasons.push("No aftercare plan in place"); }
  if (core.priorDischargeAMAOrExpelled) { score = Math.max(score, 3); reasons.push("Prior AMA discharge or expulsion"); }
  if (core.lacksFamilyOrSocialSupport) { score = Math.max(score, 2); reasons.push("Lacks social support"); }
  if (core.legalIssuesPending) { score = Math.max(score, 2); reasons.push("Pending legal issues"); }
  if (core.unemployedOrFinancialInstability) { score = Math.max(score, 2); reasons.push("Financial instability"); }
  if (core.transportationBarrier) { score = Math.max(score, 1); reasons.push("Transportation barrier to aftercare"); }
  if (core.childProtectiveServicesInvolved) {
    score = Math.max(score, 2); reasons.push("CPS involvement");
    if (!alert) { alert = "CPS involvement requires coordinated discharge planning with child welfare team."; alertLevel = "warning"; }
  }

  if (reasons.length === 0) return { suggested: 0, rationale: "No recovery environment barriers documented", alert: null, alertLevel: null };
  return { suggested: score as 0|1|2|3|4, rationale: reasons.join(" · "), alert, alertLevel };
}

// Extracts a numeric score from strings like "CIWA-Ar 14", "14", "COWS: 8"
export function parseClinicalScore(raw: string): number | null {
  if (!raw || raw.trim() === "") return null;
  const match = raw.match(/\d+(\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return isNaN(n) ? null : n;
}
