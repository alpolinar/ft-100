"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type RouterInputs, useTRPC } from "../../lib/trpc";

export default function LeaderBoard() {
  const trpc = useTRPC();
  const router = useRouter();
  type CreateGameInput = RouterInputs["game"]["createGame"];

  const [invitedPlayerId, setInvitedPlayerId] = useState<string>("");
  const [joinGameId, setJoinGameId] = useState<string>("");

  const createGameMutation = useMutation(
    trpc.game.createGame.mutationOptions()
  );

  const joinGameMutation = useMutation(trpc.game.joinGame.mutationOptions());

  const createGame = ({ invitedPlayerId, lobbyType }: CreateGameInput) => {
    createGameMutation.mutate(
      { invitedPlayerId, lobbyType },
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
      {
        gameId,
      },
      {
        onSuccess: (data) => {
          console.log(data.message);

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
      <p>LeaderBoard</p>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <input
          type="text"
          onChange={(e) => {
            setInvitedPlayerId(e.currentTarget.value);
          }}
        />
        <button
          type="button"
          onClick={() => {
            createGame({
              invitedPlayerId,
              lobbyType: invitedPlayerId ? "invite" : "open",
            });
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
