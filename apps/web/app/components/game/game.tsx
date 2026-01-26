"use client";

import { useMutation } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import Link from "next/link";
import { useState } from "react";
import { useTRPC } from "../../../lib/trpc";

export type GameProps = Readonly<{
  gameId: string;
}>;

export function Game({ gameId }: GameProps) {
  const trpc = useTRPC();

  const [move, setMove] = useState<number>(0);

  const makeMoveMutation = useMutation(trpc.game.makeMove.mutationOptions());

  const { data: gameUpdate } = useSubscription(
    trpc.game.onGameUpdate.subscriptionOptions(
      { gameId },
      {
        onStarted() {
          console.log("started");
        },
        onError(err) {
          console.log("error: ", err);
        },
        onData(data) {
          console.log("data", data);
        },
        onConnectionStateChange(state) {
          console.log("status change", state);
        },
      }
    )
  );

  const makeMove = (move: number) => {
    makeMoveMutation.mutate(
      {
        gameId,
        value: move,
      },
      {
        onSuccess: (data) => {
          console.log("move successfull", data);
        },
        onError: (err) => {
          console.log("error", err);
        },
      }
    );
  };

  console.log("gameUpdate", gameUpdate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Link href="/game">leaderboard</Link>
      <div style={{ display: "flex", gap: "16px" }}>
        <input
          type="text"
          onChange={(e) => {
            if (!e.currentTarget.value) return;

            const move = Number.parseInt(e.currentTarget.value, 10);

            if (!Number.isNaN(move) && move >= 1 && move <= 10) {
              setMove(move);
            }

            console.log("invalid move");
          }}
        />
        <button
          type="button"
          onClick={() => {
            makeMove(move);
          }}
        >
          make move
        </button>
      </div>
    </div>
  );
}
