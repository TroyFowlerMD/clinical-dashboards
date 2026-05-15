// D2: Biomedical Conditions / Complications
import { useMemo, useState, useEffect } from "react";
import { RiskSlider } from "@/components/RiskSlider";
import { CheckRow } from "@/components/CheckRow";
import { SectionBlock } from "@/components/SectionBlock";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { computeD2Suggestion } from "@/lib/riskSuggestions";
import { cn } from "@/lib/utils";
import type { D2Core, D2Extra, RiskRating } from "@shared/schema";

interface D2PanelProps {
  core: D2Core; extra: D2Extra;
  onCoreChange: (patch: Partial<D2Core>) => void;
  onExtraChange: (patch: Partial<D2Extra>) => void;
}

export function D2Panel({ core, extra, onCoreChange, onExtraChange }: D2PanelProps) {
  const [userOverrode, setUserOverrode] = useState(false);

  // ── Auto-check logic ───────────────────────────────────────────────────────────
  const [autoOverrides, setAutoOverrides] = useState<Set<string>>(new Set());
  const setOverride = (field: string) => setAutoOverrides(prev => new Set([...prev, field]));
  const clearOverride = (field: string) => setAutoOverrides(prev => { const s = new Set(prev); s.delete(field); return s; });

  // activeMedicalCondition: auto-check if specific diagnosis present
  const activeMedTrigger = core.infectiousDisease || core.hepaticDisease || core.cardiovascularDisease ||
    core.pregnancyOrPostpartum || core.recentHospitalization || core.requiresDailyNursingMonitoring;
  const activeMedRationale = [
    core.infectiousDisease && "active infectious disease requires medical management",
    core.hepaticDisease && "hepatic disease requires active monitoring and treatment",
    core.cardiovascularDisease && "cardiovascular condition requires medical management",
    core.pregnancyOrPostpartum && "pregnancy/postpartum status requires active medical oversight",
    core.recentHospitalization && "recent hospitalization indicates active or recent medical condition",
    core.requiresDailyNursingMonitoring && "daily nursing monitoring implies active medical condition",
  ].filter(Boolean).join("; ");

  // requiresDailyNursingMonitoring: auto-check if serious diagnoses
  const nursingTrigger = core.infectiousDisease || core.hepaticDisease || core.cardiovascularDisease || core.pregnancyOrPostpartum;
  const nursingRationale = [
    core.infectiousDisease && "infectious disease requires daily nursing assessment",
    core.hepaticDisease && "hepatic disease requires daily nursing monitoring",
    core.cardiovascularDisease && "cardiovascular condition requires daily vitals and nursing assessment",
    core.pregnancyOrPostpartum && "pregnancy/postpartum requires daily nursing monitoring",
  ].filter(Boolean).join("; ");

  // requiresLabOrVitalMonitoring: auto-check for metabolic/organ conditions
  const labTrigger = core.infectiousDisease || core.hepaticDisease || core.diabetesOrMetabolicCondition || core.cardiovascularDisease;
  const labRationale = [
    core.infectiousDisease && "infectious disease requires lab monitoring (CBC, CMP, cultures)",
    core.hepaticDisease && "hepatic disease requires LFT monitoring",
    core.diabetesOrMetabolicCondition && "diabetes/metabolic condition requires glucose and lab monitoring",
    core.cardiovascularDisease && "cardiovascular condition requires vital sign monitoring",
  ].filter(Boolean).join("; ");

  useEffect(() => {
    if (activeMedTrigger && !core.activeMedicalCondition && !autoOverrides.has("activeMedicalCondition"))
      onCoreChange({ activeMedicalCondition: true });
    if (!activeMedTrigger && autoOverrides.has("activeMedicalCondition")) clearOverride("activeMedicalCondition");
  }, [activeMedTrigger]);

  useEffect(() => {
    if (nursingTrigger && !core.requiresDailyNursingMonitoring && !autoOverrides.has("requiresDailyNursingMonitoring"))
      onCoreChange({ requiresDailyNursingMonitoring: true });
    if (!nursingTrigger && autoOverrides.has("requiresDailyNursingMonitoring")) clearOverride("requiresDailyNursingMonitoring");
  }, [nursingTrigger]);

  useEffect(() => {
    if (labTrigger && !core.requiresLabOrVitalMonitoring && !autoOverrides.has("requiresLabOrVitalMonitoring"))
      onCoreChange({ requiresLabOrVitalMonitoring: true });
    if (!labTrigger && autoOverrides.has("requiresLabOrVitalMonitoring")) clearOverride("requiresLabOrVitalMonitoring");
  }, [labTrigger]);

  const activeMedAutoActive = activeMedTrigger && !autoOverrides.has("activeMedicalCondition") && core.activeMedicalCondition;
  const nursingAutoActive = nursingTrigger && !autoOverrides.has("requiresDailyNursingMonitoring") && core.requiresDailyNursingMonitoring;
  const labAutoActive = labTrigger && !autoOverrides.has("requiresLabOrVitalMonitoring") && core.requiresLabOrVitalMonitoring;

  const suggestion = useMemo(() => computeD2Suggestion(core), [
    core.activeMedicalCondition, core.requiresDailyNursingMonitoring, core.requiresLabOrVitalMonitoring,
    core.infectiousDisease, core.hepaticDisease, core.cardiovascularDisease,
    core.diabetesOrMetabolicCondition, core.pregnancyOrPostpartum, core.recentHospitalization,
    core.medicationManagementNeeded,
  ]);

  return (
    <div className="space-y-3">
      {suggestion.alert && (
        <div className={cn("flex gap-2.5 rounded-lg border px-3 py-2.5",
          suggestion.alertLevel === "critical"
            ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-200"
            : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
        )} role="alert">
          {suggestion.alertLevel === "critical" ? <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <p className="text-xs leading-snug">{suggestion.alert}</p>
        </div>
      )}

      <SectionBlock type="core" title="ASAM Core Factors" subtitle="Biomedical Status">
        <div className="pb-2">
          <RiskSlider label="D2 Risk Rating" value={core.riskRating} onChange={(v) => onCoreChange({ riskRating: v as RiskRating })} onOverrideChange={setUserOverrode} suggested={suggestion.suggested} rationale={suggestion.rationale} userOverrode={userOverrode} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Active Medical Issues</p>
            <CheckRow id="d2-active" label="Active medical condition requiring management"
              checked={core.activeMedicalCondition}
              onChange={(v) => { onCoreChange({ activeMedicalCondition: v }); if (!v) setOverride("activeMedicalCondition"); }}
              note={core.activeMedicalConditionNote} onNoteChange={(v) => onCoreChange({ activeMedicalConditionNote: v })} notePlaceholder="Diagnosis, current tx..."
              autoRationale={activeMedAutoActive ? activeMedRationale : undefined}
              onAutoOverride={() => { setOverride("activeMedicalCondition"); onCoreChange({ activeMedicalCondition: false }); }}
            />
            <CheckRow id="d2-nursing" label="Requires daily nursing monitoring" sublabel="Vital signs, wound care, infusion"
              checked={core.requiresDailyNursingMonitoring}
              onChange={(v) => { onCoreChange({ requiresDailyNursingMonitoring: v }); if (!v) setOverride("requiresDailyNursingMonitoring"); }}
              note={core.requiresDailyNursingMonitoringNote} onNoteChange={(v) => onCoreChange({ requiresDailyNursingMonitoringNote: v })} notePlaceholder="Frequency, parameters..."
              autoRationale={nursingAutoActive ? nursingRationale : undefined}
              onAutoOverride={() => { setOverride("requiresDailyNursingMonitoring"); onCoreChange({ requiresDailyNursingMonitoring: false }); }}
            />
            <CheckRow id="d2-lab" label="Requires lab or vital sign monitoring"
              checked={core.requiresLabOrVitalMonitoring}
              onChange={(v) => { onCoreChange({ requiresLabOrVitalMonitoring: v }); if (!v) setOverride("requiresLabOrVitalMonitoring"); }}
              note={core.requiresLabOrVitalMonitoringNote} onNoteChange={(v) => onCoreChange({ requiresLabOrVitalMonitoringNote: v })} notePlaceholder="Tests ordered, frequency..."
              autoRationale={labAutoActive ? labRationale : undefined}
              onAutoOverride={() => { setOverride("requiresLabOrVitalMonitoring"); onCoreChange({ requiresLabOrVitalMonitoring: false }); }}
            />
            <CheckRow id="d2-rx" label="Complex medication management needed" sublabel="Multiple interactions, titration" checked={core.medicationManagementNeeded} onChange={(v) => onCoreChange({ medicationManagementNeeded: v })} note={core.medicationManagementNeededNote} onNoteChange={(v) => onCoreChange({ medicationManagementNeededNote: v })} notePlaceholder="Medications, interactions..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Specific Diagnoses</p>
            <CheckRow id="d2-infx" label="Infectious disease" sublabel="HIV, HCV, endocarditis, wound infection" checked={core.infectiousDisease} onChange={(v) => onCoreChange({ infectiousDisease: v })} note={core.infectiousDiseaseNote} onNoteChange={(v) => onCoreChange({ infectiousDiseaseNote: v })} notePlaceholder="Specific dx, treatment status..." />
            <CheckRow id="d2-hep" label="Hepatic disease" sublabel="Cirrhosis, hepatitis, hepatic encephalopathy" checked={core.hepaticDisease} onChange={(v) => onCoreChange({ hepaticDisease: v })} note={core.hepaticDiseaseNote} onNoteChange={(v) => onCoreChange({ hepaticDiseaseNote: v })} notePlaceholder="Stage/grade, LFTs..." />
            <CheckRow id="d2-cv" label="Cardiovascular disease" sublabel="Heart failure, arrhythmia, HTN crisis" checked={core.cardiovascularDisease} onChange={(v) => onCoreChange({ cardiovascularDisease: v })} note={core.cardiovascularDiseaseNote} onNoteChange={(v) => onCoreChange({ cardiovascularDiseaseNote: v })} notePlaceholder="Dx, current BP/HR, meds..." />
            <CheckRow id="d2-dm" label="Diabetes / metabolic condition" checked={core.diabetesOrMetabolicCondition} onChange={(v) => onCoreChange({ diabetesOrMetabolicCondition: v })} note={core.diabetesOrMetabolicConditionNote} onNoteChange={(v) => onCoreChange({ diabetesOrMetabolicConditionNote: v })} notePlaceholder="Type, control, meds..." />
            <CheckRow id="d2-preg" label="Pregnancy or postpartum" checked={core.pregnancyOrPostpartum} onChange={(v) => onCoreChange({ pregnancyOrPostpartum: v })} note={core.pregnancyOrPostpartumNote} onNoteChange={(v) => onCoreChange({ pregnancyOrPostpartumNote: v })} notePlaceholder="GA, OB provider, MAT status..." />
            <CheckRow id="d2-hosp" label="Recent hospitalization (within 30 days)" checked={core.recentHospitalization} onChange={(v) => onCoreChange({ recentHospitalization: v })} note={core.recentHospitalizationNote} onNoteChange={(v) => onCoreChange({ recentHospitalizationNote: v })} notePlaceholder="Facility, reason, discharge dx..." />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Core Comments</Label>
          <Textarea value={core.comments} onChange={(e) => onCoreChange({ comments: e.target.value })} rows={2} placeholder="Specific diagnoses, medications, pending workup..." className="mt-1 text-sm resize-none" data-testid="d2-core-comments" />
        </div>
      </SectionBlock>

      <SectionBlock type="extra" title="Additional Formulation Factors" subtitle="Medical Contributors / Vulnerabilities" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <CheckRow id="d2e-pain" label="Chronic pain contributing to SUD" checked={extra.chronicPainContributing} onChange={(v) => onExtraChange({ chronicPainContributing: v })} note={extra.chronicPainContributingNote} onNoteChange={(v) => onExtraChange({ chronicPainContributingNote: v })} notePlaceholder="Pain etiology, severity..." />
            <CheckRow id="d2e-paindrive" label="Pain as primary driver of substance use" checked={extra.painDrivingSubstanceUse} onChange={(v) => onExtraChange({ painDrivingSubstanceUse: v })} note={extra.painDrivingSubstanceUseNote} onNoteChange={(v) => onExtraChange({ painDrivingSubstanceUseNote: v })} notePlaceholder="Pain tx plan, alternatives..." />
            <CheckRow id="d2e-nutr" label="Poor nutrition / dehydration" checked={extra.poorNutritionOrHydration} onChange={(v) => onExtraChange({ poorNutritionOrHydration: v })} note={extra.poorNutritionOrHydrationNote} onNoteChange={(v) => onExtraChange({ poorNutritionOrHydrationNote: v })} notePlaceholder="Dietary intake, supplements..." />
          </div>
          <div className="space-y-0.5">
            <CheckRow id="d2e-adls" label="Impaired ADLs from medical condition" checked={extra.poorADLsFromMedicalCondition} onChange={(v) => onExtraChange({ poorADLsFromMedicalCondition: v })} note={extra.poorADLsFromMedicalConditionNote} onNoteChange={(v) => onExtraChange({ poorADLsFromMedicalConditionNote: v })} notePlaceholder="Specific ADL deficits..." />
            <CheckRow id="d2e-sleep" label="Sleep disorder present" sublabel="OSA, insomnia, circadian disruption" checked={extra.sleepDisorderPresent} onChange={(v) => onExtraChange({ sleepDisorderPresent: v })} note={extra.sleepDisorderPresentNote} onNoteChange={(v) => onExtraChange({ sleepDisorderPresentNote: v })} notePlaceholder="Dx, current tx, CPAP?" />
            <CheckRow id="d2e-od" label="Prior overdose / naloxone administration" checked={extra.priorODOrNaloxoneUse} onChange={(v) => onExtraChange({ priorODOrNaloxoneUse: v })} note={extra.priorODOrNaloxoneUseNote} onNoteChange={(v) => onExtraChange({ priorODOrNaloxoneUseNote: v })} notePlaceholder="# ODs, substance, naloxone?" />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Formulation Notes</Label>
          <Textarea value={extra.comments} onChange={(e) => onExtraChange({ comments: e.target.value })} rows={2} placeholder="Medical formulation, biopsychosocial contributors, treatment targets..." className="mt-1 text-sm resize-none" data-testid="d2-extra-comments" />
        </div>
      </SectionBlock>
    </div>
  );
}
