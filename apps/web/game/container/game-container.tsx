"use client";

import { useMutation } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import Link from "next/link";
import { useState } from "react";
import type { GameEvent } from "server/types";
import { match } from "ts-pattern";
import { useTRPC } from "../../lib/trpc";
import { Game } from "../views/game";

export type GameProps = Readonly<{
  gameId: string;
}>;

export function GameContainer({ gameId }: GameProps) {
  const trpc = useTRPC();

  const [localGame, setLocalGame] = useState<GameEvent>();

  const makeMoveMutation = useMutation(trpc.game.makeMove.mutationOptions());

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

  useSubscription(
    trpc.game.onGameUpdate.subscriptionOptions(
      { gameId },
      {
        onStarted: () => {
          console.log("started");
        },
        onError: (err) => {
          console.log("error: ", err);
        },
        onData: (data) => {
          console.log("data", data);
          setLocalGame(data);
        },
        onConnectionStateChange: (state) => {
          console.log("status change", state);
        },
      }
    )
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Link href="/game">leaderboard</Link>
      {match(localGame?.payload)
        .with({ status: "lobby" }, () => {
          return <p>waiting for ther other player...</p>;
        })
        .with({ status: "countdown" }, (current) => {
          return <p>{current.countdown}</p>;
        })
        .with({ status: "active" }, (current) => {
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <p>{current.globalValue}</p>
              <Game
                onSubmit={makeMove}
                currentPlayerId={current.players[current.currentTurn]}
              />
            </div>
          );
        })
        .with({ status: "finished" }, (current) => {
          return <p>winner is: {current.winnerId}</p>;
        })
        .with(undefined, () => {
          return <p>loading...</p>;
        })
        .exhaustive()}
    </div>
  );
}
