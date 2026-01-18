"use client";

import { useSubscription } from "@trpc/tanstack-react-query";
import { useTRPC } from "../lib/trpc";
import { useMutation } from "@tanstack/react-query";

export default function Home() {
    const trpc = useTRPC();

    const gameId: string = "123";

    const makeMoveMutation = trpc.game.makeMove.mutationOptions();

    const onGameUpdate = trpc.game.onGameUpdate.subscriptionOptions(
        { gameId: "123" },
        {
            onData: (event) => {
                console.log("event", event);
            },
        }
    );

    const makeMove = useMutation(makeMoveMutation);

    const { data: game } = useSubscription(onGameUpdate);
    console.log("game", game);

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    makeMove.mutate({ gameId, value: 1 });
                }}
            >
                send
            </button>
        </div>
    );
}
