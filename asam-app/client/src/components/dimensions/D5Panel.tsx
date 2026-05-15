// D5: Relapse / Continued Use / Continued Problem Potential (3rd/hybrid) / Recovery Environment Interactions (4th)
import { useMemo, useState, useEffect } from "react";
import { RiskSlider } from "@/components/RiskSlider";
import { CheckRow } from "@/components/CheckRow";
import { SectionBlock } from "@/components/SectionBlock";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info } from "lucide-react";
import { computeD5Suggestion } from "@/lib/riskSuggestions";
import { cn } from "@/lib/utils";
import type { D5Core, D5Extra, RiskRating } from "@shared/schema";

interface D5PanelProps {
  core: D5Core; extra: D5Extra;
  onCoreChange: (patch: Partial<D5Core>) => void;
  onExtraChange: (patch: Partial<D5Extra>) => void;
  edition?: "3rd" | "4th" | "hybrid";
}

export function D5Panel({ core, extra, onCoreChange, onExtraChange, edition = "3rd" }: D5PanelProps) {
  const is4th = edition === "4th";
  const panelHeader = is4th ? "Recovery Environment Interactions" : "Relapse / Continued Use Potential";
  const panelSubtitle = is4th ? "Environment safety, support, and functioning" : "Relapse Risk / Treatment History";
  const [userOverrode, setUserOverrode] = useState(false);

  // ── Auto-check logic ───────────────────────────────────────────────────────────
  const [autoOverrides, setAutoOverrides] = useState<Set<string>>(new Set());
  const setOverride = (field: string) => setAutoOverrides(prev => new Set([...prev, field]));
  const clearOverride = (field: string) => setAutoOverrides(prev => { const s = new Set(prev); s.delete(field); return s; });

  // multiplePriorTreatmentEpisodes: auto-check if specific prior admissions checked
  const multiTrigger = core.priorASAM37Admission || core.priorASAM35Admission || core.relapsedFromPriorLevel;
  const multiRationale = [
    core.priorASAM37Admission && "prior ASAM 3.7 admission implies multiple treatment episodes",
    core.priorASAM35Admission && "prior ASAM 3.5 admission implies multiple treatment episodes",
    core.relapsedFromPriorLevel && "relapse from prior level of care implies previous treatment episode",
  ].filter(Boolean).join("; ");

  // dailyOrNearDailyUse: auto-check if using to prevent withdrawal
  const dailyTrigger = core.useToPreventWithdrawal;
  const dailyRationale = "use to prevent withdrawal indicates daily physiologic dependence";

  useEffect(() => {
    if (multiTrigger && !core.multiplePriorTreatmentEpisodes && !autoOverrides.has("multiplePriorTreatmentEpisodes"))
      onCoreChange({ multiplePriorTreatmentEpisodes: true });
    if (!multiTrigger && autoOverrides.has("multiplePriorTreatmentEpisodes")) clearOverride("multiplePriorTreatmentEpisodes");
  }, [multiTrigger]);

  useEffect(() => {
    if (dailyTrigger && !core.dailyOrNearDailyUse && !autoOverrides.has("dailyOrNearDailyUse"))
      onCoreChange({ dailyOrNearDailyUse: true });
    if (!dailyTrigger && autoOverrides.has("dailyOrNearDailyUse")) clearOverride("dailyOrNearDailyUse");
  }, [dailyTrigger]);

  const multiAutoActive = multiTrigger && !autoOverrides.has("multiplePriorTreatmentEpisodes") && core.multiplePriorTreatmentEpisodes;
  const dailyAutoActive = dailyTrigger && !autoOverrides.has("dailyOrNearDailyUse") && core.dailyOrNearDailyUse;

  const suggestion = useMemo(() => computeD5Suggestion(core), [
    core.multiplePriorTreatmentEpisodes, core.relapsedFromPriorLevel, core.priorASAM37Admission,
    core.priorASAM35Admission, core.priorDetoxOnlyNoFollowup, core.cravingsHighAtAdmission,
    core.triggerRichEnvironment, core.coOccurringDisorderUntreated, core.lackOfCopingSkills,
    core.dailyOrNearDailyUse, core.useToPreventWithdrawal,
  ]);

  return (
    <div className="space-y-3">
      {is4th && (
        <div className="flex gap-2 rounded-lg border border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-700 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-sky-700 dark:text-sky-300 leading-snug">
            <span className="font-semibold">4th Edition: {panelHeader}</span> — How the recovery environment and community factors interact with substance use risk, relapse potential, and social functioning.
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
          <RiskSlider label="D5 Risk Rating" value={core.riskRating} onChange={(v) => onCoreChange({ riskRating: v as RiskRating })} onOverrideChange={setUserOverrode} suggested={suggestion.suggested} rationale={suggestion.rationale} userOverrode={userOverrode} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Treatment History</p>
            <CheckRow id="d5-multi" label="Multiple prior treatment episodes" sublabel="3 or more formal treatment episodes" checked={core.multiplePriorTreatmentEpisodes} onChange={(v) => { onCoreChange({ multiplePriorTreatmentEpisodes: v }); if (!v) setOverride("multiplePriorTreatmentEpisodes"); }} note={core.multiplePriorTreatmentEpisodesNote} onNoteChange={(v) => onCoreChange({ multiplePriorTreatmentEpisodesNote: v })} notePlaceholder="# episodes, types, outcomes..." autoRationale={multiAutoActive ? multiRationale : undefined} onAutoOverride={() => { setOverride("multiplePriorTreatmentEpisodes"); onCoreChange({ multiplePriorTreatmentEpisodes: false }); }} />
            <CheckRow id="d5-relapse" label="Relapsed from prior level of care" sublabel="Relapse shortly after step-down" checked={core.relapsedFromPriorLevel} onChange={(v) => onCoreChange({ relapsedFromPriorLevel: v })} note={core.relapsedFromPriorLevelNote} onNoteChange={(v) => onCoreChange({ relapsedFromPriorLevelNote: v })} notePlaceholder="LOC, time to relapse..." />
            <CheckRow id="d5-37hx" label="Prior ASAM 3.7 admission" checked={core.priorASAM37Admission} onChange={(v) => onCoreChange({ priorASAM37Admission: v })} note={core.priorASAM37AdmissionNote} onNoteChange={(v) => onCoreChange({ priorASAM37AdmissionNote: v })} notePlaceholder="When, outcome..." />
            <CheckRow id="d5-35hx" label="Prior ASAM 3.5 admission" checked={core.priorASAM35Admission} onChange={(v) => onCoreChange({ priorASAM35Admission: v })} note={core.priorASAM35AdmissionNote} onNoteChange={(v) => onCoreChange({ priorASAM35AdmissionNote: v })} notePlaceholder="When, completion status..." />
            <CheckRow id="d5-detoxonly" label="Prior detox only — no follow-up treatment" sublabel="No step-down to residential / rehab" checked={core.priorDetoxOnlyNoFollowup} onChange={(v) => onCoreChange({ priorDetoxOnlyNoFollowup: v })} note={core.priorDetoxOnlyNoFollowupNote} onNoteChange={(v) => onCoreChange({ priorDetoxOnlyNoFollowupNote: v })} notePlaceholder="# detox-only episodes..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current Relapse Risk</p>
            <CheckRow id="d5-crave" label="High cravings at admission" checked={core.cravingsHighAtAdmission} onChange={(v) => onCoreChange({ cravingsHighAtAdmission: v })} note={core.cravingsHighAtAdmissionNote} onNoteChange={(v) => onCoreChange({ cravingsHighAtAdmissionNote: v })} notePlaceholder="Severity, triggers identified..." />
            <CheckRow id="d5-trigger" label="Trigger-rich home/social environment" sublabel="Exposure to use cues upon discharge" checked={core.triggerRichEnvironment} onChange={(v) => onCoreChange({ triggerRichEnvironment: v })} note={core.triggerRichEnvironmentNote} onNoteChange={(v) => onCoreChange({ triggerRichEnvironmentNote: v })} notePlaceholder="Specific triggers, plan..." />
            <CheckRow id="d5-cooc" label="Co-occurring disorder inadequately treated" sublabel="Untreated psych illness driving relapse" checked={core.coOccurringDisorderUntreated} onChange={(v) => onCoreChange({ coOccurringDisorderUntreated: v })} note={core.coOccurringDisorderUntreatedNote} onNoteChange={(v) => onCoreChange({ coOccurringDisorderUntreatedNote: v })} notePlaceholder="Disorder, tx gap..." />
            <CheckRow id="d5-cope" label="Lacks adequate coping skills" checked={core.lackOfCopingSkills} onChange={(v) => onCoreChange({ lackOfCopingSkills: v })} note={core.lackOfCopingSkillsNote} onNoteChange={(v) => onCoreChange({ lackOfCopingSkillsNote: v })} notePlaceholder="Coping deficits identified..." />
            <CheckRow id="d5-daily" label="Daily or near-daily use pattern" checked={core.dailyOrNearDailyUse} onChange={(v) => { onCoreChange({ dailyOrNearDailyUse: v }); if (!v) setOverride("dailyOrNearDailyUse"); }} note={core.dailyOrNearDailyUseNote} onNoteChange={(v) => onCoreChange({ dailyOrNearDailyUseNote: v })} notePlaceholder="Duration, quantity..." autoRationale={dailyAutoActive ? dailyRationale : undefined} onAutoOverride={() => { setOverride("dailyOrNearDailyUse"); onCoreChange({ dailyOrNearDailyUse: false }); }} />
            <CheckRow id="d5-wduse" label="Using to prevent withdrawal" sublabel="Physiologic dependence driving continued use" checked={core.useToPreventWithdrawal} onChange={(v) => onCoreChange({ useToPreventWithdrawal: v })} note={core.useToPreventWithdrawalNote} onNoteChange={(v) => onCoreChange({ useToPreventWithdrawalNote: v })} notePlaceholder="Patient's words..." />
          </div>
        </div>

        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Core Comments</Label>
          <Textarea value={core.comments} onChange={(e) => onCoreChange({ comments: e.target.value })} rows={2} placeholder="Relapse pattern, triggers identified, prior treatment response..." className="mt-1 text-sm resize-none" data-testid="d5-core-comments" />
        </div>
      </SectionBlock>

      <SectionBlock type="extra" title="Additional Formulation Factors" subtitle="Relapse Mechanisms / Protective Factors" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Risk Amplifiers</p>
            <CheckRow id="d5e-kind" label="Kindling / progressive severity pattern" sublabel="Each episode worse than prior" checked={extra.kindlingOrProgressivePatternPresent} onChange={(v) => onExtraChange({ kindlingOrProgressivePatternPresent: v })} note={extra.kindlingOrProgressivePatternPresentNote} onNoteChange={(v) => onExtraChange({ kindlingOrProgressivePatternPresentNote: v })} notePlaceholder="Pattern observed..." />
            <CheckRow id="d5e-behav" label="Concurrent behavioral addiction" sublabel="Gambling, gaming, sexual compulsivity" checked={extra.behavioralAddictionConcurrent} onChange={(v) => onExtraChange({ behavioralAddictionConcurrent: v })} note={extra.behavioralAddictionConcurrentNote} onNoteChange={(v) => onExtraChange({ behavioralAddictionConcurrentNote: v })} notePlaceholder="Type, severity..." />
            <CheckRow id="d5e-od" label="Prior overdose — high-risk pattern" checked={extra.priorODHighRiskPattern} onChange={(v) => onExtraChange({ priorODHighRiskPattern: v })} note={extra.priorODHighRiskPatternNote} onNoteChange={(v) => onExtraChange({ priorODHighRiskPatternNote: v })} notePlaceholder="# ODs, naloxone use..." />
            <CheckRow id="d5e-low" label="Low frustration tolerance" sublabel="Impulsivity as relapse driver" checked={extra.lowFrustrationTolerance} onChange={(v) => onExtraChange({ lowFrustrationTolerance: v })} note={extra.lowFrustrationToleranceNote} onNoteChange={(v) => onExtraChange({ lowFrustrationToleranceNote: v })} notePlaceholder="Examples observed..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Protective / Strengths</p>
            <CheckRow id="d5e-success" label="Prior successful recovery period" checked={extra.priorSuccessfulRecovery} onChange={(v) => onExtraChange({ priorSuccessfulRecovery: v })} note={extra.priorSuccessfulRecoveryNote} onNoteChange={(v) => onExtraChange({ priorSuccessfulRecoveryNote: v })} notePlaceholder="Duration, what worked..." />
            <CheckRow id="d5e-clean" label="Extended clean time in the past" sublabel="Demonstrates recovery capacity" checked={extra.longCleanTimeInPast} onChange={(v) => onExtraChange({ longCleanTimeInPast: v })} note={extra.longCleanTimeInPastNote} onNoteChange={(v) => onExtraChange({ longCleanTimeInPastNote: v })} notePlaceholder="Longest sobriety, factors..." />
            <CheckRow id="d5e-warn" label="Relapse warning signs identified" sublabel="Patient aware of personal triggers" checked={extra.relapseWarningSignsIdentified} onChange={(v) => onExtraChange({ relapseWarningSignsIdentified: v })} note={extra.relapseWarningSignsIdentifiedNote} onNoteChange={(v) => onExtraChange({ relapseWarningSignsIdentifiedNote: v })} notePlaceholder="Signs patient identified..." />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Formulation Notes</Label>
          <Textarea value={extra.comments} onChange={(e) => onExtraChange({ comments: e.target.value })} rows={2} placeholder="Relapse cycle analysis, high-risk situations, protective factors..." className="mt-1 text-sm resize-none" data-testid="d5-extra-comments" />
        </div>
      </SectionBlock>
    </div>
  );
}
