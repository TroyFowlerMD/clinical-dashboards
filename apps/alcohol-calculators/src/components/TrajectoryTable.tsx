import { BAL_PROFILES } from "../calculators/balTrajectory";
import type { BalTrajectoryRow } from "../types";
import { formatClockTime, formatHours } from "../utils/time";

interface TrajectoryTableProps {
  rows: BalTrajectoryRow[];
}

export default function TrajectoryTable({ rows }: TrajectoryTableProps) {
  return (
    <div className="table-scroller">
      <table className="trajectory-table">
        <thead>
          <tr>
            <th rowSpan={2}>Target BAL</th>
            <th colSpan={3}>Hours from draw</th>
            <th colSpan={3}>Estimated clock time</th>
            <th colSpan={3}>Remaining hours</th>
          </tr>
          <tr>
            {[...BAL_PROFILES, ...BAL_PROFILES, ...BAL_PROFILES].map((profile, index) => (
              <th key={`${profile}-${index}`}>{profile}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.targetMgDl}>
              <th>{row.targetMgDl} mg/dL</th>
              {BAL_PROFILES.map((profile) => (
                <td key={`hours-${profile}`}>{formatHours(row.hoursFromDraw[profile])}</td>
              ))}
              {BAL_PROFILES.map((profile) => (
                <td key={`clock-${profile}`}>{formatClockTime(row.clockTime[profile])}</td>
              ))}
              {BAL_PROFILES.map((profile) => (
                <td key={`remaining-${profile}`}>{formatHours(row.remainingHours[profile])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
