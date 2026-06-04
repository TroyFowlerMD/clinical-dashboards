import type { ToolRoute } from "../App";
import ToolCard from "./ToolCard";

interface AppDashboardProps {
  onSelect: (route: ToolRoute) => void;
}

export default function AppDashboard({ onSelect }: AppDashboardProps) {
  return (
    <>
      <header className="app-header">
        <div>
          <p className="eyebrow">Clinical calculator suite</p>
          <h1>Clinical Alcohol Calculators</h1>
          <p className="subtitle">
            Standard drink and BAL trajectory tools for clinical documentation and education.
          </p>
        </div>
      </header>

      <main className="dashboard-grid" aria-label="Available calculators">
        <ToolCard
          title="Standard Drink Calculator"
          description="Convert reported alcohol use into U.S. standard drinks."
          route="standard-drinks"
          accent="teal"
          onSelect={onSelect}
        />
        <ToolCard
          title="BAL Trajectory Calculator"
          description="Estimate BAL decline after a measured laboratory value."
          route="bal-trajectory"
          accent="amber"
          onSelect={onSelect}
        />
      </main>

      <section className="notice">
        <strong>Educational use only.</strong> Calculations support clinical documentation and education.
        Clinical assessment and measured laboratory values take priority.
      </section>
    </>
  );
}
