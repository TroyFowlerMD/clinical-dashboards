import type { ToolRoute } from "../App";

interface ToolCardProps {
  title: string;
  description: string;
  route: Exclude<ToolRoute, "dashboard">;
  accent: "teal" | "amber";
  onSelect: (route: ToolRoute) => void;
}

export default function ToolCard({
  title,
  description,
  route,
  accent,
  onSelect
}: ToolCardProps) {
  return (
    <button className="tool-card" data-accent={accent} type="button" onClick={() => onSelect(route)}>
      <span className="tool-card-mark" aria-hidden="true">
        {accent === "teal" ? "SD" : "BAL"}
      </span>
      <span className="tool-card-body">
        <span className="tool-card-title">{title}</span>
        <span className="tool-card-description">{description}</span>
      </span>
    </button>
  );
}
