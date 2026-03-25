"use client";

import { useForm } from "@tanstack/react-form";
import z from "zod";

const ZRegisterFormSchema = z.object({
  username: z.string().min(1, "Username is required").max(64),
  email: z.email("Invalid email address").min(1, "Email is required"),
  verificationCode: z.string().length(6, "Code must be 6 digits").optional(),
});

type TRegisterFormSchema = z.infer<typeof ZRegisterFormSchema>;

type RegistrationStep = "details" | "verify" | "passkey";

export type RegisterFormProps = {
  onSubmit: (username: string, email: string) => Promise<void>;
  onSendCode: (email: string) => Promise<boolean>;
  onVerifyCode: (email: string, code: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  emailVerified: boolean;
  step: RegistrationStep;
  onStepChange: (step: RegistrationStep) => void;
};

export function RegisterForm({
  onSubmit,
  onSendCode,
  onVerifyCode,
  isLoading,
  error,
  emailVerified,
  step,
  onStepChange,
}: RegisterFormProps) {
  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      verificationCode: "",
    } as TRegisterFormSchema,
    onSubmit: async ({ value }) => {
      if (step === "details") {
        // Send verification code
        const sent = await onSendCode(value.email);
        if (sent) {
          onStepChange("verify");
        }
      } else if (step === "verify") {
        // Verify the code
        const verified = await onVerifyCode(
          value.email,
          value.verificationCode ?? ""
        );
        if (verified) {
          onStepChange("passkey");
        }
      } else if (step === "passkey") {
        // Proceed with passkey registration
        await onSubmit(value.username, value.email);
      }
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

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
        <span
          style={{
            fontWeight: step === "details" ? "bold" : "normal",
            color: step === "details" ? "#000" : "#999",
          }}
        >
          1. Details
        </span>
        <span style={{ color: "#ccc" }}>→</span>
        <span
          style={{
            fontWeight: step === "verify" ? "bold" : "normal",
            color: step === "verify" ? "#000" : "#999",
          }}
        >
          2. Verify Email
        </span>
        <span style={{ color: "#ccc" }}>→</span>
        <span
          style={{
            fontWeight: step === "passkey" ? "bold" : "normal",
            color: step === "passkey" ? "#000" : "#999",
          }}
        >
          3. Passkey
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {/* Step 1: Username + Email */}
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
                disabled={isLoading || step !== "details"}
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
                Email *
              </label>
              <input
                id={name}
                name={name}
                type="email"
                value={state.value}
                onBlur={handleBlur}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isLoading || step !== "details"}
              />
              {state.meta.errors.length > 0 && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {state.meta.errors.join(",")}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Step 2: Verification code input */}
        {step === "verify" && (
          <form.Field name="verificationCode">
            {({ name, state, handleBlur, handleChange }) => (
              <div>
                <label
                  htmlFor={name}
                  style={{ display: "block", marginBottom: "4px" }}
                >
                  Verification Code *
                </label>
                <p
                  style={{ fontSize: "13px", color: "#666", margin: "0 0 8px" }}
                >
                  A 6-digit code has been sent to your email.
                </p>
                <input
                  id={name}
                  name={name}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={state.value}
                  onBlur={handleBlur}
                  onChange={(e) =>
                    handleChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={isLoading}
                  style={{
                    letterSpacing: "4px",
                    fontSize: "18px",
                    width: "120px",
                  }}
                />
                {state.meta.errors.length > 0 && (
                  <p style={{ color: "red", fontSize: "12px" }}>
                    {state.meta.errors.join(",")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        )}

        {/* Step 3: Confirmation */}
        {step === "passkey" && emailVerified && (
          <div
            style={{
              padding: "8px 12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "4px",
              fontSize: "13px",
              color: "#166534",
            }}
          >
            ✓ Email verified. Click below to complete registration with a
            passkey.
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {step === "details" && (
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Verification Code"}
            </button>
          )}

          {step === "verify" && (
            <>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onStepChange("details")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: "13px",
                  textDecoration: "underline",
                }}
              >
                Change email
              </button>
            </>
          )}

          {step === "passkey" && (
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Register with Passkey"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
