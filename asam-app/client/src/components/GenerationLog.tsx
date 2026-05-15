// Generation Log — shows past generated outputs, newest first
// Each entry auto-expires after 48h server-side; one-click delete client-side
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, FileText, HelpCircle, Trash2, ChevronDown, ChevronUp, Clock, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@shared/schema";

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatExpiry(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "expired";
  const hrs = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  if (hrs > 0) return `expires in ${hrs}h ${mins}m`;
  return `expires in ${mins}m`;
}

interface LogEntryCardProps {
  entry: LogEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function LogEntryCard({ entry, onDelete, isDeleting }: LogEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("narrative");
  const [copied, setCopied] = useState<string | null>(null);

  const hasNarrative = !!entry.chartNarrative;
  const hasP2P = !!entry.p2pScript;
  const hasClarify = !!entry.clarifyingQuestions;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const currentText =
    tab === "narrative" ? entry.chartNarrative :
    tab === "p2p" ? entry.p2pScript :
    entry.clarifyingQuestions;

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card overflow-hidden transition-all",
      expanded && "border-primary/30"
    )}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="flex items-center gap-2 flex-1 text-left min-w-0"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <span className={cn("transition-transform flex-shrink-0", expanded && "rotate-180")}>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="text-xs font-semibold truncate">
            {entry.patientDescriptor || "Unknown patient"}
          </span>
          <Badge variant="outline" className="text-[0.6rem] px-1 py-0 flex-shrink-0">
            {entry.levelOfCare}
          </Badge>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <span className="text-[0.6rem] text-muted-foreground hidden sm:flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatRelativeTime(entry.createdAt)}
          </span>
          <span className="text-[0.6rem] text-muted-foreground/60 hidden md:block">
            {formatExpiry(entry.expiresAt)}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onDelete(entry.id)}
            disabled={isDeleting}
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete log entry"
            data-testid={`btn-delete-log-${entry.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex items-center justify-between px-3 pt-2 pb-0">
              <TabsList className="bg-muted h-7">
                {hasNarrative && (
                  <TabsTrigger value="narrative" className="text-[0.65rem] h-6 gap-1 px-2">
                    <ClipboardList className="h-2.5 w-2.5" /> Narrative
                  </TabsTrigger>
                )}
                {hasP2P && (
                  <TabsTrigger value="p2p" className="text-[0.65rem] h-6 gap-1 px-2">
                    <FileText className="h-2.5 w-2.5" /> P2P
                  </TabsTrigger>
                )}
                {hasClarify && (
                  <TabsTrigger value="clarify" className="text-[0.65rem] h-6 gap-1 px-2">
                    <HelpCircle className="h-2.5 w-2.5" /> Suggestions
                  </TabsTrigger>
                )}
              </TabsList>
              <Button
                type="button" size="sm" variant="ghost"
                onClick={() => copyText(currentText, `${entry.id}-${tab}`)}
                className="h-6 text-[0.65rem] gap-1 px-2"
              >
                {copied === `${entry.id}-${tab}` ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied === `${entry.id}-${tab}` ? "Copied" : "Copy"}
              </Button>
            </div>
            <TabsContent value="narrative" className="m-0 p-3 pt-2">
              <pre className="output-prose text-[0.72rem] max-h-48 overflow-y-auto">{entry.chartNarrative}</pre>
            </TabsContent>
            <TabsContent value="p2p" className="m-0 p-3 pt-2">
              <pre className="output-prose text-[0.72rem] max-h-48 overflow-y-auto">{entry.p2pScript}</pre>
            </TabsContent>
            <TabsContent value="clarify" className="m-0 p-3 pt-2">
              <pre className="output-prose text-[0.72rem] max-h-48 overflow-y-auto">{entry.clarifyingQuestions}</pre>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export function GenerationLog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: logs = [] } = useQuery<LogEntry[]>({
    queryKey: ["/api/log"],
    refetchInterval: 60000, // refresh every minute to update relative times
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/log?id=${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/log"] }),
  });

  if (logs.length === 0) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50">
      {/* Section header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Generation Log
          </span>
          <Badge variant="secondary" className="text-[0.65rem] px-1.5 py-0">{logs.length}</Badge>
          <span className="text-[0.6rem] text-muted-foreground/60">· auto-deletes after 48h</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-3 space-y-2 max-h-[32rem] overflow-y-auto">
          {logs.map((entry) => (
            <LogEntryCard
              key={entry.id}
              entry={entry}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
