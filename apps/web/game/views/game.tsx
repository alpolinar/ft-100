"use client";

import { useForm } from "@tanstack/react-form";
import z from "zod";

export type GameProps = Readonly<{
  onSubmit: (value: number) => void;
}>;

const ZFormSchema = z.object({
  move: z.number(),
});

type TFormSchema = z.infer<typeof ZFormSchema>;

export function Game({ onSubmit }: GameProps) {
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
    </form>
  );
}
