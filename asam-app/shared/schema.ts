// ASAM Clinical Dashboard — Data Schema
// All data is transient (React state only), never persisted to DB.

// ─── Generation Log ──────────────────────────────────────────────────────────
export interface LogEntry {
  id: string;
  createdAt: number;           // Unix ms timestamp
  expiresAt: number;           // createdAt + 48h
  patientDescriptor: string;   // de-identified descriptor string
  levelOfCare: string;
  chartNarrative: string;
  p2pScript: string;
  clarifyingQuestions: string;
  psychEvalNote: string;
  biopsychosocialFormulation: string;
}

export type LevelOfCare = "3.7" | "3.5" | "both";
export type EditionLanguage = "3rd" | "4th" | "hybrid";
export type OutputType = "narrative" | "p2p" | "both";
export type Gender = "M" | "F" | "NB" | "TM" | "TF" | "Other" | null;

// ─── Global Configuration ─────────────────────────────────────────────────────
export interface Configuration {
  levelOfCare: LevelOfCare;
  editionLanguage: EditionLanguage;
  outputType: OutputType;
  ncMedicaid: boolean;
  geminiApiKey: string;
  patientDescriptor: string; // auto-built from age/gender + free text addendum
  // Patient descriptor parts
  patientAge: number | null;
  patientGender: Gender;
  patientDescriptorAddendum: string; // free-text addendum appended to auto-built descriptor
}

// ─── Facility Capabilities ────────────────────────────────────────────────────
export interface FacilityCapabilities {
  level37: string;
  level35: string;
}

// ─── Dimension Risk Rating ─────────────────────────────────────────────────────
export type RiskRating = 0 | 1 | 2 | 3 | 4;

// ─── D1: Acute Intoxication / Withdrawal Potential ────────────────────────────
export interface D1Core {
  riskRating: RiskRating;
  activeIntoxication: boolean; activeIntoxicationNote: string;
  activeWithdrawal: boolean; activeWithdrawalNote: string;
  polySubstanceUse: boolean; polySubstanceUseNote: string;
  historyOfDTs: boolean; historyOfDTsNote: string;
  historyOfWithdrawalSeizures: boolean; historyOfWithdrawalSeizuresNote: string;
  ciwaScore: string;
  cowsScore: string;
  alcoholPrimary: boolean; alcoholPrimaryNote: string;
  opioidPrimary: boolean; opioidPrimaryNote: string;
  benzodiazepinePrimary: boolean; benzodiazepinePrimaryNote: string;
  stimulantPrimary: boolean; stimulantPrimaryNote: string;
  cannabisPrimary: boolean; cannabisPrimaryNote: string;
  requiresDetoxPharmacology: boolean; requiresDetoxPharmacologyNote: string;
  requiresMedicalMonitoring: boolean; requiresMedicalMonitoringNote: string;
  ivFluidOrPressor: boolean; ivFluidOrPressorsNote: string;
  comments: string;
}

export interface D1Extra {
  chronicHeavyUse: boolean; chronicHeavyUseNote: string;
  lastUseRecent: boolean; lastUseRecentNote: string;
  priorDetoxMultiple: boolean; priorDetoxMultipleNote: string;
  neurologicVulnerability: boolean; neurologicVulnerabilityNote: string;
  nutritionalDeficiency: boolean; nutritionalDeficiencyNote: string;
  motivatedForDetox: boolean; motivatedForDetoxNote: string;
  agreedToMedication: boolean; agreedToMedicationNote: string;
  comments: string;
}

// ─── D2: Biomedical Conditions / Complications ────────────────────────────────
export interface D2Core {
  riskRating: RiskRating;
  activeMedicalCondition: boolean; activeMedicalConditionNote: string;
  requiresDailyNursingMonitoring: boolean; requiresDailyNursingMonitoringNote: string;
  requiresLabOrVitalMonitoring: boolean; requiresLabOrVitalMonitoringNote: string;
  infectiousDisease: boolean; infectiousDiseaseNote: string;
  hepaticDisease: boolean; hepaticDiseaseNote: string;
  cardiovascularDisease: boolean; cardiovascularDiseaseNote: string;
  diabetesOrMetabolicCondition: boolean; diabetesOrMetabolicConditionNote: string;
  pregnancyOrPostpartum: boolean; pregnancyOrPostpartumNote: string;
  recentHospitalization: boolean; recentHospitalizationNote: string;
  medicationManagementNeeded: boolean; medicationManagementNeededNote: string;
  comments: string;
}

export interface D2Extra {
  chronicPainContributing: boolean; chronicPainContributingNote: string;
  painDrivingSubstanceUse: boolean; painDrivingSubstanceUseNote: string;
  poorNutritionOrHydration: boolean; poorNutritionOrHydrationNote: string;
  poorADLsFromMedicalCondition: boolean; poorADLsFromMedicalConditionNote: string;
  sleepDisorderPresent: boolean; sleepDisorderPresentNote: string;
  priorODOrNaloxoneUse: boolean; priorODOrNaloxoneUseNote: string;
  comments: string;
}

// ─── D3: Emotional / Behavioral / Cognitive Conditions ────────────────────────
export interface D3Core {
  riskRating: RiskRating;
  activeSuicidalIdeation: boolean; activeSuicidalIdeationNote: string;
  recentSuicideAttempt: boolean; recentSuicideAttemptNote: string;
  activeHomicidalIdeation: boolean; activeHomicidalIdeationNote: string;
  activePsychosis: boolean; activePsychosisNote: string;
  activeMania: boolean; activeManiaNote: string;
  severeMoodDisturbance: boolean; severeMoodDisturbanceNote: string;
  severeAnxietyOrPanic: boolean; severeAnxietyOrPanicNote: string;
  impairedSelfCare: boolean; impairedSelfCareNote: string;
  impairedRealityTesting: boolean; impairedRealityTestingNote: string;
  gravityDisabilityPresent: boolean; gravityDisabilityPresentNote: string;
  diagnosedMDD: boolean; diagnosedMDDNote: string;
  diagnosedBipolar: boolean; diagnosedBipolarNote: string;
  diagnosedSchizophreniaSpectrum: boolean; diagnosedSchizophreniaSpectrumNote: string;
  diagnosedPTSD: boolean; diagnosedPTSDNote: string;
  diagnosedADHD: boolean; diagnosedADHDNote: string;
  diagnosedPersonalityDisorder: boolean; diagnosedPersonalityDisorderNote: string;
  requiresPsychMedManagement: boolean; requiresPsychMedManagementNote: string;
  requiresPsychiatricMonitoring: boolean; requiresPsychiatricMonitoringNote: string;
  comments: string;
}

export interface D3Extra {
  traumaHistoryPresent: boolean; traumaHistoryPresentNote: string;
  childhoodAdversity: boolean; childhoodAdversityNote: string;
  acutePsychosocialStressor: boolean; acutePsychosocialStressorNote: string;
  griefOrLossRecent: boolean; griefOrLossRecentNote: string;
  cognitiveImpairmentPresent: boolean; cognitiveImpairmentPresentNote: string;
  intellectualDisabilityPresent: boolean; intellectualDisabilityPresentNote: string;
  substanceInducedPsychiatric: boolean; substanceInducedPsychiatricNote: string;
  primaryPsychiatricIndependent: boolean; primaryPsychiatricIndependentNote: string;
  psychiatricTreatmentEngaged: boolean; psychiatricTreatmentEngagedNote: string;
  insightIntoMentalIllness: boolean; insightIntoMentalIllnessNote: string;
  comments: string;
}

// ─── D4: Readiness to Change ──────────────────────────────────────────────────
export interface D4Core {
  riskRating: RiskRating;
  stagePrecontemplation: boolean; stagePrecontemplationNote: string;
  stageContemplation: boolean; stageContemplationNote: string;
  stagePreparation: boolean; stagePreparationNote: string;
  stageAction: boolean; stageActionNote: string;
  deniesToHaveProblem: boolean; deniesToHaveProblemNote: string;
  ambivalentAboutTreatment: boolean; ambivalentAboutTreatmentNote: string;
  externalPressureOnly: boolean; externalPressureOnlyNote: string;
  refusedMedicationAssistedTreatment: boolean; refusedMedicationAssistedTreatmentNote: string;
  limitedInsightIntoSeverity: boolean; limitedInsightIntoSeverityNote: string;
  comments: string;
}

export interface D4Extra {
  motivationalInterviewingTargeted: boolean; motivationalInterviewingTargetedNote: string;
  historicalEngagementPoor: boolean; historicalEngagementPoorNote: string;
  cognitiveBarriersToEngagement: boolean; cognitiveBarriersToEngagementNote: string;
  culturalOrLanguageBarrier: boolean; culturalOrLanguageBarrierNote: string;
  selfIdentifiesNeedForHelp: boolean; selfIdentifiesNeedForHelpNote: string;
  familyPressurePositive: boolean; familyPressurePositiveNote: string;
  spiritualOrValueBasedMotivation: boolean; spiritualOrValueBasedMotivationNote: string;
  comments: string;
}

// ─── D5: Relapse / Continued Use / Continued Problem Potential ────────────────
export interface D5Core {
  riskRating: RiskRating;
  multiplePriorTreatmentEpisodes: boolean; multiplePriorTreatmentEpisodesNote: string;
  relapsedFromPriorLevel: boolean; relapsedFromPriorLevelNote: string;
  priorASAM37Admission: boolean; priorASAM37AdmissionNote: string;
  priorASAM35Admission: boolean; priorASAM35AdmissionNote: string;
  priorDetoxOnlyNoFollowup: boolean; priorDetoxOnlyNoFollowupNote: string;
  cravingsHighAtAdmission: boolean; cravingsHighAtAdmissionNote: string;
  triggerRichEnvironment: boolean; triggerRichEnvironmentNote: string;
  coOccurringDisorderUntreated: boolean; coOccurringDisorderUntreatedNote: string;
  lackOfCopingSkills: boolean; lackOfCopingSkillsNote: string;
  dailyOrNearDailyUse: boolean; dailyOrNearDailyUseNote: string;
  useToPreventWithdrawal: boolean; useToPreventWithdrawalNote: string;
  comments: string;
}

export interface D5Extra {
  kindlingOrProgressivePatternPresent: boolean; kindlingOrProgressivePatternPresentNote: string;
  behavioralAddictionConcurrent: boolean; behavioralAddictionConcurrentNote: string;
  priorODHighRiskPattern: boolean; priorODHighRiskPatternNote: string;
  lowFrustrationTolerance: boolean; lowFrustrationToleranceNote: string;
  priorSuccessfulRecovery: boolean; priorSuccessfulRecoveryNote: string;
  longCleanTimeInPast: boolean; longCleanTimeInPastNote: string;
  relapseWarningSignsIdentified: boolean; relapseWarningSignsIdentifiedNote: string;
  comments: string;
}

// ─── D6: Recovery / Living Environment ────────────────────────────────────────
export interface D6Core {
  riskRating: RiskRating;
  homelessOrUnstableHousing: boolean; homelessOrUnstableHousingNote: string;
  livesWithActiveSubstanceUsers: boolean; livesWithActiveSubstanceUsersNote: string;
  lacksFamilyOrSocialSupport: boolean; lacksFamilyOrSocialSupportNote: string;
  unsafeOrAbusiveHomeEnvironment: boolean; unsafeOrAbusiveHomeEnvironmentNote: string;
  unemployedOrFinancialInstability: boolean; unemployedOrFinancialInstabilityNote: string;
  legalIssuesPending: boolean; legalIssuesPendingNote: string;
  childProtectiveServicesInvolved: boolean; childProtectiveServicesInvolvedNote: string;
  transportationBarrier: boolean; transportationBarrierNote: string;
  noAftercarePlanInPlace: boolean; noAftercarePlanInPlaceNote: string;
  priorDischargeAMAOrExpelled: boolean; priorDischargeAMAOrExpelledNote: string;
  comments: string;
}

export interface D6Extra {
  peerSupportOrSponsorPresent: boolean; peerSupportOrSponsorPresentNote: string;
  familySystemEngagedInTreatment: boolean; familySystemEngagedInTreatmentNote: string;
  insuranceOrBenefitBarrier: boolean; insuranceOrBenefitBarrierNote: string;
  culturalOrMinorityStressor: boolean; culturalOrMinorityStressorNote: string;
  sober_supportNetwork: boolean; sober_supportNetworkNote: string;
  stableHousingAtDischarge: boolean; stableHousingAtDischargeNote: string;
  employerSupportive: boolean; employerSupportiveNote: string;
  comments: string;
}

// ─── Complete Form State ───────────────────────────────────────────────────────
export interface DimensionData {
  d1Core: D1Core; d1Extra: D1Extra;
  d2Core: D2Core; d2Extra: D2Extra;
  d3Core: D3Core; d3Extra: D3Extra;
  d4Core: D4Core; d4Extra: D4Extra;
  d5Core: D5Core; d5Extra: D5Extra;
  d6Core: D6Core; d6Extra: D6Extra;
}

export interface DashboardState {
  config: Configuration;
  capabilities: FacilityCapabilities;
  dimensions: DimensionData;
}

// ─── LLM Payload ────────────────────────────────────────────────────────────
export interface LLMPayload {
  configuration: Configuration;
  facilityCapabilities: FacilityCapabilities;
  dimensions: DimensionData;
}

// ─── Generated Output ────────────────────────────────────────────────────────
export interface GeneratedOutput {
  chartNarrative: string;
  p2pScript: string;
  clarifyingQuestions: string;
  psychEvalNote: string;        // Psych eval clinical note — subjective + ASAM assessment
  biopsychosocialFormulation: string; // Biopsychosocial assessment / case formulation
}
