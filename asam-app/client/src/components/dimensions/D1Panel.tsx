// D1: Acute Intoxication / Withdrawal Potential
import { useMemo, useState, useEffect } from "react";
import { RiskSlider } from "@/components/RiskSlider";
import { CheckRow } from "@/components/CheckRow";
import { SectionBlock } from "@/components/SectionBlock";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { computeD1Suggestion } from "@/lib/riskSuggestions";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { D1Core, D1Extra, RiskRating } from "@shared/schema";

interface D1PanelProps {
  core: D1Core; extra: D1Extra;
  onCoreChange: (patch: Partial<D1Core>) => void;
  onExtraChange: (patch: Partial<D1Extra>) => void;
}

export function D1Panel({ core, extra, onCoreChange, onExtraChange }: D1PanelProps) {
  const [userOverrode, setUserOverrode] = useState(false);

  // ── Auto-check overrides (user clicked "uncheck anyway") ────────────────────
  const [autoOverrides, setAutoOverrides] = useState<Set<string>>(new Set());
  const setOverride = (field: string) => setAutoOverrides(prev => new Set([...prev, field]));

  // Auto-check: requiresDetoxPharmacology
  const pharmTrigger =
    core.historyOfDTs || core.historyOfWithdrawalSeizures ||
    core.opioidPrimary || core.benzodiazepinePrimary ||
    (core.alcoholPrimary && core.activeWithdrawal);
  const pharmRationale = [
    (core.historyOfDTs || core.historyOfWithdrawalSeizures) && "high-risk withdrawal history requires pharmacologic prophylaxis",
    core.opioidPrimary && "opioid use requires buprenorphine induction assessment",
    core.benzodiazepinePrimary && "benzo dependence requires supervised taper protocol",
    (core.alcoholPrimary && core.activeWithdrawal) && "active alcohol withdrawal requires CIWA-guided pharmacotherapy",
  ].filter(Boolean).join("; ");

  // Auto-check: requiresMedicalMonitoring
  const medMonTrigger =
    core.requiresDetoxPharmacology || core.ivFluidOrPressor ||
    core.activeWithdrawal || core.historyOfDTs || core.historyOfWithdrawalSeizures;
  const medMonRationale = [
    core.requiresDetoxPharmacology && "detox pharmacology requires nursing oversight for safety",
    core.ivFluidOrPressor && "IV/vasopressor requires continuous monitoring",
    core.activeWithdrawal && "active withdrawal requires vital sign and symptom monitoring",
    (core.historyOfDTs || core.historyOfWithdrawalSeizures) && "severe withdrawal history warrants close monitoring",
  ].filter(Boolean).join("; ");

  // Apply auto-checks in effect
  useEffect(() => {
    if (pharmTrigger && !core.requiresDetoxPharmacology && !autoOverrides.has("requiresDetoxPharmacology")) {
      onCoreChange({ requiresDetoxPharmacology: true });
    }
    if (!pharmTrigger && core.requiresDetoxPharmacology && autoOverrides.has("requiresDetoxPharmacology")) {
      // trigger went away, clear the override so it can re-auto-check next time
      setAutoOverrides(prev => { const s = new Set(prev); s.delete("requiresDetoxPharmacology"); return s; });
    }
  }, [pharmTrigger]);

  useEffect(() => {
    if (medMonTrigger && !core.requiresMedicalMonitoring && !autoOverrides.has("requiresMedicalMonitoring")) {
      onCoreChange({ requiresMedicalMonitoring: true });
    }
    if (!medMonTrigger && core.requiresMedicalMonitoring && autoOverrides.has("requiresMedicalMonitoring")) {
      setAutoOverrides(prev => { const s = new Set(prev); s.delete("requiresMedicalMonitoring"); return s; });
    }
  }, [medMonTrigger]);

  // Active rationale: only show banner if the trigger is active AND user hasn't manually set it themselves
  const pharmAutoActive = pharmTrigger && !autoOverrides.has("requiresDetoxPharmacology") && core.requiresDetoxPharmacology;
  const medMonAutoActive = medMonTrigger && !autoOverrides.has("requiresMedicalMonitoring") && core.requiresMedicalMonitoring;

  const suggestion = useMemo(
    () => computeD1Suggestion(core, extra),
    [core.activeIntoxication, core.activeWithdrawal, core.polySubstanceUse,
     core.historyOfDTs, core.historyOfWithdrawalSeizures, core.ivFluidOrPressor,
     core.ciwaScore, core.cowsScore, core.requiresDetoxPharmacology, core.requiresMedicalMonitoring,
     extra.chronicHeavyUse, extra.lastUseRecent, extra.priorDetoxMultiple, extra.neurologicVulnerability]
  );

  return (
    <div className="space-y-3">
      {suggestion.alert && (
        <div className={cn("flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
          suggestion.alertLevel === "critical"
            ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-200"
            : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200"
        )} role="alert" data-testid="d1-risk-alert">
          {suggestion.alertLevel === "critical" ? <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
          <p className="text-xs leading-snug">{suggestion.alert}</p>
        </div>
      )}

      <SectionBlock type="core" title="ASAM Core Factors" subtitle="Withdrawal / Intoxication Risk">
        <div className="pb-3">
          <RiskSlider label="D1 Risk Rating" value={core.riskRating} onChange={(v) => onCoreChange({ riskRating: v as RiskRating })} onOverrideChange={setUserOverrode} suggested={suggestion.suggested} rationale={suggestion.rationale} userOverrode={userOverrode} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current Status</p>
            <CheckRow id="d1-intox" label="Active intoxication at admission" checked={core.activeIntoxication} onChange={(v) => onCoreChange({ activeIntoxication: v })} note={core.activeIntoxicationNote} onNoteChange={(v) => onCoreChange({ activeIntoxicationNote: v })} notePlaceholder="Substance, route, estimated last use..." highlight />
            <CheckRow id="d1-wd" label="Active withdrawal signs/symptoms" checked={core.activeWithdrawal} onChange={(v) => onCoreChange({ activeWithdrawal: v })} note={core.activeWithdrawalNote} onNoteChange={(v) => onCoreChange({ activeWithdrawalNote: v })} notePlaceholder="Symptoms, onset, severity..." highlight />
            <CheckRow id="d1-poly" label="Polysubstance use (≥2 substances)" checked={core.polySubstanceUse} onChange={(v) => onCoreChange({ polySubstanceUse: v })} note={core.polySubstanceUseNote} onNoteChange={(v) => onCoreChange({ polySubstanceUseNote: v })} notePlaceholder="Substances, pattern..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Severe Withdrawal History</p>
            <CheckRow id="d1-dts" label="History of delirium tremens (DTs)" checked={core.historyOfDTs} onChange={(v) => onCoreChange({ historyOfDTs: v })} note={core.historyOfDTsNote} onNoteChange={(v) => onCoreChange({ historyOfDTsNote: v })} notePlaceholder="Year, severity, hospitalized?" highlight />
            <CheckRow id="d1-seiz" label="History of withdrawal seizures" checked={core.historyOfWithdrawalSeizures} onChange={(v) => onCoreChange({ historyOfWithdrawalSeizures: v })} note={core.historyOfWithdrawalSeizuresNote} onNoteChange={(v) => onCoreChange({ historyOfWithdrawalSeizuresNote: v })} notePlaceholder="Type, when, prophylaxis?" highlight />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <Label className="text-xs text-muted-foreground">CIWA-Ar Score</Label>
            <Input value={core.ciwaScore} onChange={(e) => onCoreChange({ ciwaScore: e.target.value })} placeholder="e.g. CIWA-Ar 14" className="h-8 text-sm mt-1" data-testid="input-ciwa" />
            <p className="text-[0.62rem] text-muted-foreground mt-0.5 leading-tight">≥15 severe · 10–14 mod-severe · 5–9 mild</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">COWS Score</Label>
            <Input value={core.cowsScore} onChange={(e) => onCoreChange({ cowsScore: e.target.value })} placeholder="e.g. COWS 8" className="h-8 text-sm mt-1" data-testid="input-cows" />
            <p className="text-[0.62rem] text-muted-foreground mt-0.5 leading-tight">≥25 severe · 13–24 mod · 5–12 mild</p>
          </div>
        </div>

        <div className="pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Primary Substance(s)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4">
            <CheckRow id="d1-etoh" label="Alcohol" checked={core.alcoholPrimary} onChange={(v) => onCoreChange({ alcoholPrimary: v })} note={core.alcoholPrimaryNote} onNoteChange={(v) => onCoreChange({ alcoholPrimaryNote: v })} notePlaceholder="Drinks/day, duration..." />
            <CheckRow id="d1-opioid" label="Opioid" checked={core.opioidPrimary} onChange={(v) => onCoreChange({ opioidPrimary: v })} note={core.opioidPrimaryNote} onNoteChange={(v) => onCoreChange({ opioidPrimaryNote: v })} notePlaceholder="Drug, dose, route..." />
            <CheckRow id="d1-benzo" label="Benzodiazepine" checked={core.benzodiazepinePrimary} onChange={(v) => onCoreChange({ benzodiazepinePrimary: v })} note={core.benzodiazepinePrimaryNote} onNoteChange={(v) => onCoreChange({ benzodiazepinePrimaryNote: v })} notePlaceholder="Drug, dose..." />
            <CheckRow id="d1-stim" label="Stimulant" checked={core.stimulantPrimary} onChange={(v) => onCoreChange({ stimulantPrimary: v })} note={core.stimulantPrimaryNote} onNoteChange={(v) => onCoreChange({ stimulantPrimaryNote: v })} notePlaceholder="Cocaine/meth/other, route..." />
            <CheckRow id="d1-cannabis" label="Cannabis" checked={core.cannabisPrimary} onChange={(v) => onCoreChange({ cannabisPrimary: v })} note={core.cannabisPrimaryNote} onNoteChange={(v) => onCoreChange({ cannabisPrimaryNote: v })} notePlaceholder="Frequency, form..." />
          </div>
        </div>

        <div className="pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Treatment / Monitoring Needs</p>
          <CheckRow id="d1-pharm" label="Requires detox pharmacology" sublabel="CIWA protocol, buprenorphine induction, COWS protocol"
            checked={core.requiresDetoxPharmacology}
            onChange={(v) => { onCoreChange({ requiresDetoxPharmacology: v }); if (!v) setOverride("requiresDetoxPharmacology"); }}
            note={core.requiresDetoxPharmacologyNote} onNoteChange={(v) => onCoreChange({ requiresDetoxPharmacologyNote: v })} notePlaceholder="Protocol, medications..."
            autoRationale={pharmAutoActive ? pharmRationale : undefined}
            onAutoOverride={() => { setOverride("requiresDetoxPharmacology"); onCoreChange({ requiresDetoxPharmacology: false }); }}
          />
          <CheckRow id="d1-medmon" label="Requires medical monitoring" sublabel="Vitals, labs, nursing assessment"
            checked={core.requiresMedicalMonitoring}
            onChange={(v) => { onCoreChange({ requiresMedicalMonitoring: v }); if (!v) setOverride("requiresMedicalMonitoring"); }}
            note={core.requiresMedicalMonitoringNote} onNoteChange={(v) => onCoreChange({ requiresMedicalMonitoringNote: v })} notePlaceholder="Frequency, parameters..."
            autoRationale={medMonAutoActive ? medMonRationale : undefined}
            onAutoOverride={() => { setOverride("requiresMedicalMonitoring"); onCoreChange({ requiresMedicalMonitoring: false }); }}
          />
          <CheckRow id="d1-iv" label="IV fluids / vasopressor needed" checked={core.ivFluidOrPressor} onChange={(v) => onCoreChange({ ivFluidOrPressor: v })} note={core.ivFluidOrPressorsNote} onNoteChange={(v) => onCoreChange({ ivFluidOrPressorsNote: v })} notePlaceholder="Indication, current orders..." highlight />
        </div>

        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Core Comments</Label>
          <Textarea value={core.comments} onChange={(e) => onCoreChange({ comments: e.target.value })} rows={2} placeholder="Specific withdrawal presentation, last use timing, PDMP findings..." className="mt-1 text-sm resize-none" data-testid="d1-core-comments" />
        </div>
      </SectionBlock>

      <SectionBlock type="extra" title="Additional Formulation Factors" subtitle="Biopsychosocial / Treatment Targets" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Risk Amplifiers</p>
            <CheckRow id="d1e-chronic" label="Chronic heavy use / high tolerance" sublabel="Physiologic dependence, kindling risk" checked={extra.chronicHeavyUse} onChange={(v) => onExtraChange({ chronicHeavyUse: v })} note={extra.chronicHeavyUseNote} onNoteChange={(v) => onExtraChange({ chronicHeavyUseNote: v })} notePlaceholder="Duration, quantity, tolerance markers..." />
            <CheckRow id="d1e-recent" label="Last use within 24 hours" sublabel="Peak withdrawal risk window" checked={extra.lastUseRecent} onChange={(v) => onExtraChange({ lastUseRecent: v })} note={extra.lastUseRecentNote} onNoteChange={(v) => onExtraChange({ lastUseRecentNote: v })} notePlaceholder="Approx time since last use..." />
            <CheckRow id="d1e-priordetox" label="Multiple prior detox episodes" sublabel="Kindling effect, progressive severity" checked={extra.priorDetoxMultiple} onChange={(v) => onExtraChange({ priorDetoxMultiple: v })} note={extra.priorDetoxMultipleNote} onNoteChange={(v) => onExtraChange({ priorDetoxMultipleNote: v })} notePlaceholder="# episodes, settings..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Medical Vulnerabilities</p>
            <CheckRow id="d1e-neuro" label="Neurologic vulnerability" sublabel="Prior TBI, seizure disorder" checked={extra.neurologicVulnerability} onChange={(v) => onExtraChange({ neurologicVulnerability: v })} note={extra.neurologicVulnerabilityNote} onNoteChange={(v) => onExtraChange({ neurologicVulnerabilityNote: v })} notePlaceholder="Diagnosis, severity..." />
            <CheckRow id="d1e-nutr" label="Nutritional deficiency / Wernicke risk" sublabel="Thiamine supplementation indicated" checked={extra.nutritionalDeficiency} onChange={(v) => onExtraChange({ nutritionalDeficiency: v })} note={extra.nutritionalDeficiencyNote} onNoteChange={(v) => onExtraChange({ nutritionalDeficiencyNote: v })} notePlaceholder="Thiamine ordered, nutrition status..." />
          </div>
        </div>
        <div className="space-y-0.5 pt-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strengths / Modifiable</p>
          <CheckRow id="d1e-motiv" label="Motivated for medically supervised detox" checked={extra.motivatedForDetox} onChange={(v) => onExtraChange({ motivatedForDetox: v })} note={extra.motivatedForDetoxNote} onNoteChange={(v) => onExtraChange({ motivatedForDetoxNote: v })} notePlaceholder="Expressed goals..." />
          <CheckRow id="d1e-med" label="Agreed to medication-assisted treatment" checked={extra.agreedToMedication} onChange={(v) => onExtraChange({ agreedToMedication: v })} note={extra.agreedToMedicationNote} onNoteChange={(v) => onExtraChange({ agreedToMedicationNote: v })} notePlaceholder="Medication discussed, consent..." />
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Formulation Notes</Label>
          <Textarea value={extra.comments} onChange={(e) => onExtraChange({ comments: e.target.value })} rows={2} placeholder="Formulation-relevant details, predisposing factors, modifiable targets..." className="mt-1 text-sm resize-none" data-testid="d1-extra-comments" />
        </div>
      </SectionBlock>
    </div>
  );
}
