"use client";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import type { PlayerId } from "server/types";
import z from "zod";
import { useTRPC } from "../../lib/trpc";

export type GameProps = Readonly<{
  currentPlayerId?: PlayerId;
  onSubmit: (value: number) => void;
}>;

const ZFormSchema = z.object({
  move: z.number(),
});

type TFormSchema = z.infer<typeof ZFormSchema>;

export function Game({ onSubmit, currentPlayerId }: GameProps) {
  const trpc = useTRPC();

  console.log("currentPlayerId", currentPlayerId);

  const { data } = useQuery(trpc.user.whoami.queryOptions());

  const myTurn = data?.user.id === currentPlayerId;

  const form = useForm({
    defaultValues: {
      move: 1,
    } as TFormSchema,
    validators: {
      onChange: ZFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value.move);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {myTurn ? (
        <div style={{ display: "flex", gap: "16px" }}>
          <form.Field name="move">
            {({ name, state, handleBlur, handleChange }) => (
              <input
                name={name}
                type="number"
                value={state.value}
                onBlur={handleBlur}
                onChange={(e) => {
                  handleChange(e.currentTarget.valueAsNumber);
                }}
              />
            )}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.isSubmitting, state.canSubmit]}
          >
            {() => {
              return <button type="submit">make move</button>;
            }}
          </form.Subscribe>
        </div>
      ) : (
        <p>waiting for other player</p>
      )}
    </form>
  );
}
