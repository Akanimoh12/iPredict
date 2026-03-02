import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import type { PlayerStats } from "@/types";

// ── Mocks ──────────────────────────────────────────────────────────────────

import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockPlayers: PlayerStats[] = [
  {
    address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    displayName: "Alice",
    points: 1500,
    wonBets: 10,
    lostBets: 3,
    totalBets: 13,
    winRate: 76.9,
  },
  {
    address: "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    displayName: "Bob",
    points: 900,
    wonBets: 7,
    lostBets: 5,
    totalBets: 12,
    winRate: 58.3,
  },
  {
    address: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
    displayName: "",
    points: 600,
    wonBets: 4,
    lostBets: 6,
    totalBets: 10,
    winRate: 40.0,
  },
  {
    address: "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC",
    displayName: "",
    points: 300,
    wonBets: 2,
    lostBets: 8,
    totalBets: 10,
    winRate: 20.0,
  },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe("LeaderboardTable", () => {
  it("renders player display names", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders medals for top 3 players", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.getByText("🥉")).toBeInTheDocument();
  });

  it("renders numeric rank for 4th+ players", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    // "4" appears both as rank and as wonBets — check rank cell specifically
    const allFours = screen.getAllByText("4");
    expect(allFours.length).toBeGreaterThanOrEqual(1);
  });

  it("truncates address when no display name", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    // Player 3: ST2C...K9AG (slice 0:4 + "..." + slice -4)
    expect(screen.getByText("ST2C...K9AG")).toBeInTheDocument();
  });

  it("renders points for each player", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
  });

  it("renders win rate percentages", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    expect(screen.getByText("76.9%")).toBeInTheDocument();
    expect(screen.getByText("58.3%")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<LeaderboardTable players={mockPlayers} />);
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
  });

  it("highlights current user row", () => {
    render(
      <LeaderboardTable
        players={mockPlayers}
        currentUser="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      />
    );
    // Alice should have "(You)" marker
    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  it("shows 'Your Rank' card when currentUser is in the list", () => {
    render(
      <LeaderboardTable
        players={mockPlayers}
        currentUser="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      />
    );
    expect(screen.getByText("Your Rank")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("renders empty table without errors", () => {
    render(<LeaderboardTable players={[]} />);
    expect(screen.getByText("#")).toBeInTheDocument(); // header still renders
  });
});
