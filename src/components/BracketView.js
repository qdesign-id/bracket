"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MatchBox from "./MatchBox";
import { getRoundPlan, groupMatchesByRound, getTeamById } from "@/lib/bracketLogic";
import styles from "./BracketView.module.css";

export default function BracketView({ teams, matches, isAdmin, onSetWinner }) {
  const containerRef = useRef(null);
  const boxRefs = useRef({});
  const [paths, setPaths] = useState([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const rounds = useMemo(() => groupMatchesByRound(matches), [matches]);
  const roundPlan = useMemo(() => getRoundPlan(teams.length || 8), [teams.length]);

  useEffect(() => {
    function recompute() {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const nextPaths = [];

      matches.forEach((m) => {
        if (!m.next_match_id) return;
        const fromEl = boxRefs.current[m.id];
        const toEl = boxRefs.current[m.next_match_id];
        if (!fromEl || !toEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const x1 = fromRect.right - containerRect.left + container.scrollLeft;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top + container.scrollTop;
        const x2 = toRect.left - containerRect.left + container.scrollLeft;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top + container.scrollTop;
        const midX = x1 + (x2 - x1) / 2;

        nextPaths.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
      });

      setPaths(nextPaths);
      setSvgSize({ width: container.scrollWidth, height: container.scrollHeight });
    }

    recompute();
    const raf = requestAnimationFrame(recompute);
    window.addEventListener("resize", recompute);

    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recompute);
      ro.disconnect();
    };
  }, [matches, rounds]);

  return (
    <div className={styles.bracketContainer} ref={containerRef}>
      <svg
        className={styles.connectorSvg}
        width={svgSize.width}
        height={svgSize.height}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} className={styles.connectorPath} />
        ))}
      </svg>

      <div className={styles.roundsRow}>
        {rounds.map(({ round, matches: roundMatches }) => {
          const plan = roundPlan.find((p) => p.round === round);
          return (
            <div className={styles.round} key={round}>
              <div className={styles.roundLabel}>{plan?.label}</div>
              <div className={styles.roundMatches}>
                {roundMatches.map((m) => (
                  <div
                    key={m.id}
                    ref={(el) => {
                      boxRefs.current[m.id] = el;
                    }}
                    className={styles.matchSlot}
                  >
                    <MatchBox
                      match={m}
                      team1={getTeamById(teams, m.team1_id)}
                      team2={getTeamById(teams, m.team2_id)}
                      isAdmin={isAdmin}
                      onSetWinner={onSetWinner}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
