"use client";

import { useForm } from "@tanstack/react-form";
import z from "zod";

const ZRegisterFormSchema = z.object({
  username: z.string().min(1, "Username is required").max(64),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type TRegisterFormSchema = z.infer<typeof ZRegisterFormSchema>;

export type RegisterFormProps = {
  onSubmit: (username: string, email?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function RegisterForm({
  onSubmit,
  isLoading,
  error,
}: RegisterFormProps) {
  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
    } as TRegisterFormSchema,
    validators: {
      onChange: ZRegisterFormSchema,
    },
    onSubmit: async ({ value }) => {
      const emailToSubmit =
        value.email && value.email.trim() !== "" ? value.email : undefined;
      await onSubmit(value.username, emailToSubmit);
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
      <h3>Create Permanent Account (Passkey)</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <form.Field name="username">
          {({ name, state, handleBlur, handleChange }) => (
            <div>
              <label
                htmlFor={name}
                style={{ display: "block", marginBottom: "4px" }}
              >
                Username *
              </label>
              <input
                id={name}
                name={name}
                type="text"
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
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {({ name, state, handleBlur, handleChange }) => (
            <div>
              <label
                htmlFor={name}
                style={{ display: "block", marginBottom: "4px" }}
              >
                Email (Optional)
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
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <button type="submit" disabled={!canSubmit || isLoading}>
              {isLoading ? "Processing..." : "Register with Passkey"}
            </button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
