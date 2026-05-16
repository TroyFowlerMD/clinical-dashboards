import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DEFAULT_STATE, DEFAULT_CAPABILITIES } from "@/lib/defaultState";
import { generateClinicalOutput } from "@/lib/gemini";
import { generateRuleBasedOutput } from "@/lib/ruleBasedOutput";
import { buildDescriptorString, PatientDescriptorWidget } from "@/components/PatientDescriptorWidget";
import { GenerationLog } from "@/components/GenerationLog";
import type { DashboardState, GeneratedOutput, LevelOfCare, EditionLanguage, OutputType, Gender } from "@shared/schema";

import { D1Panel } from "@/components/dimensions/D1Panel";
import { D2Panel } from "@/components/dimensions/D2Panel";
import { D3Panel } from "@/components/dimensions/D3Panel";
import { D4Panel } from "@/components/dimensions/D4Panel";
import { D5Panel } from "@/components/dimensions/D5Panel";
import { D6Panel } from "@/components/dimensions/D6Panel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import {
  Loader2, Copy, CheckCheck, RotateCcw, ChevronRight,
  ClipboardList, FileText, HelpCircle, Settings, Eye, EyeOff,
  Activity, Brain, Heart, Zap, TrendingDown, Home, BarChart3, Moon, Sun,
  Cpu, BookOpen, PanelLeftClose, PanelLeftOpen, Stethoscope, Users
} from "lucide-react";

const DIM_TABS_BASE = [
  { id: "d1", label: "D1", full3rd: "Withdrawal",   full4th: "Withdrawal",    icon: <Activity className="h-3 w-3" />, color: "text-amber-500 dark:text-amber-400" },
  { id: "d2", label: "D2", full3rd: "Biomedical",   full4th: "Biomedical",    icon: <Heart className="h-3 w-3" />,    color: "text-rose-500 dark:text-rose-400" },
  { id: "d3", label: "D3", full3rd: "Psychiatric",  full4th: "Psychiatric",   icon: <Brain className="h-3 w-3" />,    color: "text-violet-500 dark:text-violet-400" },
  { id: "d4", label: "D4", full3rd: "Readiness",    full4th: "Use Risks",     icon: <Zap className="h-3 w-3" />,      color: "text-sky-500 dark:text-sky-400" },
  { id: "d5", label: "D5", full3rd: "Relapse Risk", full4th: "Rec. Env.",     icon: <TrendingDown className="h-3 w-3" />, color: "text-orange-500 dark:text-orange-400" },
  { id: "d6", label: "D6", full3rd: "Environment",  full4th: "Person-Ctr.",   icon: <Home className="h-3 w-3" />,     color: "text-emerald-500 dark:text-emerald-400" },
];

function getDimTabs(edition: string) {
  return DIM_TABS_BASE.map(t => ({ ...t, full: edition === "4th" ? t.full4th : t.full3rd }));
}

const EDITION_LABELS: Record<string, Record<string, string>> = {
  "3rd": {
    D1: "D1: Acute Intoxication / Withdrawal",
    D2: "D2: Biomedical Conditions",
    D3: "D3: Emotional / Behavioral / Cognitive",
    D4: "D4: Readiness to Change",
    D5: "D5: Relapse / Continued Use Potential",
    D6: "D6: Recovery / Living Environment",
  },
  "4th": {
    D1: "D1: Withdrawal Management",
    D2: "D2: Physical Health",
    D3: "D3: Mental Health",
    D4: "D4: Cognitive Conditions",
    D5: "D5: Readiness to Change",
    D6: "D6: Relapse / Recovery Environment",
  },
};

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>(DEFAULT_STATE);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("d1");
  const [outputTab, setOutputTab] = useState("narrative");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  // Default to DARK mode
  const [darkMode, setDarkMode] = useState(true);
  // Generation mode: "ai" = Gemini, "rules" = deterministic rule-based
  const [genMode, setGenMode] = useState<"ai" | "rules">("ai");
  // Default closed on mobile (narrow), open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Collapse sidebar by default on small screens after mount
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveLogMutation = useMutation({
    mutationFn: (body: object) => apiRequest("POST", "/api/log", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/log"] }),
  });

  // Apply dark mode class on mount and changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Auto-build patientDescriptor from age/gender/addendum
  useEffect(() => {
    const built = buildDescriptorString(
      state.config.patientAge,
      state.config.patientGender,
      state.config.patientDescriptorAddendum
    );
    setState(s => ({
      ...s,
      config: { ...s.config, patientDescriptor: built },
    }));
  }, [state.config.patientAge, state.config.patientGender, state.config.patientDescriptorAddendum]);

  const patch = useCallback(<K extends keyof DashboardState>(key: K, val: Partial<DashboardState[K]>) => {
    setState(s => ({ ...s, [key]: { ...(s[key] as object), ...val } }));
  }, []);

  const patchDim = useCallback(<K extends keyof DashboardState["dimensions"]>(
    key: K,
    val: Partial<DashboardState["dimensions"][K]>
  ) => {
    setState(s => ({
      ...s,
      dimensions: { ...s.dimensions, [key]: { ...(s.dimensions[key] as object), ...val } }
    }));
  }, []);

  const handleGenerate = async () => {
    if (!state.config.patientDescriptor) {
      toast({ title: "Patient descriptor required", description: "Set age/gender or enter clinical context above.", variant: "destructive" });
      return;
    }

    if (genMode === "rules") {
      // Synchronous rule-based path — no API needed
      setLoading(true);
      setOutput(null);
      try {
        const result = generateRuleBasedOutput({
          configuration: state.config,
          facilityCapabilities: state.capabilities,
          dimensions: state.dimensions,
        });
        setOutput(result);
        setOutputTab(state.config.outputType === "p2p" ? "p2p" : "narrative");
        toast({ title: "Documentation generated", description: "Rule-based synthesis — review and attest before use." });
        saveLogMutation.mutate({
          patientDescriptor: state.config.patientDescriptor,
          levelOfCare: state.config.levelOfCare,
          chartNarrative: result.chartNarrative ?? "",
          p2pScript: result.p2pScript ?? "",
          clarifyingQuestions: result.clarifyingQuestions ?? "",
          psychEvalNote: result.psychEvalNote ?? "",
          biopsychosocialFormulation: result.biopsychosocialFormulation ?? "",
        });
      } catch (e: any) {
        toast({ title: "Generation failed", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // AI path
    if (!state.config.geminiApiKey) {
      toast({ title: "API key required", description: "Enter your Gemini API key in the Config panel, or switch to Rules mode.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setOutput(null);
    try {
      const result = await generateClinicalOutput(
        { configuration: state.config, facilityCapabilities: state.capabilities, dimensions: state.dimensions },
        state.config.geminiApiKey
      );
      setOutput(result);
      setOutputTab(state.config.outputType === "p2p" ? "p2p" : "narrative");
      toast({ title: "Documentation generated", description: "AI synthesis complete. Review output below." });
      saveLogMutation.mutate({
        patientDescriptor: state.config.patientDescriptor,
        levelOfCare: state.config.levelOfCare,
        chartNarrative: result.chartNarrative ?? "",
        p2pScript: result.p2pScript ?? "",
        clarifyingQuestions: result.clarifyingQuestions ?? "",
        psychEvalNote: result.psychEvalNote ?? "",
        biopsychosocialFormulation: result.biopsychosocialFormulation ?? "",
      });
    } catch (e: any) {
      // Auto-fallback to rules mode on API failure
      toast({
        title: "AI generation failed",
        description: `${e.message} — falling back to rule-based output.`,
        variant: "destructive",
      });
      try {
        const fallback = generateRuleBasedOutput({
          configuration: state.config,
          facilityCapabilities: state.capabilities,
          dimensions: state.dimensions,
        });
        setOutput(fallback);
        setOutputTab(state.config.outputType === "p2p" ? "p2p" : "narrative");
        toast({ title: "Rule-based fallback used", description: "AI unavailable. Output generated from form data rules. Review before use." });
        saveLogMutation.mutate({
          patientDescriptor: state.config.patientDescriptor,
          levelOfCare: state.config.levelOfCare,
          chartNarrative: fallback.chartNarrative ?? "",
          p2pScript: fallback.p2pScript ?? "",
          clarifyingQuestions: fallback.clarifyingQuestions ?? "",
          psychEvalNote: fallback.psychEvalNote ?? "",
          biopsychosocialFormulation: fallback.biopsychosocialFormulation ?? "",
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const [confirmReset, setConfirmReset] = useState(false);

  const resetForm = () => {
    if (confirmReset) {
      setState({ ...DEFAULT_STATE, config: { ...DEFAULT_STATE.config, geminiApiKey: state.config.geminiApiKey } });
      setOutput(null);
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      // Auto-cancel confirm state after 3s if user doesn't click again
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const labels = EDITION_LABELS[state.config.editionLanguage === "4th" ? "4th" : "3rd"];
  const DIM_TABS = getDimTabs(state.config.editionLanguage);

  const coreRatings = [
    state.dimensions.d1Core.riskRating, state.dimensions.d2Core.riskRating,
    state.dimensions.d3Core.riskRating, state.dimensions.d4Core.riskRating,
    state.dimensions.d5Core.riskRating, state.dimensions.d6Core.riskRating,
  ];
  const avgRisk = coreRatings.reduce((a, b) => a + b, 0) / 6;

  return (
    <div className={`dashboard-layout${sidebarOpen ? " sidebar-open" : " sidebar-collapsed"}`}>
      {/* ── HEADER ── */}
      <header className="dashboard-header bg-card border-b border-border flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button" size="icon" variant="ghost"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            data-testid="btn-sidebar-toggle"
            className="h-8 w-8 flex-shrink-0"
            title={sidebarOpen ? "Collapse config panel" : "Expand config panel"}
          >
            {sidebarOpen
              ? <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          <svg aria-label="ASAM Dashboard" viewBox="0 0 32 32" fill="none" className="h-6 w-6 flex-shrink-0">
            <rect width="32" height="32" rx="7" fill="hsl(var(--primary))" />
            <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 19h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">ASAM Clinical Dashboard</h1>
            <p className="text-[0.65rem] text-muted-foreground leading-tight hidden sm:block">ASAM 3rd Ed · NC Medicaid · Level 3.7 / 3.5</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            LOC: {state.config.levelOfCare === "both" ? "3.7 → 3.5" : state.config.levelOfCare}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {state.config.editionLanguage.toUpperCase()} Ed
          </Badge>
          {state.config.ncMedicaid && (
            <Badge className="text-xs bg-primary/90 text-primary-foreground hover:bg-primary/90">NC Medicaid</Badge>
          )}
          {avgRisk > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <BarChart3 className="h-2.5 w-2.5" />
              Avg: {avgRisk.toFixed(1)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button" size="sm"
            variant={confirmReset ? "destructive" : "ghost"}
            onClick={resetForm}
            className="h-8 text-xs gap-1 hidden sm:flex transition-colors"
            data-testid="btn-reset"
          >
            <RotateCcw className="h-3 w-3" />
            {confirmReset ? "Confirm reset?" : "Reset"}
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode" data-testid="btn-theme" className="h-8 w-8">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {/* Mode toggle — compact pill in header */}
          <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0.5" title="Generation mode">
            <button
              type="button"
              onClick={() => setGenMode("ai")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                genMode === "ai"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mode-ai"
            >
              <Cpu className="h-3 w-3" />
              AI
            </button>
            <button
              type="button"
              onClick={() => setGenMode("rules")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                genMode === "rules"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mode-rules"
            >
              <BookOpen className="h-3 w-3" />
              Rules
            </button>
          </div>
          <Button type="button" size="sm" onClick={handleGenerate} disabled={loading} data-testid="btn-generate" className="h-8 text-xs gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
            {loading ? "Generating…" : "Generate"}
          </Button>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      {/* Backdrop — tapping closes sidebar on mobile */}
      <div
        className="dashboard-sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className="dashboard-sidebar bg-card p-3 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Configuration</span>
          </div>

          {/* PHI warning */}
          <div className="phi-banner mb-3">
            ⚠ No PHI: Use de-identified descriptors only. No names, DOB, MRN, or full dates.
          </div>

          {/* Patient descriptor widget */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Patient Descriptor *</Label>
            <PatientDescriptorWidget
              age={state.config.patientAge}
              gender={state.config.patientGender}
              addendum={state.config.patientDescriptorAddendum}
              onAgeChange={(v) => patch("config", { patientAge: v })}
              onGenderChange={(v) => patch("config", { patientGender: v as Gender })}
              onAddendumChange={(v) => patch("config", { patientDescriptorAddendum: v })}
            />
            {state.config.patientDescriptor && (
              <p className="text-[0.65rem] text-muted-foreground mt-1.5 italic leading-snug">
                → {state.config.patientDescriptor}
              </p>
            )}
          </div>

          {/* Level of care */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Level of Care Focus</Label>
            <RadioGroup value={state.config.levelOfCare} onValueChange={(v) => patch("config", { levelOfCare: v as LevelOfCare })} className="space-y-1" data-testid="radio-loc">
              <div className="flex items-center gap-2"><RadioGroupItem value="3.7" id="loc-37" /><label htmlFor="loc-37" className="text-xs cursor-pointer">3.7 — Medically Monitored Inpatient</label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="3.5" id="loc-35" /><label htmlFor="loc-35" className="text-xs cursor-pointer">3.5 — Clinically Managed Residential</label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="both" id="loc-both" /><label htmlFor="loc-both" className="text-xs cursor-pointer">Both (3.7 → 3.5 step-down)</label></div>
            </RadioGroup>
          </div>

          {/* ASAM Edition */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground mb-1.5 block">ASAM Edition Language</Label>
            <RadioGroup value={state.config.editionLanguage} onValueChange={(v) => patch("config", { editionLanguage: v as EditionLanguage })} className="space-y-1" data-testid="radio-edition">
              <div className="flex items-center gap-2"><RadioGroupItem value="3rd" id="ed-3" /><label htmlFor="ed-3" className="text-xs cursor-pointer">3rd Ed <span className="text-muted-foreground">(NC Medicaid default)</span></label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="4th" id="ed-4" /><label htmlFor="ed-4" className="text-xs cursor-pointer">4th Ed</label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="hybrid" id="ed-h" /><label htmlFor="ed-h" className="text-xs cursor-pointer">Hybrid</label></div>
            </RadioGroup>
          </div>

          {/* Output type */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Output Type</Label>
            <RadioGroup value={state.config.outputType} onValueChange={(v) => patch("config", { outputType: v as OutputType })} className="space-y-1" data-testid="radio-output">
              <div className="flex items-center gap-2"><RadioGroupItem value="both" id="out-both" /><label htmlFor="out-both" className="text-xs cursor-pointer">Both (Narrative + P2P)</label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="narrative" id="out-narr" /><label htmlFor="out-narr" className="text-xs cursor-pointer">Chart Narrative only</label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="p2p" id="out-p2p" /><label htmlFor="out-p2p" className="text-xs cursor-pointer">Peer-to-Peer Script only</label></div>
            </RadioGroup>
          </div>

          {/* NC Medicaid toggle */}
          <div className="flex items-center gap-2 mb-3 p-2 rounded bg-primary/8 dark:bg-primary/10 border border-primary/20">
            <Checkbox id="nc-medicaid" checked={state.config.ncMedicaid} onCheckedChange={(v) => patch("config", { ncMedicaid: !!v })} data-testid="check-nc-medicaid" />
            <label htmlFor="nc-medicaid" className="text-xs font-semibold cursor-pointer">
              NC Medicaid / Tailored Plan case
              <span className="block text-muted-foreground font-normal">Applies CCP 8D-4/8D-5 standards</span>
            </label>
          </div>

          {/* NC Medicaid checklist */}
          {state.config.ncMedicaid && (
            <div className="text-xs space-y-0.5 p-2 rounded bg-muted/50 mb-3">
              <p className="font-semibold text-muted-foreground mb-1">NC UM Documentation Checklist:</p>
              {[
                "Presenting problem & dx summary",
                "ASAM dimensional risk ratings",
                "Functional impairment / ADLs",
                "Safety risk profile",
                "Prior treatment history",
                "Level-of-care determination",
                "Person-centered plan elements",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gemini API Key */}
          <div className="mb-2">
            <Label className="text-xs text-muted-foreground mb-1 block">Gemini API Key *</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={state.config.geminiApiKey}
                onChange={(e) => patch("config", { geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="api-key-field h-8 text-xs pr-8"
                data-testid="input-api-key"
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Free key at{" "}
              <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">aistudio.google.com</a>
            </p>
          </div>
        </div>

        {/* Facility capabilities */}
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
            Facility Capabilities
          </summary>
          <div className="mt-2 space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Level 3.7 Description</Label>
              <Textarea value={state.capabilities.level37} onChange={(e) => patch("capabilities", { level37: e.target.value })} rows={4} className="text-xs resize-none mt-1" data-testid="textarea-37-cap" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Level 3.5 Description</Label>
              <Textarea value={state.capabilities.level35} onChange={(e) => patch("capabilities", { level35: e.target.value })} rows={4} className="text-xs resize-none mt-1" data-testid="textarea-35-cap" />
            </div>
          </div>
        </details>

        <PerplexityAttribution />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="dashboard-main bg-background">
        <div className="p-4 space-y-4 max-w-5xl mx-auto">

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">ASAM Dimensions</h2>
              {state.config.editionLanguage === "4th" && (
                <Badge variant="outline" className="text-xs">4th Ed labels active</Badge>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="dim-tabs">
              <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-background border-b border-border/60 mb-3">
              <TabsList className="grid grid-cols-6 h-auto gap-1 bg-muted p-1">
                {DIM_TABS.map((t) => {
                  const ratingKey = `${t.id}Core` as keyof typeof state.dimensions;
                  const rating = (state.dimensions[ratingKey] as any)?.riskRating ?? 0;
                  return (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      data-testid={`tab-${t.id}`}
                      className="flex flex-col items-center gap-0.5 py-1.5 px-1 text-center h-auto min-h-10"
                    >
                      <div className="flex items-center gap-1">
                        <span className={t.color}>{t.icon}</span>
                        <span className="font-bold text-xs">{t.label}</span>
                        {rating > 0 && (
                          <span className={`text-[0.6rem] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none
                            ${rating >= 3 ? "bg-red-500 text-white" : rating >= 2 ? "bg-orange-400 text-white" : "bg-yellow-400 text-black"}`}>
                            {rating}
                          </span>
                        )}
                      </div>
                      <span className="text-[0.6rem] leading-tight hidden lg:block text-muted-foreground">{t.full}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              </div>

              <div className="text-xs text-muted-foreground mb-2 px-0.5">
                {labels[`D${activeTab.slice(1)}`]}
              </div>

              <TabsContent value="d1" className="mt-0">
                <D1Panel core={state.dimensions.d1Core} extra={state.dimensions.d1Extra} onCoreChange={(p) => patchDim("d1Core", p)} onExtraChange={(p) => patchDim("d1Extra", p)} />
              </TabsContent>
              <TabsContent value="d2" className="mt-0">
                <D2Panel core={state.dimensions.d2Core} extra={state.dimensions.d2Extra} onCoreChange={(p) => patchDim("d2Core", p)} onExtraChange={(p) => patchDim("d2Extra", p)} />
              </TabsContent>
              <TabsContent value="d3" className="mt-0">
                <D3Panel core={state.dimensions.d3Core} extra={state.dimensions.d3Extra} onCoreChange={(p) => patchDim("d3Core", p)} onExtraChange={(p) => patchDim("d3Extra", p)} />
              </TabsContent>
              <TabsContent value="d4" className="mt-0">
                <D4Panel core={state.dimensions.d4Core} extra={state.dimensions.d4Extra} onCoreChange={(p) => patchDim("d4Core", p)} onExtraChange={(p) => patchDim("d4Extra", p)} edition={state.config.editionLanguage} />
              </TabsContent>
              <TabsContent value="d5" className="mt-0">
                <D5Panel core={state.dimensions.d5Core} extra={state.dimensions.d5Extra} onCoreChange={(p) => patchDim("d5Core", p)} onExtraChange={(p) => patchDim("d5Extra", p)} edition={state.config.editionLanguage} />
              </TabsContent>
              <TabsContent value="d6" className="mt-0">
                <D6Panel core={state.dimensions.d6Core} extra={state.dimensions.d6Extra} onCoreChange={(p) => patchDim("d6Core", p)} onExtraChange={(p) => patchDim("d6Extra", p)} edition={state.config.editionLanguage} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Generate button + mode toggle */}
          <div className="flex items-center justify-between gap-3">
            {/* Mode toggle — larger version at bottom */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">Generation mode</span>
              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setGenMode("ai")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    genMode === "ai"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="mode-ai-bottom"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>AI (Gemini)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGenMode("rules")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    genMode === "rules"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="mode-rules-bottom"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Rule-Based</span>
                </button>
              </div>
              {genMode === "rules" && (
                <p className="text-xs text-muted-foreground max-w-xs">Deterministic output from form data — no API required. Works offline. Review before use.</p>
              )}
              {genMode === "ai" && (
                <p className="text-xs text-muted-foreground max-w-xs">Gemini synthesizes the form data into polished clinical prose. Falls back to rules if unavailable.</p>
              )}
            </div>
            <Button type="button" onClick={handleGenerate} disabled={loading} data-testid="btn-generate-bottom" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              {loading ? "Generating documentation…" : "Generate Clinical Documentation"}
            </Button>
          </div>

          {/* Generation Log */}
          <GenerationLog />

          {/* Output panel */}
          {(output || loading) && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">Generated Output</h2>
                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${
                    genMode === "rules"
                      ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
                      : "bg-primary/20 text-primary border border-primary/30"
                  }`}>
                    {genMode === "rules" ? <><BookOpen className="h-2.5 w-2.5" /> Rule-based</> : <><Cpu className="h-2.5 w-2.5" /> AI</>}
                  </span>
                </div>
                <div className="flex gap-1">
                  {output && (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => copyText(
                        outputTab === "narrative" ? output.chartNarrative :
                        outputTab === "p2p" ? output.p2pScript :
                        outputTab === "psycheval" ? output.psychEvalNote :
                        outputTab === "biopsych" ? output.biopsychosocialFormulation :
                        output.clarifyingQuestions, `copy-${outputTab}`
                      )}
                      className="h-7 text-xs gap-1"
                      data-testid="btn-copy"
                    >
                      {copied === `copy-${outputTab}` ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === `copy-${outputTab}` ? "Copied!" : "Copy"}
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="p-8 flex items-center justify-center gap-3 bg-card">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">{genMode === "ai" ? "Generating via Gemini AI…" : "Synthesizing from form data…"}</span>
                </div>
              ) : output && (
                <Tabs value={outputTab} onValueChange={setOutputTab} className="bg-card">
                  <TabsList className="bg-muted m-2 mb-0">
                    {(state.config.outputType === "both" || state.config.outputType === "narrative") && (
                      <TabsTrigger value="narrative" data-testid="output-tab-narrative" className="text-xs gap-1">
                        <ClipboardList className="h-3 w-3" /> Chart Narrative
                      </TabsTrigger>
                    )}
                    {(state.config.outputType === "both" || state.config.outputType === "p2p") && (
                      <TabsTrigger value="p2p" data-testid="output-tab-p2p" className="text-xs gap-1">
                        <FileText className="h-3 w-3" /> P2P Script
                      </TabsTrigger>
                    )}
                    {output.clarifyingQuestions && (
                      <TabsTrigger value="clarify" data-testid="output-tab-clarify" className="text-xs gap-1">
                        <HelpCircle className="h-3 w-3" /> Suggestions
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="psycheval" data-testid="output-tab-psycheval" className="text-xs gap-1">
                      <Stethoscope className="h-3 w-3" /> Psych Eval Note
                    </TabsTrigger>
                    <TabsTrigger value="biopsych" data-testid="output-tab-biopsych" className="text-xs gap-1">
                      <Users className="h-3 w-3" /> Biopsychosocial
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="narrative" className="m-0 p-4">
                    <pre className="output-prose">{output.chartNarrative || "No chart narrative generated. Check output type setting."}</pre>
                  </TabsContent>
                  <TabsContent value="p2p" className="m-0 p-4">
                    <pre className="output-prose">{output.p2pScript || "No P2P script generated. Check output type setting."}</pre>
                  </TabsContent>
                  <TabsContent value="clarify" className="m-0 p-4">
                    <pre className="output-prose">{output.clarifyingQuestions}</pre>
                  </TabsContent>
                  <TabsContent value="psycheval" className="m-0 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Psych Eval Note</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">Clinical Note Draft</span>
                    </div>
                    <pre className="output-prose">{output.psychEvalNote || "Generating psych eval note..."}</pre>
                  </TabsContent>
                  <TabsContent value="biopsych" className="m-0 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Biopsychosocial Formulation</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20 font-medium">Case Formulation</span>
                    </div>
                    <pre className="output-prose">{output.biopsychosocialFormulation || "Generating biopsychosocial formulation..."}</pre>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
