// D4: Readiness to Change (3rd/hybrid) / Substance Use-Related Risks (4th)
import { useMemo, useState } from "react";
import { RiskSlider } from "@/components/RiskSlider";
import { CheckRow } from "@/components/CheckRow";
import { SectionBlock } from "@/components/SectionBlock";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info } from "lucide-react";
import { computeD4Suggestion } from "@/lib/riskSuggestions";
import { cn } from "@/lib/utils";
import type { D4Core, D4Extra, RiskRating } from "@shared/schema";

interface D4PanelProps {
  core: D4Core; extra: D4Extra;
  onCoreChange: (patch: Partial<D4Core>) => void;
  onExtraChange: (patch: Partial<D4Extra>) => void;
  edition?: "3rd" | "4th" | "hybrid";
}

export function D4Panel({ core, extra, onCoreChange, onExtraChange, edition = "3rd" }: D4PanelProps) {
  const is4th = edition === "4th";
  const panelHeader = is4th ? "Substance Use-Related Risks" : "Readiness to Change";
  const panelSubtitle = is4th ? "Use patterns, behaviors, and associated risks" : "Motivation / Treatment Readiness";
  const [userOverrode, setUserOverrode] = useState(false);

  const suggestion = useMemo(() => computeD4Suggestion(core), [
    core.stagePrecontemplation, core.stageContemplation, core.stagePreparation, core.stageAction,
    core.deniesToHaveProblem, core.ambivalentAboutTreatment, core.externalPressureOnly,
    core.refusedMedicationAssistedTreatment, core.limitedInsightIntoSeverity,
  ]);

  return (
    <div className="space-y-3">
      {is4th && (
        <div className="flex gap-2 rounded-lg border border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-700 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-sky-700 dark:text-sky-300 leading-snug">
            <span className="font-semibold">4th Edition: {panelHeader}</span> — Likelihood of risky substance use patterns, route, polysubstance, and use-related behaviors (needle sharing, impaired driving, risky sexual behavior, legal risks).
          </p>
        </div>
      )}
      {suggestion.alert && (
        <div className={cn("flex gap-2.5 rounded-lg border px-3 py-2.5",
          "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
        )} role="alert">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-snug">{suggestion.alert}</p>
        </div>
      )}

      <SectionBlock type="core" title={panelHeader} subtitle={panelSubtitle}>
        <div className="pb-2">
          <RiskSlider label="D4 Risk Rating" value={core.riskRating} onChange={(v) => onCoreChange({ riskRating: v as RiskRating })} onOverrideChange={setUserOverrode} suggested={suggestion.suggested} rationale={suggestion.rationale} userOverrode={userOverrode} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Motivational Stage (TTM)</p>
            <CheckRow id="d4-precon" label="Precontemplation" sublabel="Does not recognize problem or need for change" checked={core.stagePrecontemplation} onChange={(v) => onCoreChange({ stagePrecontemplation: v })} note={core.stagePrecontemplationNote} onNoteChange={(v) => onCoreChange({ stagePrecontemplationNote: v })} notePlaceholder="Patient statements, clinical observations..." />
            <CheckRow id="d4-con" label="Contemplation" sublabel="Ambivalent — weighing pros and cons" checked={core.stageContemplation} onChange={(v) => onCoreChange({ stageContemplation: v })} note={core.stageContemplationNote} onNoteChange={(v) => onCoreChange({ stageContemplationNote: v })} notePlaceholder="Change talk identified..." />
            <CheckRow id="d4-prep" label="Preparation" sublabel="Intending to act soon, some steps taken" checked={core.stagePreparation} onChange={(v) => onCoreChange({ stagePreparation: v })} note={core.stagePreparationNote} onNoteChange={(v) => onCoreChange({ stagePreparationNote: v })} notePlaceholder="Steps taken, stated goals..." />
            <CheckRow id="d4-act" label="Action" sublabel="Actively working toward change" checked={core.stageAction} onChange={(v) => onCoreChange({ stageAction: v })} note={core.stageActionNote} onNoteChange={(v) => onCoreChange({ stageActionNote: v })} notePlaceholder="Specific actions, engagement..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Engagement Barriers</p>
            <CheckRow id="d4-deny" label="Denies having a problem" sublabel="Insight deficit — key UM criterion" checked={core.deniesToHaveProblem} onChange={(v) => onCoreChange({ deniesToHaveProblem: v })} note={core.deniesToHaveProblemNote} onNoteChange={(v) => onCoreChange({ deniesToHaveProblemNote: v })} notePlaceholder="Specific statements..." />
            <CheckRow id="d4-ambiv" label="Ambivalent about treatment" checked={core.ambivalentAboutTreatment} onChange={(v) => onCoreChange({ ambivalentAboutTreatment: v })} note={core.ambivalentAboutTreatmentNote} onNoteChange={(v) => onCoreChange({ ambivalentAboutTreatmentNote: v })} notePlaceholder="MI assessment findings..." />
            <CheckRow id="d4-ext" label="External pressure only (no intrinsic motivation)" sublabel="Legal, family — no self-identified need" checked={core.externalPressureOnly} onChange={(v) => onCoreChange({ externalPressureOnly: v })} note={core.externalPressureOnlyNote} onNoteChange={(v) => onCoreChange({ externalPressureOnlyNote: v })} notePlaceholder="Source of pressure..." />
            <CheckRow id="d4-nomat" label="Refused medication-assisted treatment" checked={core.refusedMedicationAssistedTreatment} onChange={(v) => onCoreChange({ refusedMedicationAssistedTreatment: v })} note={core.refusedMedicationAssistedTreatmentNote} onNoteChange={(v) => onCoreChange({ refusedMedicationAssistedTreatmentNote: v })} notePlaceholder="Reason stated, counseled?" />
            <CheckRow id="d4-insight" label="Limited insight into illness severity" checked={core.limitedInsightIntoSeverity} onChange={(v) => onCoreChange({ limitedInsightIntoSeverity: v })} note={core.limitedInsightIntoSeverityNote} onNoteChange={(v) => onCoreChange({ limitedInsightIntoSeverityNote: v })} notePlaceholder="Examples of minimization..." />
          </div>
        </div>

        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Core Comments</Label>
          <Textarea value={core.comments} onChange={(e) => onCoreChange({ comments: e.target.value })} rows={2} placeholder="Motivational assessment findings, MI approach, engagement with treatment team..." className="mt-1 text-sm resize-none" data-testid="d4-core-comments" />
        </div>
      </SectionBlock>

      <SectionBlock type="extra" title="Additional Formulation Factors" subtitle="Barriers / Strengths" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Barriers to Engagement</p>
            <CheckRow id="d4e-mi" label="MI targeted in treatment plan" sublabel="Motivational interviewing indicated" checked={extra.motivationalInterviewingTargeted} onChange={(v) => onExtraChange({ motivationalInterviewingTargeted: v })} note={extra.motivationalInterviewingTargetedNote} onNoteChange={(v) => onExtraChange({ motivationalInterviewingTargetedNote: v })} notePlaceholder="Stage-matched interventions..." />
            <CheckRow id="d4e-hx" label="Historically poor treatment engagement" checked={extra.historicalEngagementPoor} onChange={(v) => onExtraChange({ historicalEngagementPoor: v })} note={extra.historicalEngagementPoorNote} onNoteChange={(v) => onExtraChange({ historicalEngagementPoorNote: v })} notePlaceholder="# programs, AMA hx..." />
            <CheckRow id="d4e-cog" label="Cognitive barriers to engagement" sublabel="Impaired insight, learning challenges" checked={extra.cognitiveBarriersToEngagement} onChange={(v) => onExtraChange({ cognitiveBarriersToEngagement: v })} note={extra.cognitiveBarriersToEngagementNote} onNoteChange={(v) => onExtraChange({ cognitiveBarriersToEngagementNote: v })} notePlaceholder="Specific deficit, accommodation needed..." />
            <CheckRow id="d4e-lang" label="Cultural or language barrier" checked={extra.culturalOrLanguageBarrier} onChange={(v) => onExtraChange({ culturalOrLanguageBarrier: v })} note={extra.culturalOrLanguageBarrierNote} onNoteChange={(v) => onExtraChange({ culturalOrLanguageBarrierNote: v })} notePlaceholder="Language, interpreter needed?" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Protective / Strengths</p>
            <CheckRow id="d4e-self" label="Self-identifies need for help" checked={extra.selfIdentifiesNeedForHelp} onChange={(v) => onExtraChange({ selfIdentifiesNeedForHelp: v })} note={extra.selfIdentifiesNeedForHelpNote} onNoteChange={(v) => onExtraChange({ selfIdentifiesNeedForHelpNote: v })} notePlaceholder="Direct quotes, context..." />
            <CheckRow id="d4e-fam" label="Family pressure is positive (supportive of treatment)" checked={extra.familyPressurePositive} onChange={(v) => onExtraChange({ familyPressurePositive: v })} note={extra.familyPressurePositiveNote} onNoteChange={(v) => onExtraChange({ familyPressurePositiveNote: v })} notePlaceholder="Who, how engaged..." />
            <CheckRow id="d4e-spirit" label="Spiritual / value-based motivation for change" checked={extra.spiritualOrValueBasedMotivation} onChange={(v) => onExtraChange({ spiritualOrValueBasedMotivation: v })} note={extra.spiritualOrValueBasedMotivationNote} onNoteChange={(v) => onExtraChange({ spiritualOrValueBasedMotivationNote: v })} notePlaceholder="Values identified, leverage points..." />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Formulation Notes</Label>
          <Textarea value={extra.comments} onChange={(e) => onExtraChange({ comments: e.target.value })} rows={2} placeholder="Motivational formulation, identified change talk, leverage points..." className="mt-1 text-sm resize-none" data-testid="d4-extra-comments" />
        </div>
      </SectionBlock>
    </div>
  );
}
