/**
 * Rule-Based Clinical Output Engine
 * Deterministic, no-LLM fallback that produces structured clinical documentation
 * from ASAM form inputs. Outputs match the same GeneratedOutput interface as Gemini.
 *
 * Design principles:
 * - Each dimension contributes prose sentences keyed to checked findings + notes
 * - Risk ratings anchor severity language (0=none, 1=low, 2=moderate, 3=high, 4=severe)
 * - LOC-specific framing (3.7 vs 3.5 vs both)
 * - NC Medicaid language when ncMedicaid=true
 * - Free-text notes from each CheckRow are incorporated where present
 */

import type {
  LLMPayload, GeneratedOutput, RiskRating,
  D1Core, D1Extra, D2Core, D2Extra, D3Core, D3Extra,
  D4Core, D4Extra, D5Core, D5Extra, D6Core, D6Extra,
  Configuration, DashboardState,
} from "@shared/schema";

// ─── Utility helpers ──────────────────────────────────────────────────────────

const RISK_LABEL: Record<RiskRating, string> = {
  0: "no significant",
  1: "mild",
  2: "moderate",
  3: "high",
  4: "severe",
};

const RISK_SEVERITY: Record<RiskRating, string> = {
  0: "no clinically significant findings",
  1: "mild risk warranting monitoring",
  2: "moderate risk requiring structured support",
  3: "high risk necessitating intensive intervention",
  4: "severe risk requiring immediate medically monitored care",
};

/** Append a note inline if present */
const withNote = (note?: string) =>
  note && note.trim() ? ` (${note.trim()})` : "";

/** Join an array of truthy strings into a comma-separated phrase */
const joinFindings = (items: (string | false | undefined | null)[]) =>
  items.filter(Boolean).join("; ");

/** Wrap in a paragraph if non-empty */
const para = (s: string) => (s.trim() ? s.trim() + " " : "");

// ─── D1 Narrative ─────────────────────────────────────────────────────────────

function buildD1(d1: D1Core, _extra: D1Extra): string {
  const r = d1.riskRating;
  if (r === 0 && !d1.activeIntoxication && !d1.activeWithdrawal) {
    return "Dimension 1 (Acute Intoxication/Withdrawal Potential): No acute intoxication or withdrawal was identified at the time of assessment. This dimension does not independently justify the requested level of care.";
  }

  const substances: string[] = [];
  if (d1.alcoholPrimary) substances.push("alcohol" + withNote(d1.alcoholPrimaryNote));
  if (d1.opioidPrimary) substances.push("opioids" + withNote(d1.opioidPrimaryNote));
  if (d1.benzodiazepinePrimary) substances.push("benzodiazepines" + withNote(d1.benzodiazepinePrimaryNote));
  if (d1.stimulantPrimary) substances.push("stimulants" + withNote(d1.stimulantPrimaryNote));
  if (d1.cannabisPrimary) substances.push("cannabis" + withNote(d1.cannabisPrimaryNote));

  const substanceStr = substances.length
    ? `Primary substance(s) of concern: ${substances.join(", ")}.`
    : "";

  const withdrawal: string[] = [];
  if (d1.activeWithdrawal) withdrawal.push(`active withdrawal${withNote(d1.activeWithdrawalNote)}`);
  if (d1.historyOfDTs) withdrawal.push(`history of delirium tremens${withNote(d1.historyOfDTsNote)}`);
  if (d1.historyOfWithdrawalSeizures) withdrawal.push(`history of withdrawal seizures${withNote(d1.historyOfWithdrawalSeizuresNote)}`);
  if (d1.activeIntoxication) withdrawal.push(`active intoxication at presentation${withNote(d1.activeIntoxicationNote)}`);

  const scores: string[] = [];
  if (d1.ciwaScore) scores.push(`CIWA-Ar score: ${d1.ciwaScore}`);
  if (d1.cowsScore) scores.push(`COWS score: ${d1.cowsScore}`);

  const medNeeds: string[] = [];
  if (d1.requiresDetoxPharmacology) medNeeds.push(`pharmacologic detoxification is required${withNote(d1.requiresDetoxPharmacologyNote)}`);
  if (d1.requiresMedicalMonitoring) medNeeds.push(`continuous medical monitoring is clinically indicated${withNote(d1.requiresMedicalMonitoringNote)}`);
  if (d1.ivFluidOrPressor) medNeeds.push(`IV fluid support or vasopressors are required${withNote(d1.ivFluidOrPressorsNote)}`);
  if (d1.polySubstanceUse) medNeeds.push(`polysubstance use complicates withdrawal trajectory${withNote(d1.polySubstanceUseNote)}`);

  const parts: string[] = [
    `Dimension 1 (Acute Intoxication/Withdrawal Potential): ${RISK_LABEL[r].charAt(0).toUpperCase() + RISK_LABEL[r].slice(1)} risk — ${RISK_SEVERITY[r]}.`,
    substanceStr,
    withdrawal.length ? `Acute withdrawal-related findings include: ${joinFindings(withdrawal)}.` : "",
    scores.length ? `Assessment scores: ${scores.join("; ")}.` : "",
    medNeeds.length ? `Clinical management requirements: ${joinFindings(medNeeds)}.` : "",
    d1.comments ? `Additional D1 notes: ${d1.comments}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── D2 Narrative ─────────────────────────────────────────────────────────────

function buildD2(d2: D2Core, _extra: D2Extra): string {
  const r = d2.riskRating;
  if (r === 0 && !d2.activeMedicalCondition) {
    return "Dimension 2 (Biomedical Conditions): No active biomedical conditions were identified. This dimension does not independently justify the requested level of care.";
  }

  const conditions: string[] = [];
  if (d2.infectiousDisease) conditions.push(`infectious disease${withNote(d2.infectiousDiseaseNote)}`);
  if (d2.hepaticDisease) conditions.push(`hepatic disease${withNote(d2.hepaticDiseaseNote)}`);
  if (d2.cardiovascularDisease) conditions.push(`cardiovascular disease${withNote(d2.cardiovascularDiseaseNote)}`);
  if (d2.diabetesOrMetabolicCondition) conditions.push(`diabetes or metabolic condition${withNote(d2.diabetesOrMetabolicConditionNote)}`);
  if (d2.pregnancyOrPostpartum) conditions.push(`pregnancy or postpartum status${withNote(d2.pregnancyOrPostpartumNote)}`);
  if (d2.recentHospitalization) conditions.push(`recent hospitalization${withNote(d2.recentHospitalizationNote)}`);

  const monitoring: string[] = [];
  if (d2.requiresDailyNursingMonitoring) monitoring.push(`daily nursing monitoring${withNote(d2.requiresDailyNursingMonitoringNote)}`);
  if (d2.requiresLabOrVitalMonitoring) monitoring.push(`laboratory or vital sign monitoring${withNote(d2.requiresLabOrVitalMonitoringNote)}`);
  if (d2.medicationManagementNeeded) monitoring.push(`complex medication management${withNote(d2.medicationManagementNeededNote)}`);

  const parts: string[] = [
    `Dimension 2 (Biomedical Conditions): ${RISK_LABEL[r].charAt(0).toUpperCase() + RISK_LABEL[r].slice(1)} risk — ${RISK_SEVERITY[r]}.`,
    conditions.length ? `Active medical conditions: ${joinFindings(conditions)}.` : "",
    monitoring.length ? `Required medical services: ${joinFindings(monitoring)}.` : "",
    d2.comments ? `Additional D2 notes: ${d2.comments}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── D3 Narrative ─────────────────────────────────────────────────────────────

function buildD3(d3: D3Core, extra: D3Extra): string {
  const r = d3.riskRating;
  if (r === 0 && !d3.activeSuicidalIdeation && !d3.activePsychosis && !d3.severeMoodDisturbance) {
    return "Dimension 3 (Emotional/Behavioral/Cognitive): No significant psychiatric or behavioral concerns were identified at the time of assessment.";
  }

  const safetyRisks: string[] = [];
  if (d3.activeSuicidalIdeation) safetyRisks.push(`active suicidal ideation${withNote(d3.activeSuicidalIdeationNote)}`);
  if (d3.recentSuicideAttempt) safetyRisks.push(`recent suicide attempt${withNote(d3.recentSuicideAttemptNote)}`);
  if (d3.activeHomicidalIdeation) safetyRisks.push(`active homicidal ideation${withNote(d3.activeHomicidalIdeationNote)}`);
  if (d3.gravityDisabilityPresent) safetyRisks.push(`grave disability present${withNote(d3.gravityDisabilityPresentNote)}`);
  if (d3.impairedSelfCare) safetyRisks.push(`impaired self-care capacity${withNote(d3.impairedSelfCareNote)}`);

  const psychiatric: string[] = [];
  if (d3.activePsychosis) psychiatric.push(`active psychosis${withNote(d3.activePsychosisNote)}`);
  if (d3.activeMania) psychiatric.push(`active mania${withNote(d3.activeManiaNote)}`);
  if (d3.severeMoodDisturbance) psychiatric.push(`severe mood disturbance${withNote(d3.severeMoodDisturbanceNote)}`);
  if (d3.severeAnxietyOrPanic) psychiatric.push(`severe anxiety or panic${withNote(d3.severeAnxietyOrPanicNote)}`);
  if (d3.impairedRealityTesting) psychiatric.push(`impaired reality testing${withNote(d3.impairedRealityTestingNote)}`);

  const diagnoses: string[] = [];
  if (d3.diagnosedMDD) diagnoses.push(`Major Depressive Disorder${withNote(d3.diagnosedMDDNote)}`);
  if (d3.diagnosedBipolar) diagnoses.push(`Bipolar Disorder${withNote(d3.diagnosedBipolarNote)}`);
  if (d3.diagnosedSchizophreniaSpectrum) diagnoses.push(`Schizophrenia-Spectrum Disorder${withNote(d3.diagnosedSchizophreniaSpectrumNote)}`);
  if (d3.diagnosedPTSD) diagnoses.push(`PTSD${withNote(d3.diagnosedPTSDNote)}`);
  if (d3.diagnosedADHD) diagnoses.push(`ADHD${withNote(d3.diagnosedADHDNote)}`);
  if (d3.diagnosedPersonalityDisorder) diagnoses.push(`Personality Disorder${withNote(d3.diagnosedPersonalityDisorderNote)}`);

  const mgmt: string[] = [];
  if (d3.requiresPsychMedManagement) mgmt.push(`psychiatric medication management is required${withNote(d3.requiresPsychMedManagementNote)}`);
  if (d3.requiresPsychiatricMonitoring) mgmt.push(`ongoing psychiatric monitoring is clinically indicated${withNote(d3.requiresPsychiatricMonitoringNote)}`);

  const contextual: string[] = [];
  if (extra.traumaHistoryPresent) contextual.push(`trauma history${withNote(extra.traumaHistoryPresentNote)}`);
  if (extra.acutePsychosocialStressor) contextual.push(`acute psychosocial stressor${withNote(extra.acutePsychosocialStressorNote)}`);
  if (extra.substanceInducedPsychiatric) contextual.push(`substance-induced psychiatric condition${withNote(extra.substanceInducedPsychiatricNote)}`);
  if (extra.primaryPsychiatricIndependent) contextual.push(`independent primary psychiatric disorder${withNote(extra.primaryPsychiatricIndependentNote)}`);

  const parts: string[] = [
    `Dimension 3 (Emotional/Behavioral/Cognitive): ${RISK_LABEL[r].charAt(0).toUpperCase() + RISK_LABEL[r].slice(1)} risk — ${RISK_SEVERITY[r]}.`,
    safetyRisks.length ? `Safety concerns identified: ${joinFindings(safetyRisks)}.` : "",
    psychiatric.length ? `Active psychiatric symptoms: ${joinFindings(psychiatric)}.` : "",
    diagnoses.length ? `Co-occurring psychiatric diagnoses: ${joinFindings(diagnoses)}.` : "",
    mgmt.length ? `Required psychiatric services: ${joinFindings(mgmt)}.` : "",
    contextual.length ? `Contextual factors: ${joinFindings(contextual)}.` : "",
    d3.comments ? `Additional D3 notes: ${d3.comments}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── D4 Narrative ─────────────────────────────────────────────────────────────

function buildD4(d4: D4Core, extra: D4Extra): string {
  const r = d4.riskRating;

  const stage = d4.stagePrecontemplation
    ? "precontemplation"
    : d4.stageContemplation
    ? "contemplation"
    : d4.stagePreparation
    ? "preparation"
    : d4.stageAction
    ? "action"
    : null;

  const barriers: string[] = [];
  if (d4.deniesToHaveProblem) barriers.push(`denial of substance use problem${withNote(d4.deniesToHaveProblemNote)}`);
  if (d4.ambivalentAboutTreatment) barriers.push(`ambivalence about treatment${withNote(d4.ambivalentAboutTreatmentNote)}`);
  if (d4.externalPressureOnly) barriers.push(`exclusively externally motivated${withNote(d4.externalPressureOnlyNote)}`);
  if (d4.limitedInsightIntoSeverity) barriers.push(`limited insight into illness severity${withNote(d4.limitedInsightIntoSeverityNote)}`);
  if (d4.refusedMedicationAssistedTreatment) barriers.push(`declined medication-assisted treatment${withNote(d4.refusedMedicationAssistedTreatmentNote)}`);
  if (extra.historicalEngagementPoor) barriers.push(`history of poor treatment engagement${withNote(extra.historicalEngagementPoorNote)}`);
  if (extra.cognitiveBarriersToEngagement) barriers.push(`cognitive barriers to engagement${withNote(extra.cognitiveBarriersToEngagementNote)}`);

  const strengths: string[] = [];
  if (extra.selfIdentifiesNeedForHelp) strengths.push("patient self-identifies need for treatment");
  if (extra.familyPressurePositive) strengths.push("positive family support motivating engagement");
  if (extra.spiritualOrValueBasedMotivation) strengths.push("spiritual or value-based motivation present");

  if (r === 0 && !barriers.length) {
    return "Dimension 4 (Readiness to Change): Patient demonstrates adequate readiness to engage with the proposed treatment plan." + (strengths.length ? ` Motivational strengths noted: ${strengths.join("; ")}.` : "");
  }

  const parts: string[] = [
    `Dimension 4 (Readiness to Change): ${RISK_LABEL[r].charAt(0).toUpperCase() + RISK_LABEL[r].slice(1)} risk — ${RISK_SEVERITY[r]}.`,
    stage ? `Patient's motivational stage: ${stage}.` : "",
    barriers.length ? `Engagement barriers identified: ${joinFindings(barriers)}.` : "",
    barriers.length ? "Intensive therapeutic engagement within a structured residential setting is indicated to address motivational deficits that would preclude successful outpatient treatment." : "",
    strengths.length ? `Motivational strengths: ${strengths.join("; ")}.` : "",
    d4.comments ? `Additional D4 notes: ${d4.comments}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── D5 Narrative ─────────────────────────────────────────────────────────────

function buildD5(d5: D5Core, extra: D5Extra): string {
  const r = d5.riskRating;

  const txHistory: string[] = [];
  if (d5.multiplePriorTreatmentEpisodes) txHistory.push(`multiple prior treatment episodes${withNote(d5.multiplePriorTreatmentEpisodesNote)}`);
  if (d5.relapsedFromPriorLevel) txHistory.push(`relapse following prior level of care${withNote(d5.relapsedFromPriorLevelNote)}`);
  if (d5.priorASAM37Admission) txHistory.push(`prior ASAM 3.7 admission${withNote(d5.priorASAM37AdmissionNote)}`);
  if (d5.priorASAM35Admission) txHistory.push(`prior ASAM 3.5 admission${withNote(d5.priorASAM35AdmissionNote)}`);
  if (d5.priorDetoxOnlyNoFollowup) txHistory.push(`prior detox without follow-up treatment${withNote(d5.priorDetoxOnlyNoFollowupNote)}`);

  const currentRisk: string[] = [];
  if (d5.dailyOrNearDailyUse) currentRisk.push(`daily or near-daily use pattern${withNote(d5.dailyOrNearDailyUseNote)}`);
  if (d5.useToPreventWithdrawal) currentRisk.push(`use to prevent withdrawal${withNote(d5.useToPreventWithdrawalNote)}`);
  if (d5.cravingsHighAtAdmission) currentRisk.push(`high cravings at admission${withNote(d5.cravingsHighAtAdmissionNote)}`);
  if (d5.triggerRichEnvironment) currentRisk.push(`trigger-rich home or social environment${withNote(d5.triggerRichEnvironmentNote)}`);
  if (d5.coOccurringDisorderUntreated) currentRisk.push(`untreated co-occurring disorder driving relapse risk${withNote(d5.coOccurringDisorderUntreatedNote)}`);
  if (d5.lackOfCopingSkills) currentRisk.push(`insufficient coping skills${withNote(d5.lackOfCopingSkillsNote)}`);

  const amplifiers: string[] = [];
  if (extra.kindlingOrProgressivePatternPresent) amplifiers.push(`progressive severity pattern (kindling)${withNote(extra.kindlingOrProgressivePatternPresentNote)}`);
  if (extra.priorODHighRiskPattern) amplifiers.push(`prior overdose with high-risk pattern${withNote(extra.priorODHighRiskPatternNote)}`);
  if (extra.behavioralAddictionConcurrent) amplifiers.push(`concurrent behavioral addiction${withNote(extra.behavioralAddictionConcurrentNote)}`);

  const protective: string[] = [];
  if (extra.priorSuccessfulRecovery) protective.push(`prior successful recovery period${withNote(extra.priorSuccessfulRecoveryNote)}`);
  if (extra.longCleanTimeInPast) protective.push(`extended clean time in the past${withNote(extra.longCleanTimeInPastNote)}`);
  if (extra.relapseWarningSignsIdentified) protective.push("relapse warning signs identified by patient");

  if (r === 0 && !txHistory.length && !currentRisk.length) {
    return "Dimension 5 (Relapse/Continued Use Potential): No significant relapse risk factors were identified." + (protective.length ? ` Protective factors: ${protective.join("; ")}.` : "");
  }

  const parts: string[] = [
    `Dimension 5 (Relapse/Continued Use Potential): ${RISK_LABEL[r].charAt(0).toUpperCase() + RISK_LABEL[r].slice(1)} risk — ${RISK_SEVERITY[r]}.`,
    txHistory.length ? `Treatment history: ${joinFindings(txHistory)}.` : "",
    currentRisk.length ? `Current relapse risk factors: ${joinFindings(currentRisk)}.` : "",
    amplifiers.length ? `Risk amplifiers: ${joinFindings(amplifiers)}.` : "",
    protective.length ? `Protective factors: ${protective.join("; ")}.` : "",
    d5.comments ? `Additional D5 notes: ${d5.comments}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── D6 Narrative ─────────────────────────────────────────────────────────────

function buildD6(d6: D6Core, extra: D6Extra): string {
  const r = d6.riskRating;

  const risks: string[] = [];
  if (d6.homelessOrUnstableHousing) risks.push(`homelessness or unstable housing${withNote(d6.homelessOrUnstableHousingNote)}`);
  if (d6.livesWithActiveSubstanceUsers) risks.push(`lives with active substance users${withNote(d6.livesWithActiveSubstanceUsersNote)}`);
  if (d6.lacksFamilyOrSocialSupport) risks.push(`lacks family or social support${withNote(d6.lacksFamilyOrSocialSupportNote)}`);
  if (d6.unsafeOrAbusiveHomeEnvironment) risks.push(`unsafe or abusive home environment${withNote(d6.unsafeOrAbusiveHomeEnvironmentNote)}`);
  if (d6.unemployedOrFinancialInstability) risks.push(`unemployed or financially unstable${withNote(d6.unemployedOrFinancialInstabilityNote)}`);
  if (d6.legalIssuesPending) risks.push(`pending legal issues${withNote(d6.legalIssuesPendingNote)}`);
  if (d6.childProtectiveServicesInvolved) risks.push(`CPS involvement${withNote(d6.childProtectiveServicesInvolvedNote)}`);
  if (d6.transportationBarrier) risks.push(`transportation barrier to outpatient care${withNote(d6.transportationBarrierNote)}`);
  if (d6.noAftercarePlanInPlace) risks.push(`no aftercare plan in place${withNote(d6.noAftercarePlanInPlaceNote)}`);
  if (d6.priorDischargeAMAOrExpelled) risks.push(`prior AMA discharge or program expulsion${withNote(d6.priorDischargeAMAOrExpelledNote)}`);

  const protective: string[] = [];
  if (extra.peerSupportOrSponsorPresent) protective.push("peer support or sponsor engaged");
  if (extra.familySystemEngagedInTreatment) protective.push("family system engaged in treatment");
  if (extra.sober_supportNetwork) protective.push("sober support network present");
  if (extra.stableHousingAtDischarge) protective.push("stable housing anticipated at discharge");
  if (extra.employerSupportive) protective.push("employer is supportive of treatment");

  if (r === 0 && !risks.length) {
    return "Dimension 6 (Recovery Environment): No significant environmental risk factors identified." + (protective.length ? ` Protective factors: ${protective.join("; ")}.` : "");
  }

  const parts: string[] = [
    `Dimension 6 (Recovery Environment): ${RISK_LABEL[r].charAt(0).toUpperCase() + RISK_LABEL[r].slice(1)} risk — ${RISK_SEVERITY[r]}.`,
    risks.length ? `Environmental risk factors: ${joinFindings(risks)}.` : "",
    risks.length ? "The patient's recovery environment, as described, is incompatible with successful engagement in lower levels of care at this time." : "",
    protective.length ? `Protective factors: ${protective.join("; ")}.` : "",
    d6.comments ? `Additional D6 notes: ${d6.comments}` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── LOC Justification ────────────────────────────────────────────────────────

function buildLOCJustification(cfg: Configuration, dim: LLMPayload["dimensions"]): string {
  const { levelOfCare, ncMedicaid } = cfg;
  const d1r = dim.d1Core.riskRating;
  const d2r = dim.d2Core.riskRating;
  const d3r = dim.d3Core.riskRating;
  const d4r = dim.d4Core.riskRating;
  const d5r = dim.d5Core.riskRating;
  const d6r = dim.d6Core.riskRating;
  const avgRisk = (d1r + d2r + d3r + d4r + d5r + d6r) / 6;

  const highDims = [
    d1r >= 3 && "D1 (withdrawal/intoxication)",
    d2r >= 3 && "D2 (biomedical)",
    d3r >= 3 && "D3 (psychiatric)",
    d4r >= 2 && "D4 (motivation)",
    d5r >= 3 && "D5 (relapse risk)",
    d6r >= 2 && "D6 (environment)",
  ].filter(Boolean) as string[];

  const locName =
    levelOfCare === "3.7"
      ? "ASAM Level 3.7 (Medically Monitored Intensive Inpatient)"
      : levelOfCare === "3.5"
      ? "ASAM Level 3.5 (Clinically Managed High-Intensity Residential)"
      : "ASAM Level 3.7 (acute phase) and anticipated step-down to Level 3.5 (residential rehabilitation)";

  const ncLine = ncMedicaid
    ? " Per NC Medicaid Clinical Coverage Policy 8D-4/8D-5, the documented clinical findings meet the threshold for the requested level of care authorization."
    : "";

  const lowerLOCLine =
    dim.d1Core.requiresMedicalMonitoring || dim.d1Core.requiresDetoxPharmacology || dim.d2Core.requiresDailyNursingMonitoring
      ? " The patient's medical and withdrawal management needs cannot be safely addressed in a lower level of care without nursing oversight and physician availability."
      : avgRisk >= 2
      ? " The multidimensional risk profile indicates that outpatient or lower-intensity residential services would be insufficient to address the clinical complexity presented."
      : "";

  return `Level-of-Care Determination: Based on multidimensional ASAM assessment, the clinical evidence supports authorization for ${locName}.${highDims.length ? ` Primary drivers of level-of-care determination include elevated risk in: ${highDims.join(", ")}.` : ""}${lowerLOCLine}${ncLine}`;
}

// ─── Chart Narrative ──────────────────────────────────────────────────────────

function buildChartNarrative(payload: LLMPayload): string {
  const { configuration: cfg, dimensions: dim } = payload;
  const { patientDescriptor } = cfg;

  const intro = patientDescriptor
    ? `The following assessment documents the clinical presentation of ${patientDescriptor} at the time of evaluation.`
    : "The following assessment documents clinical findings at the time of evaluation.";

  const disclaimer = "[NOTE: This document was generated using rule-based synthesis from structured form data. Clinical review and provider attestation are required before use.]\n\n";

  const d1 = buildD1(dim.d1Core, dim.d1Extra);
  const d2 = buildD2(dim.d2Core, dim.d2Extra);
  const d3 = buildD3(dim.d3Core, dim.d3Extra);
  const d4 = buildD4(dim.d4Core, dim.d4Extra);
  const d5 = buildD5(dim.d5Core, dim.d5Extra);
  const d6 = buildD6(dim.d6Core, dim.d6Extra);
  const loc = buildLOCJustification(cfg, dim);

  return [
    disclaimer + intro,
    "",
    d1,
    "",
    d2,
    "",
    d3,
    "",
    d4,
    "",
    d5,
    "",
    d6,
    "",
    loc,
  ].join("\n");
}

// ─── P2P Script ───────────────────────────────────────────────────────────────

function buildP2PScript(payload: LLMPayload): string {
  const { configuration: cfg, dimensions: dim } = payload;
  const { levelOfCare, patientDescriptor, ncMedicaid } = cfg;

  const locName =
    levelOfCare === "3.7"
      ? "Level 3.7 Medically Monitored Intensive Inpatient"
      : levelOfCare === "3.5"
      ? "Level 3.5 Clinically Managed High-Intensity Residential"
      : "Level 3.7 and Level 3.5";

  const descriptor = patientDescriptor || "[patient descriptor not entered]";

  // Key clinical bullets for call script
  const bullets: string[] = [];
  if (dim.d1Core.riskRating >= 2 || dim.d1Core.requiresDetoxPharmacology)
    bullets.push(`Withdrawal/Intoxication (D1 ${dim.d1Core.riskRating}/4): ${dim.d1Core.requiresDetoxPharmacology ? "Pharmacologic detoxification required." : ""} ${dim.d1Core.activeWithdrawal ? "Active withdrawal present." : ""} ${dim.d1Core.historyOfDTs ? "History of DTs." : ""} ${dim.d1Core.historyOfWithdrawalSeizures ? "History of withdrawal seizures." : ""}`.trim());
  if (dim.d2Core.riskRating >= 2 || dim.d2Core.activeMedicalCondition)
    bullets.push(`Biomedical (D2 ${dim.d2Core.riskRating}/4): Active medical conditions present requiring nursing-level monitoring.`);
  if (dim.d3Core.riskRating >= 2 || dim.d3Core.activeSuicidalIdeation || dim.d3Core.activePsychosis)
    bullets.push(`Psychiatric (D3 ${dim.d3Core.riskRating}/4): ${[dim.d3Core.activeSuicidalIdeation && "active SI", dim.d3Core.recentSuicideAttempt && "recent suicide attempt", dim.d3Core.activePsychosis && "active psychosis", dim.d3Core.activeMania && "active mania"].filter(Boolean).join(", ")}${[dim.d3Core.activeSuicidalIdeation && "active SI", dim.d3Core.recentSuicideAttempt && "recent suicide attempt", dim.d3Core.activePsychosis && "active psychosis", dim.d3Core.activeMania && "active mania"].filter(Boolean).length ? "." : "Elevated psychiatric risk."}`);
  if (dim.d5Core.riskRating >= 2)
    bullets.push(`Relapse Risk (D5 ${dim.d5Core.riskRating}/4): ${[dim.d5Core.multiplePriorTreatmentEpisodes && "multiple prior treatment failures", dim.d5Core.relapsedFromPriorLevel && "relapsed from prior LOC", dim.d5Core.cravingsHighAtAdmission && "high cravings"].filter(Boolean).join("; ") || "High relapse risk documented."}`);
  if (dim.d6Core.riskRating >= 2)
    bullets.push(`Environment (D6 ${dim.d6Core.riskRating}/4): ${[dim.d6Core.homelessOrUnstableHousing && "unstable housing", dim.d6Core.livesWithActiveSubstanceUsers && "lives with active users", dim.d6Core.lacksFamilyOrSocialSupport && "no social support"].filter(Boolean).join("; ") || "High-risk recovery environment."}`);

  const ncRef = ncMedicaid
    ? "\nThis case is subject to NC Medicaid Clinical Coverage Policy 8D-4/8D-5. The documented findings meet the specified clinical threshold for the requested level."
    : "";

  const callScript = `FORMAT A — CALL SCRIPT

"I'm calling to request authorization for ASAM ${locName} for ${descriptor}.

The patient presents with a multidimensional profile supporting medical necessity at this level:

${bullets.length ? bullets.map((b) => `• ${b}`).join("\n") : "• Multidimensional risk factors documented across ASAM dimensions — see attached chart narrative."}

The patient cannot be safely managed at a lower level of care due to the complexity of their presentation. I am requesting ${levelOfCare === "both" ? "authorization for Level 3.7 with anticipated step-down to Level 3.5" : `authorization for ${locName}`}.${ncRef}"`;

  const locFull =
    levelOfCare === "3.7"
      ? "ASAM Level 3.7 (Medically Monitored Intensive Inpatient)"
      : levelOfCare === "3.5"
      ? "ASAM Level 3.5 (Clinically Managed High-Intensity Residential)"
      : "ASAM Level 3.7 and Level 3.5";

  const writtenAppeal = `FORMAT B — WRITTEN APPEAL

Re: Authorization Request — ${locFull}
Patient: ${descriptor}

Dear Utilization Management Reviewer,

This correspondence serves as a formal request for authorization of ${locFull} for the above-referenced patient.

CLINICAL SUMMARY:
The patient presents with clinically significant findings across multiple ASAM dimensions, as documented in the attached chart narrative. The multidimensional risk profile, including ${[dim.d1Core.riskRating >= 2 && "acute withdrawal/intoxication risk", dim.d2Core.riskRating >= 2 && "active biomedical comorbidity", dim.d3Core.riskRating >= 2 && "psychiatric instability", dim.d5Core.riskRating >= 2 && "high relapse potential", dim.d6Core.riskRating >= 2 && "unsafe recovery environment"].filter(Boolean).join(", ") || "elevated ASAM dimensional risk ratings"}, supports the clinical necessity for the requested level of care.

MEDICAL NECESSITY RATIONALE:
Treatment at a lower level of care is clinically contraindicated at this time. The patient's clinical complexity requires the 24-hour medical/nursing oversight, structured therapeutic milieu, and psychiatric availability that characterize the requested level.${ncRef}

AUTHORIZATION REQUEST:
We respectfully request authorization for ${locFull} and ask that the clinical record be reviewed in full prior to any adverse determination. The attending physician is available for peer-to-peer review upon request.

Respectfully submitted,
[Attending Physician — signature block]`;

  return [callScript, "", writtenAppeal].join("\n");
}

// ─── Clarifying Questions / Suggestions ──────────────────────────────────────

function buildClarifyingQuestions(payload: LLMPayload): string {
  const { dimensions: dim } = payload;
  const suggestions: string[] = [];

  // D1 — withdrawal specifics
  if ((dim.d1Core.alcoholPrimary || dim.d1Core.opioidPrimary) && !dim.d1Core.ciwaScore && !dim.d1Core.cowsScore)
    suggestions.push("D1: Consider documenting a CIWA-Ar (alcohol) or COWS (opioid) score to quantify withdrawal severity for the record.");
  if (dim.d1Core.requiresDetoxPharmacology && !dim.d1Core.requiresDetoxPharmacologyNote)
    suggestions.push("D1: Specify detox pharmacology protocol (e.g., CIWA-driven lorazepam, methadone, buprenorphine taper) in the D1 note field to strengthen the record.");

  // D2 — medical specifics
  if (dim.d2Core.requiresDailyNursingMonitoring && !dim.d2Core.requiresDailyNursingMonitoringNote)
    suggestions.push("D2: Document the specific reason nursing monitoring is required (e.g., insulin-dependent diabetes, hepatic encephalopathy risk, wound care).");

  // D3 — safety
  if (dim.d3Core.activeSuicidalIdeation && !dim.d3Core.activeSuicidalIdeationNote)
    suggestions.push("D3: Document SI specifics (ideation type — passive vs. active; plan, intent, means access) to support safety risk documentation.");
  if (dim.d3Core.diagnosedBipolar || dim.d3Core.diagnosedSchizophreniaSpectrum)
    suggestions.push("D3: Consider documenting psychiatric medication adherence status and last psychiatric contact for co-occurring disorder continuity.");

  // D4 — motivation
  if (dim.d4Core.stagePrecontemplation && !dim.d4Core.deniesToHaveProblemNote)
    suggestions.push("D4: Document specific statements or behaviors evidencing precontemplation to support medical necessity for motivational engagement at this level.");

  // D5 — relapse
  if (dim.d5Core.multiplePriorTreatmentEpisodes && !dim.d5Core.multiplePriorTreatmentEpisodesNote)
    suggestions.push("D5: Specify number and types of prior treatment episodes (detox only, residential, IOP, MAT, etc.) to document the escalating treatment pattern.");

  // D6 — environment
  if (dim.d6Core.homelessOrUnstableHousing && !dim.d6Core.homelessOrUnstableHousingNote)
    suggestions.push("D6: Note current housing status specifics (shelter, street, couch-surfing) — UM reviewers frequently request this to justify residential over outpatient.");

  // General completeness
  const emptyDims = [
    dim.d1Core.riskRating === 0 && !dim.d1Core.activeWithdrawal && "D1",
    dim.d2Core.riskRating === 0 && !dim.d2Core.activeMedicalCondition && "D2",
    dim.d3Core.riskRating === 0 && "D3",
    dim.d5Core.riskRating === 0 && "D5",
  ].filter(Boolean) as string[];
  if (emptyDims.length > 0)
    suggestions.push(`Documentation note: ${emptyDims.join(", ")} ${emptyDims.length > 1 ? "show" : "shows"} no risk ratings or clinical findings. If clinically applicable, completing these dimensions will strengthen the medical necessity case.`);

  if (!suggestions.length)
    suggestions.push("No specific documentation gaps identified. Review the chart narrative above and attest accuracy before submission.");

  return suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

// ─── Edition-Aware Dimension Name Helper ──────────────────────────────────────

function getDimName(dim: "D1" | "D2" | "D3" | "D4" | "D5" | "D6", edition: string): string {
  const names3rd: Record<string, string> = {
    D1: "Acute Intoxication / Withdrawal Potential",
    D2: "Biomedical Conditions",
    D3: "Emotional / Behavioral / Cognitive Conditions",
    D4: "Readiness to Change",
    D5: "Relapse / Continued Use / Continued Problem Potential",
    D6: "Recovery / Living Environment",
  };
  const names4th: Record<string, string> = {
    D1: "Intoxication, Withdrawal, and Addiction Medications",
    D2: "Biomedical Conditions",
    D3: "Psychiatric and Cognitive Conditions",
    D4: "Substance Use-Related Risks",
    D5: "Recovery Environment Interactions",
    D6: "Person-Centered Considerations",
  };
  if (edition === "4th") return names4th[dim];
  if (edition === "hybrid") return `${names3rd[dim]} (4th Ed: ${names4th[dim]})`;
  return names3rd[dim];
}

// ─── Psych Eval Note ──────────────────────────────────────────────────────────

export function generatePsychEvalNote(state: DashboardState): string {
  const { config: cfg, dimensions: dim } = state;
  const { patientDescriptor, levelOfCare } = cfg;

  const locName =
    levelOfCare === "3.7"
      ? "ASAM Level 3.7 (Medically Monitored Intensive Inpatient)"
      : levelOfCare === "3.5"
      ? "ASAM Level 3.5 (Clinically Managed High-Intensity Residential)"
      : "ASAM Level 3.7 with anticipated step-down to Level 3.5";

  const disclaimer = "[NOTE: This is a rule-based clinical note draft. Clinical review, provider attestation, and documentation of direct examination findings are required before use in the medical record.]\n\n";

  const substances: string[] = [];
  if (dim.d1Core.alcoholPrimary) substances.push("alcohol" + withNote(dim.d1Core.alcoholPrimaryNote));
  if (dim.d1Core.opioidPrimary) substances.push("opioids" + withNote(dim.d1Core.opioidPrimaryNote));
  if (dim.d1Core.benzodiazepinePrimary) substances.push("benzodiazepines" + withNote(dim.d1Core.benzodiazepinePrimaryNote));
  if (dim.d1Core.stimulantPrimary) substances.push("stimulants" + withNote(dim.d1Core.stimulantPrimaryNote));
  if (dim.d1Core.cannabisPrimary) substances.push("cannabis" + withNote(dim.d1Core.cannabisPrimaryNote));
  const substanceStr = substances.length ? substances.join(", ") : "[substance not specified]";

  const chiefComplaint = `${patientDescriptor || "The patient"} presents requesting evaluation and admission for ${substanceStr} use disorder${dim.d1Core.activeWithdrawal ? " with active withdrawal" : ""}${dim.d1Core.activeIntoxication ? " with active intoxication" : ""}. Level of care requested: ${locName}.`;

  const hpiParts: string[] = [];
  if (dim.d1Core.riskRating > 0 || dim.d1Core.activeWithdrawal || dim.d1Core.activeIntoxication) {
    const d1parts: string[] = [];
    if (dim.d1Core.activeWithdrawal) d1parts.push(`active withdrawal${withNote(dim.d1Core.activeWithdrawalNote)}`);
    if (dim.d1Core.activeIntoxication) d1parts.push(`active intoxication${withNote(dim.d1Core.activeIntoxicationNote)}`);
    if (dim.d1Core.historyOfDTs) d1parts.push(`history of delirium tremens${withNote(dim.d1Core.historyOfDTsNote)}`);
    if (dim.d1Core.historyOfWithdrawalSeizures) d1parts.push(`history of withdrawal seizures${withNote(dim.d1Core.historyOfWithdrawalSeizuresNote)}`);
    if (dim.d1Core.polySubstanceUse) d1parts.push(`polysubstance use${withNote(dim.d1Core.polySubstanceUseNote)}`);
    if (dim.d1Core.ciwaScore) d1parts.push(`CIWA-Ar ${dim.d1Core.ciwaScore}`);
    if (dim.d1Core.cowsScore) d1parts.push(`COWS ${dim.d1Core.cowsScore}`);
    if (d1parts.length) hpiParts.push(`Withdrawal/intoxication findings: ${d1parts.join("; ")}.`);
  }
  if (dim.d1Core.comments) hpiParts.push(`D1 notes: ${dim.d1Core.comments}`);

  const medConditions: string[] = [];
  if (dim.d2Core.infectiousDisease) medConditions.push(`infectious disease${withNote(dim.d2Core.infectiousDiseaseNote)}`);
  if (dim.d2Core.hepaticDisease) medConditions.push(`hepatic disease${withNote(dim.d2Core.hepaticDiseaseNote)}`);
  if (dim.d2Core.cardiovascularDisease) medConditions.push(`cardiovascular disease${withNote(dim.d2Core.cardiovascularDiseaseNote)}`);
  if (dim.d2Core.diabetesOrMetabolicCondition) medConditions.push(`diabetes/metabolic condition${withNote(dim.d2Core.diabetesOrMetabolicConditionNote)}`);
  if (dim.d2Core.pregnancyOrPostpartum) medConditions.push(`pregnancy/postpartum${withNote(dim.d2Core.pregnancyOrPostpartumNote)}`);
  if (dim.d2Core.recentHospitalization) medConditions.push(`recent hospitalization${withNote(dim.d2Core.recentHospitalizationNote)}`);
  if (medConditions.length) hpiParts.push(`Active medical conditions: ${medConditions.join("; ")}.`);
  if (dim.d2Core.comments) hpiParts.push(`D2 notes: ${dim.d2Core.comments}`);

  const psych: string[] = [];
  if (dim.d3Core.activeSuicidalIdeation) psych.push(`active suicidal ideation${withNote(dim.d3Core.activeSuicidalIdeationNote)}`);
  if (dim.d3Core.recentSuicideAttempt) psych.push(`recent suicide attempt${withNote(dim.d3Core.recentSuicideAttemptNote)}`);
  if (dim.d3Core.activeHomicidalIdeation) psych.push(`active homicidal ideation${withNote(dim.d3Core.activeHomicidalIdeationNote)}`);
  if (dim.d3Core.activePsychosis) psych.push(`active psychosis${withNote(dim.d3Core.activePsychosisNote)}`);
  if (dim.d3Core.activeMania) psych.push(`active mania${withNote(dim.d3Core.activeManiaNote)}`);
  if (dim.d3Core.severeMoodDisturbance) psych.push(`severe mood disturbance${withNote(dim.d3Core.severeMoodDisturbanceNote)}`);
  if (psych.length) hpiParts.push(`Psychiatric symptoms: ${psych.join("; ")}.`);
  if (dim.d3Core.comments) hpiParts.push(`D3 notes: ${dim.d3Core.comments}`);

  const motivStage = dim.d4Core.stagePrecontemplation ? "precontemplation"
    : dim.d4Core.stageContemplation ? "contemplation"
    : dim.d4Core.stagePreparation ? "preparation"
    : dim.d4Core.stageAction ? "action" : null;
  if (motivStage) hpiParts.push(`Motivational stage: ${motivStage}.`);
  if (dim.d4Core.comments) hpiParts.push(`D4 notes: ${dim.d4Core.comments}`);
  if (dim.d5Core.multiplePriorTreatmentEpisodes) hpiParts.push(`History of multiple prior treatment episodes${withNote(dim.d5Core.multiplePriorTreatmentEpisodesNote)}.`);
  if (dim.d5Core.relapsedFromPriorLevel) hpiParts.push(`Relapsed from prior level of care${withNote(dim.d5Core.relapsedFromPriorLevelNote)}.`);
  if (dim.d5Core.dailyOrNearDailyUse) hpiParts.push(`Daily or near-daily use pattern${withNote(dim.d5Core.dailyOrNearDailyUseNote)}.`);
  if (dim.d5Core.comments) hpiParts.push(`D5 notes: ${dim.d5Core.comments}`);
  if (dim.d6Core.homelessOrUnstableHousing) hpiParts.push(`Homeless or unstable housing${withNote(dim.d6Core.homelessOrUnstableHousingNote)}.`);
  if (dim.d6Core.comments) hpiParts.push(`D6 notes: ${dim.d6Core.comments}`);

  const hpi = hpiParts.length ? hpiParts.join(" ") : "[Not documented — assess at time of evaluation]";

  const siStatus = dim.d3Core.activeSuicidalIdeation
    ? `PRESENT${dim.d3Core.activeSuicidalIdeationNote ? " " + dim.d3Core.activeSuicidalIdeationNote : ""}`
    : dim.d3Core.recentSuicideAttempt
    ? `recent attempt${dim.d3Core.recentSuicideAttemptNote ? " " + dim.d3Core.recentSuicideAttemptNote : ""}`
    : "not endorsed per collateral/chart";

  const hiStatus = dim.d3Core.activeHomicidalIdeation
    ? `PRESENT${dim.d3Core.activeHomicidalIdeationNote ? " " + dim.d3Core.activeHomicidalIdeationNote : ""}`
    : "not documented";

  const psychosisStatus = dim.d3Core.activePsychosis
    ? `Active psychosis present${dim.d3Core.activePsychosisNote ? ": " + dim.d3Core.activePsychosisNote : ""}`
    : dim.d3Core.impairedRealityTesting
    ? `Impaired reality testing noted${dim.d3Core.impairedRealityTestingNote ? ": " + dim.d3Core.impairedRealityTestingNote : ""}`
    : "no perceptual disturbances documented";

  const insightStatus = dim.d4Core.deniesToHaveProblem
    ? "limited (denies problem)"
    : dim.d4Core.ambivalentAboutTreatment
    ? "partial (ambivalent)"
    : dim.d4Core.limitedInsightIntoSeverity
    ? "partial (limited insight into severity)"
    : "adequate per chart review";

  const mse = `Appearance: [not documented — complete at time of evaluation]
Behavior: [not documented]
Speech: [not documented]
Mood: [not documented]
Affect: [not documented]
Thought Process: [not documented]
Thought Content: Suicidal ideation: ${siStatus}; Homicidal ideation: ${hiStatus}
Perceptual Disturbances: ${psychosisStatus}
Cognition: [not documented]
Insight: ${insightStatus}
Judgment: [not documented]`;

  const suhParts: string[] = [];
  if (substances.length) suhParts.push(`Primary substance(s): ${substances.join(", ")}.`);
  if (dim.d5Core.dailyOrNearDailyUse) suhParts.push(`Daily or near-daily use${withNote(dim.d5Core.dailyOrNearDailyUseNote)}.`);
  if (dim.d5Core.useToPreventWithdrawal) suhParts.push(`Use to prevent withdrawal${withNote(dim.d5Core.useToPreventWithdrawalNote)}.`);
  if (dim.d1Core.polySubstanceUse) suhParts.push(`Polysubstance use${withNote(dim.d1Core.polySubstanceUseNote)}.`);
  if (dim.d1Core.historyOfDTs) suhParts.push(`History of DTs${withNote(dim.d1Core.historyOfDTsNote)}.`);
  if (dim.d1Core.historyOfWithdrawalSeizures) suhParts.push(`History of withdrawal seizures${withNote(dim.d1Core.historyOfWithdrawalSeizuresNote)}.`);
  if (dim.d5Core.multiplePriorTreatmentEpisodes) suhParts.push(`Multiple prior treatment episodes${withNote(dim.d5Core.multiplePriorTreatmentEpisodesNote)}.`);
  if (dim.d5Core.priorASAM37Admission) suhParts.push(`Prior ASAM 3.7${withNote(dim.d5Core.priorASAM37AdmissionNote)}.`);
  if (dim.d5Core.priorASAM35Admission) suhParts.push(`Prior ASAM 3.5${withNote(dim.d5Core.priorASAM35AdmissionNote)}.`);
  const suh = suhParts.length ? suhParts.join(" ") : "[Not documented — assess at time of evaluation]";

  const psychDx: string[] = [];
  if (dim.d3Core.diagnosedMDD) psychDx.push(`Major Depressive Disorder${withNote(dim.d3Core.diagnosedMDDNote)}`);
  if (dim.d3Core.diagnosedBipolar) psychDx.push(`Bipolar Disorder${withNote(dim.d3Core.diagnosedBipolarNote)}`);
  if (dim.d3Core.diagnosedSchizophreniaSpectrum) psychDx.push(`Schizophrenia-Spectrum Disorder${withNote(dim.d3Core.diagnosedSchizophreniaSpectrumNote)}`);
  if (dim.d3Core.diagnosedPTSD) psychDx.push(`PTSD${withNote(dim.d3Core.diagnosedPTSDNote)}`);
  if (dim.d3Core.diagnosedADHD) psychDx.push(`ADHD${withNote(dim.d3Core.diagnosedADHDNote)}`);
  if (dim.d3Core.diagnosedPersonalityDisorder) psychDx.push(`Personality Disorder${withNote(dim.d3Core.diagnosedPersonalityDisorderNote)}`);
  const psychMgmt: string[] = [];
  if (dim.d3Core.requiresPsychMedManagement) psychMgmt.push(`psychiatric medication management required${withNote(dim.d3Core.requiresPsychMedManagementNote)}`);
  if (dim.d3Core.requiresPsychiatricMonitoring) psychMgmt.push(`psychiatric monitoring indicated${withNote(dim.d3Core.requiresPsychiatricMonitoringNote)}`);
  if (dim.d3Extra.traumaHistoryPresent) psychMgmt.push(`trauma history${withNote(dim.d3Extra.traumaHistoryPresentNote)}`);
  const psychHx = psychDx.length || psychMgmt.length
    ? [psychDx.length ? `Diagnoses: ${psychDx.join("; ")}.` : "", psychMgmt.length ? `Management needs: ${psychMgmt.join("; ")}.` : ""].filter(Boolean).join(" ")
    : "[Not documented — assess at time of evaluation]";

  const medHx = medConditions.length ? medConditions.join("; ") + "." : "[Not documented — assess at time of evaluation]";

  const socialParts: string[] = [];
  if (dim.d6Core.homelessOrUnstableHousing) socialParts.push(`Homeless/unstable housing${withNote(dim.d6Core.homelessOrUnstableHousingNote)}`);
  if (dim.d6Core.unemployedOrFinancialInstability) socialParts.push(`Unemployed/financial instability${withNote(dim.d6Core.unemployedOrFinancialInstabilityNote)}`);
  if (dim.d6Core.legalIssuesPending) socialParts.push(`Pending legal issues${withNote(dim.d6Core.legalIssuesPendingNote)}`);
  if (dim.d6Core.childProtectiveServicesInvolved) socialParts.push(`CPS involvement${withNote(dim.d6Core.childProtectiveServicesInvolvedNote)}`);
  if (dim.d6Core.lacksFamilyOrSocialSupport) socialParts.push(`Lacks family/social support${withNote(dim.d6Core.lacksFamilyOrSocialSupportNote)}`);
  if (dim.d6Core.livesWithActiveSubstanceUsers) socialParts.push(`Lives with active substance users${withNote(dim.d6Core.livesWithActiveSubstanceUsersNote)}`);
  if (dim.d6Core.unsafeOrAbusiveHomeEnvironment) socialParts.push(`Unsafe/abusive home environment${withNote(dim.d6Core.unsafeOrAbusiveHomeEnvironmentNote)}`);
  if (dim.d4Extra.culturalOrLanguageBarrier) socialParts.push(`Cultural/language barrier${withNote(dim.d4Extra.culturalOrLanguageBarrierNote)}`);
  if (dim.d6Extra.peerSupportOrSponsorPresent) socialParts.push(`Peer support/sponsor${withNote(dim.d6Extra.peerSupportOrSponsorPresentNote)}`);
  if (dim.d6Extra.sober_supportNetwork) socialParts.push(`Sober support network${withNote(dim.d6Extra.sober_supportNetworkNote)}`);
  const social = socialParts.length ? socialParts.join("; ") + "." : "[Not documented — assess at time of evaluation]";

  const riskHighDims = [
    dim.d1Core.riskRating >= 2 && `D1 (${RISK_LABEL[dim.d1Core.riskRating]} withdrawal risk)`,
    dim.d2Core.riskRating >= 2 && `D2 (${RISK_LABEL[dim.d2Core.riskRating]} biomedical risk)`,
    dim.d3Core.riskRating >= 2 && `D3 (${RISK_LABEL[dim.d3Core.riskRating]} psychiatric risk)`,
    dim.d4Core.riskRating >= 2 && `D4 (${RISK_LABEL[dim.d4Core.riskRating]} readiness risk)`,
    dim.d5Core.riskRating >= 2 && `D5 (${RISK_LABEL[dim.d5Core.riskRating]} relapse risk)`,
    dim.d6Core.riskRating >= 2 && `D6 (${RISK_LABEL[dim.d6Core.riskRating]} environment risk)`,
  ].filter(Boolean) as string[];

  const assessment = `${patientDescriptor || "The patient"} presents with ${substanceStr} use disorder requiring intensive, structured treatment. ASAM multidimensional assessment supports authorization for ${locName}.${riskHighDims.length ? ` Elevated dimensional risk ratings include: ${riskHighDims.join(", ")}.` : ""} The clinical complexity of this presentation necessitates the level of medical and psychiatric oversight available at the requested level of care.`;

  const planItems: string[] = [];
  planItems.push(`Level of care: ${locName}`);
  if (dim.d1Core.requiresDetoxPharmacology) planItems.push(`Pharmacologic detoxification protocol${withNote(dim.d1Core.requiresDetoxPharmacologyNote)}`);
  if (dim.d1Core.requiresMedicalMonitoring) planItems.push(`Medical monitoring${withNote(dim.d1Core.requiresMedicalMonitoringNote)}`);
  if (dim.d3Core.requiresPsychMedManagement) planItems.push(`Psychiatric medication management${withNote(dim.d3Core.requiresPsychMedManagementNote)}`);
  if (dim.d3Core.requiresPsychiatricMonitoring) planItems.push(`Psychiatric monitoring and follow-up${withNote(dim.d3Core.requiresPsychiatricMonitoringNote)}`);
  if (motivStage && (motivStage === "precontemplation" || motivStage === "contemplation")) planItems.push(`Motivational interviewing (stage: ${motivStage})`);
  if (dim.d4Extra.motivationalInterviewingTargeted) planItems.push(`MI-based engagement strategies${withNote(dim.d4Extra.motivationalInterviewingTargetedNote)}`);
  if (dim.d6Core.noAftercarePlanInPlace) planItems.push("Discharge planning: establish aftercare referrals");
  if (dim.d6Core.homelessOrUnstableHousing) planItems.push("Housing/social work referral for discharge planning");
  const plan = planItems.map(item => `• ${item}`).join("\n");

  return disclaimer + [
    `PSYCHIATRIC EVALUATION — CLINICAL NOTE DRAFT`,
    patientDescriptor || "",
    ``,
    `CHIEF COMPLAINT / REASON FOR EVALUATION:`,
    chiefComplaint,
    ``,
    `HISTORY OF PRESENT ILLNESS:`,
    hpi,
    ``,
    `MENTAL STATUS EXAMINATION (template):`,
    mse,
    ``,
    `SUBSTANCE USE HISTORY:`,
    suh,
    ``,
    `PSYCHIATRIC HISTORY:`,
    psychHx,
    ``,
    `MEDICAL HISTORY:`,
    medHx,
    ``,
    `SOCIAL HISTORY / SDOH:`,
    social,
    ``,
    `ASSESSMENT:`,
    assessment,
    ``,
    `PLAN:`,
    plan,
  ].join("\n");
}

// ─── Biopsychosocial Formulation ──────────────────────────────────────────────

export function generateBiopsychosocialFormulation(state: DashboardState): string {
  const { config: cfg, dimensions: dim } = state;
  const { patientDescriptor, levelOfCare } = cfg;

  const disclaimer = "[NOTE: This is a rule-based biopsychosocial formulation draft. Clinical review and provider attestation are required before use in the medical record.]\n\n";

  const locName =
    levelOfCare === "3.7"
      ? "ASAM Level 3.7 (Medically Monitored Intensive Inpatient)"
      : levelOfCare === "3.5"
      ? "ASAM Level 3.5 (Clinically Managed High-Intensity Residential)"
      : "ASAM Level 3.7 with anticipated step-down to Level 3.5";

  const substances: string[] = [];
  if (dim.d1Core.alcoholPrimary) substances.push("alcohol" + withNote(dim.d1Core.alcoholPrimaryNote));
  if (dim.d1Core.opioidPrimary) substances.push("opioids" + withNote(dim.d1Core.opioidPrimaryNote));
  if (dim.d1Core.benzodiazepinePrimary) substances.push("benzodiazepines" + withNote(dim.d1Core.benzodiazepinePrimaryNote));
  if (dim.d1Core.stimulantPrimary) substances.push("stimulants" + withNote(dim.d1Core.stimulantPrimaryNote));
  if (dim.d1Core.cannabisPrimary) substances.push("cannabis" + withNote(dim.d1Core.cannabisPrimaryNote));
  const substanceStr = substances.length ? substances.join(", ") : "[substance not specified]";

  const bioParts: string[] = [];
  bioParts.push(`Primary substance(s): ${substanceStr}.`);
  if (dim.d1Core.activeWithdrawal) bioParts.push(`Active withdrawal${withNote(dim.d1Core.activeWithdrawalNote)}.`);
  if (dim.d1Core.historyOfDTs) bioParts.push(`History of delirium tremens${withNote(dim.d1Core.historyOfDTsNote)}.`);
  if (dim.d1Core.historyOfWithdrawalSeizures) bioParts.push(`History of withdrawal seizures${withNote(dim.d1Core.historyOfWithdrawalSeizuresNote)}.`);
  if (dim.d1Core.polySubstanceUse) bioParts.push(`Polysubstance use${withNote(dim.d1Core.polySubstanceUseNote)}.`);
  if (dim.d1Core.requiresDetoxPharmacology) bioParts.push(`Pharmacologic detoxification required${withNote(dim.d1Core.requiresDetoxPharmacologyNote)}.`);
  if (dim.d2Core.infectiousDisease) bioParts.push(`Infectious disease${withNote(dim.d2Core.infectiousDiseaseNote)}.`);
  if (dim.d2Core.hepaticDisease) bioParts.push(`Hepatic disease${withNote(dim.d2Core.hepaticDiseaseNote)}.`);
  if (dim.d2Core.cardiovascularDisease) bioParts.push(`Cardiovascular disease${withNote(dim.d2Core.cardiovascularDiseaseNote)}.`);
  if (dim.d2Core.diabetesOrMetabolicCondition) bioParts.push(`Diabetes/metabolic condition${withNote(dim.d2Core.diabetesOrMetabolicConditionNote)}.`);
  if (dim.d2Core.pregnancyOrPostpartum) bioParts.push(`Pregnancy/postpartum${withNote(dim.d2Core.pregnancyOrPostpartumNote)}.`);
  if (dim.d2Core.medicationManagementNeeded) bioParts.push(`Complex medication management needed${withNote(dim.d2Core.medicationManagementNeededNote)}.`);
  if (dim.d2Extra.chronicPainContributing) bioParts.push(`Chronic pain contributing${withNote(dim.d2Extra.chronicPainContributingNote)}.`);
  if (dim.d1Extra.nutritionalDeficiency) bioParts.push(`Nutritional deficiency${withNote(dim.d1Extra.nutritionalDeficiencyNote)}.`);
  const bio = bioParts.join(" ");

  const psychDx: string[] = [];
  if (dim.d3Core.diagnosedMDD) psychDx.push(`Major Depressive Disorder${withNote(dim.d3Core.diagnosedMDDNote)}`);
  if (dim.d3Core.diagnosedBipolar) psychDx.push(`Bipolar Disorder${withNote(dim.d3Core.diagnosedBipolarNote)}`);
  if (dim.d3Core.diagnosedSchizophreniaSpectrum) psychDx.push(`Schizophrenia-Spectrum Disorder${withNote(dim.d3Core.diagnosedSchizophreniaSpectrumNote)}`);
  if (dim.d3Core.diagnosedPTSD) psychDx.push(`PTSD${withNote(dim.d3Core.diagnosedPTSDNote)}`);
  if (dim.d3Core.diagnosedADHD) psychDx.push(`ADHD${withNote(dim.d3Core.diagnosedADHDNote)}`);
  if (dim.d3Core.diagnosedPersonalityDisorder) psychDx.push(`Personality Disorder${withNote(dim.d3Core.diagnosedPersonalityDisorderNote)}`);
  const psychParts: string[] = [];
  if (psychDx.length) psychParts.push(`Psychiatric diagnoses: ${psychDx.join("; ")}.`);
  if (dim.d3Extra.traumaHistoryPresent) psychParts.push(`Trauma history${withNote(dim.d3Extra.traumaHistoryPresentNote)}.`);
  if (dim.d3Extra.childhoodAdversity) psychParts.push(`Childhood adversity/ACEs${withNote(dim.d3Extra.childhoodAdversityNote)}.`);
  if (dim.d3Extra.cognitiveImpairmentPresent) psychParts.push(`Cognitive impairment${withNote(dim.d3Extra.cognitiveImpairmentPresentNote)}.`);
  if (dim.d3Extra.substanceInducedPsychiatric) psychParts.push(`Substance-induced psychiatric condition${withNote(dim.d3Extra.substanceInducedPsychiatricNote)}.`);
  if (dim.d3Extra.primaryPsychiatricIndependent) psychParts.push(`Independent primary psychiatric disorder${withNote(dim.d3Extra.primaryPsychiatricIndependentNote)}.`);
  if (dim.d4Core.deniesToHaveProblem) psychParts.push(`Insight deficit: denies substance use problem${withNote(dim.d4Core.deniesToHaveProblemNote)}.`);
  if (dim.d4Core.ambivalentAboutTreatment) psychParts.push(`Ambivalence about treatment${withNote(dim.d4Core.ambivalentAboutTreatmentNote)}.`);
  if (dim.d4Core.limitedInsightIntoSeverity) psychParts.push(`Limited insight into illness severity${withNote(dim.d4Core.limitedInsightIntoSeverityNote)}.`);
  if (dim.d5Core.lackOfCopingSkills) psychParts.push(`Insufficient coping skills${withNote(dim.d5Core.lackOfCopingSkillsNote)}.`);
  if (dim.d5Extra.lowFrustrationTolerance) psychParts.push(`Low frustration tolerance/impulsivity${withNote(dim.d5Extra.lowFrustrationToleranceNote)}.`);
  const psych2 = psychParts.length ? psychParts.join(" ") : "[Not documented — assess at time of evaluation]";

  const socialParts: string[] = [];
  if (dim.d6Core.homelessOrUnstableHousing) socialParts.push(`Housing: homeless/unstable${withNote(dim.d6Core.homelessOrUnstableHousingNote)}`);
  if (dim.d6Core.livesWithActiveSubstanceUsers) socialParts.push(`Lives with active substance users${withNote(dim.d6Core.livesWithActiveSubstanceUsersNote)}`);
  if (dim.d6Core.lacksFamilyOrSocialSupport) socialParts.push(`Lacks family/social support${withNote(dim.d6Core.lacksFamilyOrSocialSupportNote)}`);
  if (dim.d6Core.unsafeOrAbusiveHomeEnvironment) socialParts.push(`Unsafe/abusive home environment${withNote(dim.d6Core.unsafeOrAbusiveHomeEnvironmentNote)}`);
  if (dim.d6Core.unemployedOrFinancialInstability) socialParts.push(`Unemployed/financial instability${withNote(dim.d6Core.unemployedOrFinancialInstabilityNote)}`);
  if (dim.d6Core.legalIssuesPending) socialParts.push(`Pending legal issues${withNote(dim.d6Core.legalIssuesPendingNote)}`);
  if (dim.d6Core.childProtectiveServicesInvolved) socialParts.push(`CPS involvement${withNote(dim.d6Core.childProtectiveServicesInvolvedNote)}`);
  if (dim.d4Extra.culturalOrLanguageBarrier) socialParts.push(`Cultural/language barrier${withNote(dim.d4Extra.culturalOrLanguageBarrierNote)}`);
  if (dim.d6Extra.culturalOrMinorityStressor) socialParts.push(`Cultural/minority stressor${withNote(dim.d6Extra.culturalOrMinorityStressorNote)}`);
  if (dim.d6Extra.insuranceOrBenefitBarrier) socialParts.push(`Insurance/benefit barrier${withNote(dim.d6Extra.insuranceOrBenefitBarrierNote)}`);
  const social2 = socialParts.length ? socialParts.join("; ") + "." : "[Not documented — assess at time of evaluation]";

  const supParts: string[] = [];
  supParts.push(`Primary substance(s): ${substanceStr}.`);
  if (dim.d5Core.dailyOrNearDailyUse) supParts.push(`Daily or near-daily use${withNote(dim.d5Core.dailyOrNearDailyUseNote)}.`);
  if (dim.d5Core.useToPreventWithdrawal) supParts.push(`Use to prevent withdrawal (physiologic dependence)${withNote(dim.d5Core.useToPreventWithdrawalNote)}.`);
  if (dim.d5Core.cravingsHighAtAdmission) supParts.push(`High cravings at admission${withNote(dim.d5Core.cravingsHighAtAdmissionNote)}.`);
  if (dim.d5Extra.kindlingOrProgressivePatternPresent) supParts.push(`Progressive severity/kindling pattern${withNote(dim.d5Extra.kindlingOrProgressivePatternPresentNote)}.`);
  if (dim.d5Extra.priorODHighRiskPattern) supParts.push(`Prior overdose — high-risk pattern${withNote(dim.d5Extra.priorODHighRiskPatternNote)}.`);
  if (dim.d1Extra.chronicHeavyUse) supParts.push(`Chronic heavy use${withNote(dim.d1Extra.chronicHeavyUseNote)}.`);
  if (dim.d5Core.multiplePriorTreatmentEpisodes) supParts.push(`Multiple prior treatment episodes${withNote(dim.d5Core.multiplePriorTreatmentEpisodesNote)}.`);
  if (dim.d5Core.relapsedFromPriorLevel) supParts.push(`Relapse from prior level of care${withNote(dim.d5Core.relapsedFromPriorLevelNote)}.`);
  const sup = supParts.join(" ");

  const precipParts: string[] = [];
  if (dim.d3Extra.acutePsychosocialStressor) precipParts.push(`Acute psychosocial stressor${withNote(dim.d3Extra.acutePsychosocialStressorNote)}`);
  if (dim.d3Extra.griefOrLossRecent) precipParts.push(`Recent grief/loss${withNote(dim.d3Extra.griefOrLossRecentNote)}`);
  if (dim.d6Core.unsafeOrAbusiveHomeEnvironment) precipParts.push(`Unsafe/abusive home environment${withNote(dim.d6Core.unsafeOrAbusiveHomeEnvironmentNote)}`);
  const allNotes = [dim.d1Core.comments, dim.d2Core.comments, dim.d3Core.comments, dim.d4Core.comments, dim.d5Core.comments, dim.d6Core.comments].filter(Boolean).join(" ");
  if (allNotes) precipParts.push(`Clinical notes: ${allNotes}`);
  const precip = precipParts.length ? precipParts.join("; ") + "." : "[Not documented — assess at time of evaluation]";

  const perpParts: string[] = [];
  if (psychDx.length || dim.d3Core.requiresPsychMedManagement) perpParts.push(`Untreated or undertreated psychiatric conditions maintaining disorder.`);
  if (dim.d5Core.coOccurringDisorderUntreated) perpParts.push(`Co-occurring disorder inadequately treated${withNote(dim.d5Core.coOccurringDisorderUntreatedNote)}.`);
  if (dim.d4Core.deniesToHaveProblem || dim.d4Core.ambivalentAboutTreatment) perpParts.push(`Motivational deficits limiting sustained engagement.`);
  if (dim.d5Core.triggerRichEnvironment) perpParts.push(`Trigger-rich environment upon discharge${withNote(dim.d5Core.triggerRichEnvironmentNote)}.`);
  if (dim.d6Core.homelessOrUnstableHousing || dim.d6Core.livesWithActiveSubstanceUsers) perpParts.push(`Environmental instability/exposure maintaining use.`);
  if (dim.d6Core.transportationBarrier) perpParts.push(`Transportation barrier limiting aftercare access${withNote(dim.d6Core.transportationBarrierNote)}.`);
  if (dim.d6Core.noAftercarePlanInPlace) perpParts.push(`No aftercare plan in place.`);
  const perp = perpParts.length ? perpParts.join(" ") : "[Not documented — assess at time of evaluation]";

  const protParts: string[] = [];
  if (dim.d5Extra.priorSuccessfulRecovery) protParts.push(`Prior successful recovery${withNote(dim.d5Extra.priorSuccessfulRecoveryNote)}`);
  if (dim.d5Extra.longCleanTimeInPast) protParts.push(`Extended clean time in the past${withNote(dim.d5Extra.longCleanTimeInPastNote)}`);
  if (dim.d5Extra.relapseWarningSignsIdentified) protParts.push("Relapse warning signs identified");
  if (dim.d4Extra.selfIdentifiesNeedForHelp) protParts.push("Patient self-identifies need for treatment");
  if (dim.d4Extra.familyPressurePositive) protParts.push(`Positive family support${withNote(dim.d4Extra.familyPressurePositiveNote)}`);
  if (dim.d4Extra.spiritualOrValueBasedMotivation) protParts.push(`Spiritual/value-based motivation${withNote(dim.d4Extra.spiritualOrValueBasedMotivationNote)}`);
  if (dim.d6Extra.peerSupportOrSponsorPresent) protParts.push(`Peer support/sponsor${withNote(dim.d6Extra.peerSupportOrSponsorPresentNote)}`);
  if (dim.d6Extra.sober_supportNetwork) protParts.push(`Sober support network${withNote(dim.d6Extra.sober_supportNetworkNote)}`);
  if (dim.d6Extra.familySystemEngagedInTreatment) protParts.push(`Family engaged in treatment${withNote(dim.d6Extra.familySystemEngagedInTreatmentNote)}`);
  if (dim.d6Extra.stableHousingAtDischarge) protParts.push(`Stable housing anticipated at discharge${withNote(dim.d6Extra.stableHousingAtDischargeNote)}`);
  if (dim.d6Extra.employerSupportive) protParts.push(`Employer supportive${withNote(dim.d6Extra.employerSupportiveNote)}`);
  if (dim.d1Extra.motivatedForDetox) protParts.push(`Motivated for detox${withNote(dim.d1Extra.motivatedForDetoxNote)}`);
  const prot = protParts.length ? protParts.join("; ") + "." : "[Not documented — identify at time of evaluation]";

  const riskHighDims = [
    dim.d1Core.riskRating >= 2 && "withdrawal risk",
    dim.d2Core.riskRating >= 2 && "biomedical comorbidity",
    dim.d3Core.riskRating >= 2 && "psychiatric instability",
    dim.d4Core.riskRating >= 2 && "motivational deficits",
    dim.d5Core.riskRating >= 2 && "high relapse potential",
    dim.d6Core.riskRating >= 2 && "unsafe recovery environment",
  ].filter(Boolean) as string[];

  const formSummary = `This is ${patientDescriptor || "a patient"} presenting with ${substanceStr} use disorder in the context of ${riskHighDims.length ? riskHighDims.join(", ") : "multidimensional clinical need"}. The current episode is precipitated by ${dim.d3Extra.acutePsychosocialStressor ? "acute psychosocial stressors" : "substance-related crises and clinical decompensation"} and maintained by ${perpParts.length ? perpParts.slice(0, 2).join(" and ").toLowerCase().replace(/\.$/, "") : "inadequate support and untreated co-occurring conditions"}. Protective factors include ${protParts.length ? protParts.slice(0, 3).join(", ").replace(/^\S/, c => c.toLowerCase()).replace(/\.$/, "") : "[to be identified at evaluation]"}. Treatment at ${locName} is recommended to address ${riskHighDims.length ? riskHighDims.join(", ") : "the documented clinical complexity"}.`;

  const txItems: string[] = [];
  txItems.push(`Admission to ${locName}`);
  if (dim.d1Core.requiresDetoxPharmacology) txItems.push(`Pharmacologic detoxification${withNote(dim.d1Core.requiresDetoxPharmacologyNote)}`);
  if (dim.d1Core.requiresMedicalMonitoring) txItems.push(`Medical monitoring protocol${withNote(dim.d1Core.requiresMedicalMonitoringNote)}`);
  if (dim.d3Core.requiresPsychMedManagement) txItems.push(`Psychiatric medication evaluation and management${withNote(dim.d3Core.requiresPsychMedManagementNote)}`);
  if (psychDx.length) txItems.push(`Co-occurring disorder treatment: ${psychDx.join(", ")}`);
  if (dim.d4Core.deniesToHaveProblem || dim.d4Core.ambivalentAboutTreatment) txItems.push("Motivational interviewing and engagement-focused therapy");
  if (dim.d3Extra.traumaHistoryPresent) txItems.push(`Trauma-informed care${withNote(dim.d3Extra.traumaHistoryPresentNote)}`);
  if (dim.d6Core.homelessOrUnstableHousing) txItems.push("Social work/case management: housing and discharge planning");
  if (dim.d6Core.legalIssuesPending) txItems.push("Legal liaison/coordination");
  if (dim.d6Core.childProtectiveServicesInvolved) txItems.push("CPS coordination");
  const tx = txItems.map(item => `• ${item}`).join("\n");

  return disclaimer + [
    `BIOPSYCHOSOCIAL ASSESSMENT & CASE FORMULATION`,
    patientDescriptor || "",
    ``,
    `BIOLOGICAL FACTORS:`,
    bio,
    ``,
    `PSYCHOLOGICAL FACTORS:`,
    psych2,
    ``,
    `SOCIAL / ENVIRONMENTAL FACTORS:`,
    social2,
    ``,
    `SUBSTANCE USE PATTERN:`,
    sup,
    ``,
    `PRECIPITATING FACTORS (current episode):`,
    precip,
    ``,
    `PERPETUATING FACTORS:`,
    perp,
    ``,
    `PROTECTIVE FACTORS / STRENGTHS:`,
    prot,
    ``,
    `FORMULATION SUMMARY:`,
    formSummary,
    ``,
    `TREATMENT RECOMMENDATIONS:`,
    tx,
  ].join("\n");
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function generateRuleBasedOutput(payload: LLMPayload): GeneratedOutput {
  const { configuration: cfg } = payload;
  const outputType = cfg.outputType;

  const chartNarrative =
    outputType === "p2p" ? "" : buildChartNarrative(payload);

  const p2pScript =
    outputType === "narrative" ? "" : buildP2PScript(payload);

  const clarifyingQuestions =
    outputType !== "p2p" ? buildClarifyingQuestions(payload) : "";

  const state: DashboardState = {
    config: cfg,
    capabilities: payload.facilityCapabilities,
    dimensions: payload.dimensions,
  };

  const psychEvalNote = generatePsychEvalNote(state);
  const biopsychosocialFormulation = generateBiopsychosocialFormulation(state);

  return { chartNarrative, p2pScript, clarifyingQuestions, psychEvalNote, biopsychosocialFormulation };
}
