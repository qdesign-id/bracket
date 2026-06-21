"use client";

import styles from "./MatchBox.module.css";

export default function MatchBox({ match, team1, team2, isAdmin, onSetWinner }) {
  const winnerId = match.winner_id;

  function renderRow(team) {
    const isWinner = Boolean(winnerId && team && winnerId === team.id);
    const isLoser = Boolean(winnerId && team && winnerId !== team.id);
    const empty = !team;
    const canClick = isAdmin && team && typeof onSetWinner === "function";

    const classNames = [
      styles.row,
      isWinner ? styles.winner : "",
      isLoser ? styles.loser : "",
      empty ? styles.empty : "",
      canClick ? styles.clickable : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        disabled={!canClick}
        onClick={() => canClick && onSetWinner(match, team)}
        className={classNames}
        title={canClick ? `Tandai ${team.name} sebagai pemenang` : undefined}
      >
        <span className={styles.logo}>
          {team?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo_url} alt="" className={styles.logoImg} />
          ) : null}
        </span>
        <span className={styles.name}>{team ? team.name : "TBD"}</span>
      </button>
    );
  }

  return (
    <div className={styles.box}>
      {renderRow(team1)}
      {renderRow(team2)}
    </div>
  );
}
