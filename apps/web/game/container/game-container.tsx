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

  console.log("gameUpdate", localGame);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Link href="/game">leaderboard</Link>
      {match(localGame?.payload)
        .with({ type: "state_updated" }, (current) => {
          return match(current.state)
            .with({ status: "lobby" }, () => {
              return <p>waiting for other player...</p>;
            })
            .with({ status: "countdown" }, (current) => {
              return <p>{current.countdown}</p>;
            })
            .with({ status: "active" }, () => {
              return <Game onSubmit={makeMove} />;
            })
            .with({ status: "finished" }, (current) => {
              return <p>{JSON.stringify(current)}</p>;
            })
            .exhaustive();
        })
        .with({ type: "game_finished" }, (current) => {
          return <p>game finished: {current.winner}</p>;
        })
        .with(undefined, () => {
          return <p>loadding...</p>;
        })
        .exhaustive()}
      {}
    </div>
  );
}
