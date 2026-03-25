"use client";

import { useMutation } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "../../../lib/trpc";

type MatchmakingState = "idle" | "searching" | "matched";

export default function LeaderBoard() {
  const trpc = useTRPC();
  const router = useRouter();

  const [invitedPlayerId, setInvitedPlayerId] = useState<string>("");
  const [joinGameId, setJoinGameId] = useState<string>("");
  const [matchmakingState, setMatchmakingState] =
    useState<MatchmakingState>("idle");

  const createGameMutation = useMutation(
    trpc.game.createGame.mutationOptions()
  );

  const joinGameMutation = useMutation(trpc.game.joinGame.mutationOptions());

  const findMatchMutation = useMutation(
    trpc.game.findMatch.mutationOptions()
  );

  const cancelMatchMutation = useMutation(
    trpc.game.cancelMatch.mutationOptions()
  );

  // Subscribe to match-found events while searching
  useSubscription(
    trpc.game.onMatchFound.subscriptionOptions(undefined, {
      enabled: matchmakingState === "searching",
      onData: (data) => {
        setMatchmakingState("matched");
        router.push(`/game/${data.gameId}`);
      },
      onError: (err) => {
        console.error("Match subscription error:", err);
        setMatchmakingState("idle");
      },
    })
  );

  const handleFindMatch = () => {
    findMatchMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.status === "matched" && data.gameId) {
          setMatchmakingState("matched");
          router.push(`/game/${data.gameId}`);
        } else {
          setMatchmakingState("searching");
        }
      },
      onError: (err) => {
        console.error("Find match error:", err);
        setMatchmakingState("idle");
      },
    });
  };

  const handleCancelMatch = () => {
    cancelMatchMutation.mutate(undefined, {
      onSuccess: () => {
        setMatchmakingState("idle");
      },
    });
  };

  const createGame = (invitedPlayerId?: string) => {
    createGameMutation.mutate(
      { invitedPlayerId: invitedPlayerId || undefined },
      {
        onSuccess: (data) => {
          router.push(`/game/${data.id}`);
        },
      }
    );
  };

  const joinGame = (gameId: string) => {
    if (!gameId) return;

    joinGameMutation.mutate(
      { gameId },
      {
        onSuccess: (data) => {
          if (data.status) {
            router.push(`/game/${gameId}`);
          }
        },
        onError: (err) => {
          console.log(err.message);
        },
      }
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p>LeaderBoard</p>
        <Link href="/auth">Manage Account</Link>
      </div>

      {/* Public Matchmaking */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {matchmakingState === "idle" && (
          <button type="button" onClick={handleFindMatch}>
            Find Match
          </button>
        )}
        {matchmakingState === "searching" && (
          <>
            <p>Searching for opponent...</p>
            <button type="button" onClick={handleCancelMatch}>
              Cancel
            </button>
          </>
        )}
        {matchmakingState === "matched" && <p>Match found! Redirecting...</p>}
      </div>

      {/* Private Matchmaking */}
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Invite player ID (optional)"
          onChange={(e) => {
            setInvitedPlayerId(e.currentTarget.value);
          }}
        />
        <button
          type="button"
          onClick={() => {
            createGame(invitedPlayerId);
          }}
        >
          create game
        </button>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <input
          type="text"
          onChange={(e) => {
            setJoinGameId(e.currentTarget.value);
          }}
        />
        <button
          type="button"
          onClick={() => {
            joinGame(joinGameId);
          }}
        >
          join game
        </button>
      </div>
    </div>
  );
}
