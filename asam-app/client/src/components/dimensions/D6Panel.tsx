// D6: Recovery / Living Environment (3rd/hybrid) / Person-Centered Considerations (4th)
import { useMemo, useState } from "react";
import { RiskSlider } from "@/components/RiskSlider";
import { CheckRow } from "@/components/CheckRow";
import { SectionBlock } from "@/components/SectionBlock";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { computeD6Suggestion } from "@/lib/riskSuggestions";
import { cn } from "@/lib/utils";
import type { D6Core, D6Extra, RiskRating } from "@shared/schema";

interface D6PanelProps {
  core: D6Core; extra: D6Extra;
  onCoreChange: (patch: Partial<D6Core>) => void;
  onExtraChange: (patch: Partial<D6Extra>) => void;
  edition?: "3rd" | "4th" | "hybrid";
}

export function D6Panel({ core, extra, onCoreChange, onExtraChange, edition = "3rd" }: D6PanelProps) {
  const is4th = edition === "4th";
  const panelHeader = is4th ? "Person-Centered Considerations" : "Recovery / Living Environment";
  const panelSubtitle = is4th ? "Patient preferences, barriers to care, motivational enhancement" : "Recovery Environment / SDOH";
  const [userOverrode, setUserOverrode] = useState(false);

  const suggestion = useMemo(() => computeD6Suggestion(core), [
    core.homelessOrUnstableHousing, core.livesWithActiveSubstanceUsers, core.lacksFamilyOrSocialSupport,
    core.unsafeOrAbusiveHomeEnvironment, core.unemployedOrFinancialInstability, core.legalIssuesPending,
    core.childProtectiveServicesInvolved, core.transportationBarrier, core.noAftercarePlanInPlace,
    core.priorDischargeAMAOrExpelled,
  ]);

  return (
    <div className="space-y-3">
      {is4th && (
        <div className="flex gap-2 rounded-lg border border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-700 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-sky-700 dark:text-sky-300 leading-snug">
            <span className="font-semibold">4th Edition: {panelHeader}</span> — Patient preferences, values, cultural considerations, barriers to care, and individualized motivational enhancement strategies.
          </p>
        </div>
      )}
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

      <SectionBlock type="core" title={panelHeader} subtitle={panelSubtitle}>
        <div className="pb-2">
          <RiskSlider label="D6 Risk Rating" value={core.riskRating} onChange={(v) => onCoreChange({ riskRating: v as RiskRating })} onOverrideChange={setUserOverrode} suggested={suggestion.suggested} rationale={suggestion.rationale} userOverrode={userOverrode} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Housing / Environment</p>
            <CheckRow id="d6-homeless" label="Homeless or unstable housing" sublabel="Cannot guarantee safe discharge environment" checked={core.homelessOrUnstableHousing} onChange={(v) => onCoreChange({ homelessOrUnstableHousing: v })} note={core.homelessOrUnstableHousingNote} onNoteChange={(v) => onCoreChange({ homelessOrUnstableHousingNote: v })} notePlaceholder="Current situation, shelter, plan..." highlight />
            <CheckRow id="d6-users" label="Lives with active substance users" checked={core.livesWithActiveSubstanceUsers} onChange={(v) => onCoreChange({ livesWithActiveSubstanceUsers: v })} note={core.livesWithActiveSubstanceUsersNote} onNoteChange={(v) => onCoreChange({ livesWithActiveSubstanceUsersNote: v })} notePlaceholder="Who, housing plan..." highlight />
            <CheckRow id="d6-nosupport" label="Lacks family or social support" checked={core.lacksFamilyOrSocialSupport} onChange={(v) => onCoreChange({ lacksFamilyOrSocialSupport: v })} note={core.lacksFamilyOrSocialSupportNote} onNoteChange={(v) => onCoreChange({ lacksFamilyOrSocialSupportNote: v })} notePlaceholder="Support system status..." />
            <CheckRow id="d6-unsafe" label="Unsafe or abusive home environment" checked={core.unsafeOrAbusiveHomeEnvironment} onChange={(v) => onCoreChange({ unsafeOrAbusiveHomeEnvironment: v })} note={core.unsafeOrAbusiveHomeEnvironmentNote} onNoteChange={(v) => onCoreChange({ unsafeOrAbusiveHomeEnvironmentNote: v })} notePlaceholder="Nature, safety plan, APS/DV referral..." highlight />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Social Determinants (SDOH)</p>
            <CheckRow id="d6-unemp" label="Unemployed / financial instability" checked={core.unemployedOrFinancialInstability} onChange={(v) => onCoreChange({ unemployedOrFinancialInstability: v })} note={core.unemployedOrFinancialInstabilityNote} onNoteChange={(v) => onCoreChange({ unemployedOrFinancialInstabilityNote: v })} notePlaceholder="Duration, benefits, plan..." />
            <CheckRow id="d6-legal" label="Pending legal issues" sublabel="Criminal charges, probation, parole" checked={core.legalIssuesPending} onChange={(v) => onCoreChange({ legalIssuesPending: v })} note={core.legalIssuesPendingNote} onNoteChange={(v) => onCoreChange({ legalIssuesPendingNote: v })} notePlaceholder="Charges, court dates, PO..." />
            <CheckRow id="d6-cps" label="CPS involvement (children)" checked={core.childProtectiveServicesInvolved} onChange={(v) => onCoreChange({ childProtectiveServicesInvolved: v })} note={core.childProtectiveServicesInvolvedNote} onNoteChange={(v) => onCoreChange({ childProtectiveServicesInvolvedNote: v })} notePlaceholder="Case status, custody, plan..." />
            <CheckRow id="d6-trans" label="Transportation barrier" sublabel="Cannot access outpatient aftercare" checked={core.transportationBarrier} onChange={(v) => onCoreChange({ transportationBarrier: v })} note={core.transportationBarrierNote} onNoteChange={(v) => onCoreChange({ transportationBarrierNote: v })} notePlaceholder="Distance, options explored..." />
          </div>
        </div>

        <div className="pt-1 space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Aftercare / Discharge Risk</p>
          <CheckRow id="d6-noplan" label="No aftercare plan in place" sublabel="No scheduled follow-up or step-down identified" checked={core.noAftercarePlanInPlace} onChange={(v) => onCoreChange({ noAftercarePlanInPlace: v })} note={core.noAftercarePlanInPlaceNote} onNoteChange={(v) => onCoreChange({ noAftercarePlanInPlaceNote: v })} notePlaceholder="Barriers to planning, referrals attempted..." />
          <CheckRow id="d6-ama" label="Prior AMA discharge or expulsion from treatment" checked={core.priorDischargeAMAOrExpelled} onChange={(v) => onCoreChange({ priorDischargeAMAOrExpelled: v })} note={core.priorDischargeAMAOrExpelledNote} onNoteChange={(v) => onCoreChange({ priorDischargeAMAOrExpelledNote: v })} notePlaceholder="Context, precipitants..." />
        </div>

        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Core Comments</Label>
          <Textarea value={core.comments} onChange={(e) => onCoreChange({ comments: e.target.value })} rows={2} placeholder="Housing plan, aftercare referrals, support system details..." className="mt-1 text-sm resize-none" data-testid="d6-core-comments" />
        </div>
      </SectionBlock>

      <SectionBlock type="extra" title="Additional Formulation Factors" subtitle="Community / Protective Factors" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">System Barriers</p>
            <CheckRow id="d6e-peer" label="Peer support / sponsor present" checked={extra.peerSupportOrSponsorPresent} onChange={(v) => onExtraChange({ peerSupportOrSponsorPresent: v })} note={extra.peerSupportOrSponsorPresentNote} onNoteChange={(v) => onExtraChange({ peerSupportOrSponsorPresentNote: v })} notePlaceholder="12-step, recovery coach..." />
            <CheckRow id="d6e-fam" label="Family system engaged in treatment" sublabel="Family therapy, psychoeducation participation" checked={extra.familySystemEngagedInTreatment} onChange={(v) => onExtraChange({ familySystemEngagedInTreatment: v })} note={extra.familySystemEngagedInTreatmentNote} onNoteChange={(v) => onExtraChange({ familySystemEngagedInTreatmentNote: v })} notePlaceholder="Who involved, frequency..." />
            <CheckRow id="d6e-ins" label="Insurance / benefit barrier" sublabel="Medicaid pending, no coverage for step-down" checked={extra.insuranceOrBenefitBarrier} onChange={(v) => onExtraChange({ insuranceOrBenefitBarrier: v })} note={extra.insuranceOrBenefitBarrierNote} onNoteChange={(v) => onExtraChange({ insuranceOrBenefitBarrierNote: v })} notePlaceholder="Coverage gap, pending apps..." />
            <CheckRow id="d6e-cult" label="Cultural / minority stressor" sublabel="Stigma, discrimination, immigration status" checked={extra.culturalOrMinorityStressor} onChange={(v) => onExtraChange({ culturalOrMinorityStressor: v })} note={extra.culturalOrMinorityStressorNote} onNoteChange={(v) => onExtraChange({ culturalOrMinorityStressorNote: v })} notePlaceholder="Specific stressor, impact..." />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Protective / Strengths</p>
            <CheckRow id="d6e-sober" label="Sober support network available" checked={extra.sober_supportNetwork} onChange={(v) => onExtraChange({ sober_supportNetwork: v })} note={extra.sober_supportNetworkNote} onNoteChange={(v) => onExtraChange({ sober_supportNetworkNote: v })} notePlaceholder="Who, how accessible..." />
            <CheckRow id="d6e-stable" label="Stable housing anticipated at discharge" sublabel="Anticipated — not current" checked={extra.stableHousingAtDischarge} onChange={(v) => onExtraChange({ stableHousingAtDischarge: v })} note={extra.stableHousingAtDischargeNote} onNoteChange={(v) => onExtraChange({ stableHousingAtDischargeNote: v })} notePlaceholder="Option, timeline, contingencies..." />
            <CheckRow id="d6e-emp" label="Employer supportive of treatment" checked={extra.employerSupportive} onChange={(v) => onExtraChange({ employerSupportive: v })} note={extra.employerSupportiveNote} onNoteChange={(v) => onExtraChange({ employerSupportiveNote: v })} notePlaceholder="FMLA status, EAP..." />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Additional Formulation Notes</Label>
          <Textarea value={extra.comments} onChange={(e) => onExtraChange({ comments: e.target.value })} rows={2} placeholder="Recovery capital assessment, community resources, discharge barriers..." className="mt-1 text-sm resize-none" data-testid="d6-extra-comments" />
        </div>
      </SectionBlock>
    </div>
  );
}
