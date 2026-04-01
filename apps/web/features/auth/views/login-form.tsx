"use client";

import { Button } from "@repo/ui/components/button";
import { useForm } from "@tanstack/react-form";
import z from "zod";

const ZLoginFormSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type TLoginFormSchema = z.infer<typeof ZLoginFormSchema>;

export type LoginFormProps = {
  onSubmit: (email?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      email: "",
    } as TLoginFormSchema,
    validators: {
      onChange: ZLoginFormSchema,
    },
    onSubmit: async ({ value }) => {
      const emailToSubmit =
        value.email && value.email.trim() !== "" ? value.email : undefined;
      await onSubmit(emailToSubmit);
    },
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px",
        border: "1px solid #ccc",
      }}
    >
      <h3>Sign In (Passkey)</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <form.Field name="email">
          {({ name, state, handleBlur, handleChange }) => (
            <div>
              <label
                htmlFor={name}
                style={{ display: "block", marginBottom: "4px" }}
              >
                Email (Optional for lookup)
              </label>
              <input
                id={name}
                name={name}
                type="email"
                value={state.value}
                onBlur={handleBlur}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isLoading}
              />
              {state.meta.errors.length > 0 && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {state.meta.errors.join(",")}
                </p>
              )}
              <small
                style={{ display: "block", color: "#666", marginTop: "4px" }}
              >
                Leave empty if using a discoverable credential (usernameless
                login).
              </small>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <Button type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? "Processing..." : "Sign In with Passkey"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
