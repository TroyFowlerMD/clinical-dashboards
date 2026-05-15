// D3: Emotional / Behavioral / Cognitive Conditions
import { useState, useMemo, useEffect } from "react";
import { RiskSlider } from "@/components/RiskSlider";
import { CheckRow } from "@/components/CheckRow";
import { SectionBlock } from "@/components/SectionBlock";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, ClipboardList, FileText } from "lucide-react";
import { computeD3Suggestion } from "@/lib/riskSuggestions";
import { cn } from "@/lib/utils";
import type { D3Core, D3Extra, RiskRating } from "@shared/schema";

interface D3PanelProps {
  core: D3Core; extra: D3Extra;
  onCoreChange: (patch: Partial<D3Core>) => void;
  onExtraChange: (patch: Partial<D3Extra>) => void;
}

export function D3Panel({ core, extra, onCoreChange, onExtraChange }: D3PanelProps) {
  const [mode, setMode] = useState<"compact" | "expanded">("compact");
  const [userOverrode, setUserOverrode] = useState(false);

  // ── Auto-check logic ───────────────────────────────────────────────────────────
  const [autoOverrides, setAutoOverrides] = useState<Set<string>>(new Set());
  const setOverride = (field: string) => setAutoOverrides(prev => new Set([...prev, field]));
  const clearOverride = (field: string) => setAutoOverrides(prev => { const s = new Set(prev); s.delete(field); return s; });

  // activeSuicidalIdeation: auto-check on recent attempt
  const siTrigger = core.recentSuicideAttempt;
  const siRationale = "recent suicide attempt implies active suicidal ideation by history";

  // requiresPsychMedManagement: auto-check for active psychosis, mania, or major diagnosis
  const psychMedTrigger = core.activePsychosis || core.activeMania || core.diagnosedBipolar || core.diagnosedSchizophreniaSpectrum;
  const psychMedRationale = [
    core.activePsychosis && "active psychosis requires antipsychotic management",
    core.activeMania && "active mania requires mood stabilizer or antipsychotic",
    core.diagnosedBipolar && "bipolar disorder requires psychiatric medication management",
    core.diagnosedSchizophreniaSpectrum && "schizophrenia spectrum disorder requires antipsychotic management",
  ].filter(Boolean).join("; ");

  // requiresPsychiatricMonitoring: auto-check for active psychosis/mania or schizophrenia
  const psychMonTrigger = core.activePsychosis || core.activeMania || core.diagnosedSchizophreniaSpectrum || core.gravityDisabilityPresent;
  const psychMonRationale = [
    core.activePsychosis && "active psychosis requires inpatient-level psychiatric monitoring",
    core.activeMania && "active mania requires close psychiatric monitoring for safety",
    core.diagnosedSchizophreniaSpectrum && "schizophrenia spectrum requires ongoing psychiatric monitoring",
    core.gravityDisabilityPresent && "gravely disabled status requires intensive psychiatric oversight",
  ].filter(Boolean).join("; ");

  // impairedSelfCare: auto-check if gravely disabled
  const selfCareTrigger = core.gravityDisabilityPresent;
  const selfCareRationale = "gravely disabled status implies inability to perform self-care";

  useEffect(() => {
    if (siTrigger && !core.activeSuicidalIdeation && !autoOverrides.has("activeSuicidalIdeation"))
      onCoreChange({ activeSuicidalIdeation: true });
    if (!siTrigger && autoOverrides.has("activeSuicidalIdeation")) clearOverride("activeSuicidalIdeation");
  }, [siTrigger]);

  useEffect(() => {
    if (psychMedTrigger && !core.requiresPsychMedManagement && !autoOverrides.has("requiresPsychMedManagement"))
      onCoreChange({ requiresPsychMedManagement: true });
    if (!psychMedTrigger && autoOverrides.has("requiresPsychMedManagement")) clearOverride("requiresPsychMedManagement");
  }, [psychMedTrigger]);

  useEffect(() => {
    if (psychMonTrigger && !core.requiresPsychiatricMonitoring && !autoOverrides.has("requiresPsychiatricMonitoring"))
      onCoreChange({ requiresPsychiatricMonitoring: true });
    if (!psychMonTrigger && autoOverrides.has("requiresPsychiatricMonitoring")) clearOverride("requiresPsychiatricMonitoring");
  }, [psychMonTrigger]);

  useEffect(() => {
    if (selfCareTrigger && !core.impairedSelfCare && !autoOverrides.has("impairedSelfCare"))
      onCoreChange({ impairedSelfCare: true });
    if (!selfCareTrigger && autoOverrides.has("impairedSelfCare")) clearOverride("impairedSelfCare");
  }, [selfCareTrigger]);

  const siAutoActive = siTrigger && !autoOverrides.has("activeSuicidalIdeation") && core.activeSuicidalIdeation;
  const psychMedAutoActive = psychMedTrigger && !autoOverrides.has("requiresPsychMedManagement") && core.requiresPsychMedManagement;
  const psychMonAutoActive = psychMonTrigger && !autoOverrides.has("requiresPsychiatricMonitoring") && core.requiresPsychiatricMonitoring;
  const selfCareAutoActive = selfCareTrigger && !autoOverrides.has("impairedSelfCare") && core.impairedSelfCare;

  const suggestion = useMemo(() => computeD3Suggestion(core), [
    core.activeSuicidalIdeation, core.recentSuicideAttempt, core.activeHomicidalIdeation,
    core.activePsychosis, core.activeMania, core.severeMoodDisturbance, core.severeAnxietyOrPanic,
    core.impairedSelfCare, core.impairedRealityTesting, core.gravityDisabilityPresent,
    core.diagnosedMDD, core.diagnosedBipolar, core.diagnosedSchizophreniaSpectrum, core.diagnosedPTSD, core.diagnosedADHD, core.diagnosedPersonalityDisorder,
    core.requiresPsychMedManagement, core.requiresPsychiatricMonitoring,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">D3 Detail Mode:</span>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant={mode === "compact" ? "default" : "outline"} onClick={() => setMode("compact")} data-testid="d3-mode-compact" className="h-7 text-xs gap-1">
            <ClipboardList className="h-3 w-3" /> UM Focus
          </Button>
          <Button type="button" size="sm" variant={mode === "expanded" ? "default" : "outline"} onClick={() => setMode("expanded")} data-testid="d3-mode-expanded" className="h-7 text-xs gap-1">
            <FileText className="h-3 w-3" /> Full H&P
          </Button>
        </div>
        {mode === "expanded" && <Badge variant="secondary" className="text-xs">Expanded — suitable as psych H&P supplement</Badge>}
      </div>

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

      <SectionBlock type="safety" title="Safety — ASAM Core Factors" subtitle="Psychiatric / Behavioral Risk">
        <div className="pb-2">
          <RiskSlider label="D3 Risk Rating" value={core.riskRating} onChange={(v) => onCoreChange({ riskRating: v as RiskRating })} onOverrideChange={setUserOverrode} suggested={suggestion.suggested} rationale={suggestion.rationale} userOverrode={userOverrode} />
        </div>

        <div className="space-y-0.5">
          <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">⚠ Safety Indicators</p>
          <CheckRow id="d3-si" label="Active suicidal ideation"
            checked={core.activeSuicidalIdeation}
            onChange={(v) => { onCoreChange({ activeSuicidalIdeation: v }); if (!v) setOverride("activeSuicidalIdeation"); }}
            note={core.activeSuicidalIdeationNote} onNoteChange={(v) => onCoreChange({ activeSuicidalIdeationNote: v })} notePlaceholder="Intent, plan, means, timeline..." highlight
            autoRationale={siAutoActive ? siRationale : undefined}
            onAutoOverride={() => { setOverride("activeSuicidalIdeation"); onCoreChange({ activeSuicidalIdeation: false }); }}
          />
          <CheckRow id="d3-attempt" label="Recent suicide attempt (within 90 days)" checked={core.recentSuicideAttempt} onChange={(v) => onCoreChange({ recentSuicideAttempt: v })} note={core.recentSuicideAttemptNote} onNoteChange={(v) => onCoreChange({ recentSuicideAttemptNote: v })} notePlaceholder="Method, lethality, hospitalized?" highlight />
          <CheckRow id="d3-hi" label="Active homicidal ideation" checked={core.activeHomicidalIdeation} onChange={(v) => onCoreChange({ activeHomicidalIdeation: v })} note={core.activeHomicidalIdeationNote} onNoteChange={(v) => onCoreChange({ activeHomicidalIdeationNote: v })} notePlaceholder="Target, plan, duty to warn?" highlight />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Acute Psychiatric Severity</p>
            <CheckRow id="d3-psych" label="Active psychosis" sublabel="Hallucinations, delusions, disorganization" checked={core.activePsychosis} onChange={(v) => onCoreChange({ activePsychosis: v })} note={core.activePsychosisNote} onNoteChange={(v) => onCoreChange({ activePsychosisNote: v })} notePlaceholder="Type, content, insight..." highlight />
            <CheckRow id="d3-mania" label="Active mania / hypomania" checked={core.activeMania} onChange={(v) => onCoreChange({ activeMania: v })} note={core.activeManiaNote} onNoteChange={(v) => onCoreChange({ activeManiaNote: v })} notePlaceholder="Severity, current meds..." highlight />
            <CheckRow id="d3-mood" label="Severe mood disturbance" checked={core.severeMoodDisturbance} onChange={(v) => onCoreChange({ severeMoodDisturbance: v })} note={core.severeMoodDisturbanceNote} onNoteChange={(v) => onCoreChange({ severeMoodDisturbanceNote: v })} notePlaceholder="PHQ-9, GAF, clinical impression..." />
            <CheckRow id="d3-anx" label="Severe anxiety / panic" checked={core.severeAnxietyOrPanic} onChange={(v) => onCoreChange({ severeAnxietyOrPanic: v })} note={core.severeAnxietyOrPanicNote} onNoteChange={(v) => onCoreChange({ severeAnxietyOrPanicNote: v })} notePlaceholder="GAD-7, frequency, impact..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Functioning</p>
            <CheckRow id="d3-selfcare" label="Impaired self-care (ADLs)"
              checked={core.impairedSelfCare}
              onChange={(v) => { onCoreChange({ impairedSelfCare: v }); if (!v) setOverride("impairedSelfCare"); }}
              note={core.impairedSelfCareNote} onNoteChange={(v) => onCoreChange({ impairedSelfCareNote: v })} notePlaceholder="Specific deficits..."
              autoRationale={selfCareAutoActive ? selfCareRationale : undefined}
              onAutoOverride={() => { setOverride("impairedSelfCare"); onCoreChange({ impairedSelfCare: false }); }}
            />
            <CheckRow id="d3-reality" label="Impaired reality testing" checked={core.impairedRealityTesting} onChange={(v) => onCoreChange({ impairedRealityTesting: v })} note={core.impairedRealityTestingNote} onNoteChange={(v) => onCoreChange({ impairedRealityTestingNote: v })} notePlaceholder="Examples, insight..." highlight />
            <CheckRow id="d3-gravity" label="Gravely disabled / unable to provide for basic needs" checked={core.gravityDisabilityPresent} onChange={(v) => onCoreChange({ gravityDisabilityPresent: v })} note={core.gravityDisabilityPresentNote} onNoteChange={(v) => onCoreChange({ gravityDisabilityPresentNote: v })} notePlaceholder="Specific examples..." highlight />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Co-occurring Diagnoses</p>
            <CheckRow id="d3-mdd" label="Major Depressive Disorder" checked={core.diagnosedMDD} onChange={(v) => onCoreChange({ diagnosedMDD: v })} note={core.diagnosedMDDNote} onNoteChange={(v) => onCoreChange({ diagnosedMDDNote: v })} notePlaceholder="Severity, current meds..." />
            <CheckRow id="d3-bp" label="Bipolar disorder (I or II)" checked={core.diagnosedBipolar} onChange={(v) => onCoreChange({ diagnosedBipolar: v })} note={core.diagnosedBipolarNote} onNoteChange={(v) => onCoreChange({ diagnosedBipolarNote: v })} notePlaceholder="Type, current phase, meds..." />
            <CheckRow id="d3-sz" label="Schizophrenia spectrum disorder" checked={core.diagnosedSchizophreniaSpectrum} onChange={(v) => onCoreChange({ diagnosedSchizophreniaSpectrum: v })} note={core.diagnosedSchizophreniaSpectrumNote} onNoteChange={(v) => onCoreChange({ diagnosedSchizophreniaSpectrumNote: v })} notePlaceholder="Dx, compliance, LAI?" />
            <CheckRow id="d3-ptsd" label="PTSD / trauma spectrum" checked={core.diagnosedPTSD} onChange={(v) => onCoreChange({ diagnosedPTSD: v })} note={core.diagnosedPTSDNote} onNoteChange={(v) => onCoreChange({ diagnosedPTSDNote: v })} notePlaceholder="Trauma type, tx history..." />
            <CheckRow id="d3-adhd" label="ADHD" checked={core.diagnosedADHD} onChange={(v) => onCoreChange({ diagnosedADHD: v })} note={core.diagnosedADHDNote} onNoteChange={(v) => onCoreChange({ diagnosedADHDNote: v })} notePlaceholder="Type, current tx..." />
            <CheckRow id="d3-pd" label="Personality disorder" checked={core.diagnosedPersonalityDisorder} onChange={(v) => onCoreChange({ diagnosedPersonalityDisorder: v })} note={core.diagnosedPersonalityDisorderNote} onNoteChange={(v) => onCoreChange({ diagnosedPersonalityDisorderNote: v })} notePlaceholder="Type, functioning..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Management Needs</p>
            <CheckRow id="d3-psymed" label="Requires psychiatric medication management"
              checked={core.requiresPsychMedManagement}
              onChange={(v) => { onCoreChange({ requiresPsychMedManagement: v }); if (!v) setOverride("requiresPsychMedManagement"); }}
              note={core.requiresPsychMedManagementNote} onNoteChange={(v) => onCoreChange({ requiresPsychMedManagementNote: v })} notePlaceholder="Medications, monitoring..."
              autoRationale={psychMedAutoActive ? psychMedRationale : undefined}
              onAutoOverride={() => { setOverride("requiresPsychMedManagement"); onCoreChange({ requiresPsychMedManagement: false }); }}
            />
            <CheckRow id="d3-psymon" label="Requires psychiatric monitoring" sublabel="Medication response, side effects, decompensation"
              checked={core.requiresPsychiatricMonitoring}
              onChange={(v) => { onCoreChange({ requiresPsychiatricMonitoring: v }); if (!v) setOverride("requiresPsychiatricMonitoring"); }}
              note={core.requiresPsychiatricMonitoringNote} onNoteChange={(v) => onCoreChange({ requiresPsychiatricMonitoringNote: v })} notePlaceholder="Frequency, parameters..."
              autoRationale={psychMonAutoActive ? psychMonRationale : undefined}
              onAutoOverride={() => { setOverride("requiresPsychiatricMonitoring"); onCoreChange({ requiresPsychiatricMonitoring: false }); }}
            />
          </div>
        </div>

        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Core / Safety Comments</Label>
          <Textarea value={core.comments} onChange={(e) => onCoreChange({ comments: e.target.value })} rows={2} placeholder="Specific psychiatric findings, safety plan details, mental status exam highlights..." className="mt-1 text-sm resize-none" data-testid="d3-core-comments" />
        </div>
      </SectionBlock>

      <SectionBlock type="extra" title="Formulation Factors" subtitle="Biopsychosocial / H&P Supplement" defaultOpen={mode === "expanded"}>
        {mode === "expanded" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Trauma / Stressors</p>
              <CheckRow id="d3e-trauma" label="Trauma history present" sublabel="PTSD, complex trauma, sexual/physical/emotional abuse" checked={extra.traumaHistoryPresent} onChange={(v) => onExtraChange({ traumaHistoryPresent: v })} note={extra.traumaHistoryPresentNote} onNoteChange={(v) => onExtraChange({ traumaHistoryPresentNote: v })} notePlaceholder="Type, disclosure level..." />
              <CheckRow id="d3e-aces" label="Childhood adversity / ACEs" checked={extra.childhoodAdversity} onChange={(v) => onExtraChange({ childhoodAdversity: v })} note={extra.childhoodAdversityNote} onNoteChange={(v) => onExtraChange({ childhoodAdversityNote: v })} notePlaceholder="ACE score if known..." />
              <CheckRow id="d3e-stress" label="Acute psychosocial stressor" sublabel="Job loss, separation, legal, financial" checked={extra.acutePsychosocialStressor} onChange={(v) => onExtraChange({ acutePsychosocialStressor: v })} note={extra.acutePsychosocialStressorNote} onNoteChange={(v) => onExtraChange({ acutePsychosocialStressorNote: v })} notePlaceholder="Stressor type, impact..." />
              <CheckRow id="d3e-grief" label="Recent grief or significant loss" checked={extra.griefOrLossRecent} onChange={(v) => onExtraChange({ griefOrLossRecent: v })} note={extra.griefOrLossRecentNote} onNoteChange={(v) => onExtraChange({ griefOrLossRecentNote: v })} notePlaceholder="Loss, timeline..." />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Cognitive / Developmental</p>
              <CheckRow id="d3e-cog" label="Cognitive impairment present" sublabel="Dementia, encephalopathy, TBI sequelae" checked={extra.cognitiveImpairmentPresent} onChange={(v) => onExtraChange({ cognitiveImpairmentPresent: v })} note={extra.cognitiveImpairmentPresentNote} onNoteChange={(v) => onExtraChange({ cognitiveImpairmentPresentNote: v })} notePlaceholder="Type, severity, MOCA/MMSE..." />
              <CheckRow id="d3e-id" label="Intellectual disability present" checked={extra.intellectualDisabilityPresent} onChange={(v) => onExtraChange({ intellectualDisabilityPresent: v })} note={extra.intellectualDisabilityPresentNote} onNoteChange={(v) => onExtraChange({ intellectualDisabilityPresentNote: v })} notePlaceholder="Level of functioning..." />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Diagnostic Clarity</p>
            <CheckRow id="d3e-subind" label="Substance-induced psychiatric sx" sublabel="Expected to resolve with abstinence" checked={extra.substanceInducedPsychiatric} onChange={(v) => onExtraChange({ substanceInducedPsychiatric: v })} note={extra.substanceInducedPsychiatricNote} onNoteChange={(v) => onExtraChange({ substanceInducedPsychiatricNote: v })} notePlaceholder="Timeline correlation..." />
            <CheckRow id="d3e-primary" label="Primary psychiatric disorder (independent of SUD)" checked={extra.primaryPsychiatricIndependent} onChange={(v) => onExtraChange({ primaryPsychiatricIndependent: v })} note={extra.primaryPsychiatricIndependentNote} onNoteChange={(v) => onExtraChange({ primaryPsychiatricIndependentNote: v })} notePlaceholder="Evidence for primary dx..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strengths</p>
            <CheckRow id="d3e-txengaged" label="Previously engaged in psychiatric treatment" checked={extra.psychiatricTreatmentEngaged} onChange={(v) => onExtraChange({ psychiatricTreatmentEngaged: v })} note={extra.psychiatricTreatmentEngagedNote} onNoteChange={(v) => onExtraChange({ psychiatricTreatmentEngagedNote: v })} notePlaceholder="Where, duration..." />
            <CheckRow id="d3e-insight" label="Has insight into mental illness" checked={extra.insightIntoMentalIllness} onChange={(v) => onExtraChange({ insightIntoMentalIllness: v })} note={extra.insightIntoMentalIllnessNote} onNoteChange={(v) => onExtraChange({ insightIntoMentalIllnessNote: v })} notePlaceholder="Specific examples..." />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Formulation Notes</Label>
          <Textarea value={extra.comments} onChange={(e) => onExtraChange({ comments: e.target.value })} rows={2} placeholder="Psychiatric formulation, predisposing/precipitating/perpetuating/protective factors..." className="mt-1 text-sm resize-none" data-testid="d3-extra-comments" />
        </div>
      </SectionBlock>
    </div>
  );
}
