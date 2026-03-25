import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlayerId } from "server/types";
import { describe, expect, it, vi } from "vitest";
import { Game } from "./game";

// Mock the tRPC hooks and React Query
vi.mock("../../../lib/trpc", () => ({
  useTRPC: () => ({
    user: {
      whoami: {
        queryOptions: () => ({ queryKey: ["whoami"] }),
      },
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: { user: { id: "player-1" } } }),
}));

describe("Game Component", () => {
  it("renders waiting message when it is not the current players turn", () => {
    render(
      <Game
        onSubmit={vi.fn()}
        onSurrender={vi.fn()}
        currentPlayerId={"player-2" as PlayerId}
      />
    );
    expect(screen.getByText(/waiting for other player/i)).toBeInTheDocument();
  });

  it("renders the form when it is the current players turn", () => {
    render(
      <Game
        onSubmit={vi.fn()}
        onSurrender={vi.fn()}
        currentPlayerId={"player-1" as PlayerId}
      />
    );
    expect(
      screen.getByRole("button", { name: /make move/i })
    ).toBeInTheDocument();
  });

  it("renders the surrender button", () => {
    render(
      <Game
        onSubmit={vi.fn()}
        onSurrender={vi.fn()}
        currentPlayerId={"player-1" as PlayerId}
      />
    );
    expect(
      screen.getByRole("button", { name: /surrender/i })
    ).toBeInTheDocument();
  });

  it("calls onSurrender when the surrender button is clicked", async () => {
    const onSurrender = vi.fn();
    render(
      <Game
        onSubmit={vi.fn()}
        onSurrender={onSurrender}
        currentPlayerId={"player-1" as PlayerId}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /surrender/i }));
    expect(onSurrender).toHaveBeenCalledOnce();
  });
});

