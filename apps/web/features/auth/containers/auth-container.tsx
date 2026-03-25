"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "../../../lib/trpc";
import { usePasskey } from "../hooks/use-passkey";
import { LoginForm } from "../views/login-form";
import { RegisterForm } from "../views/register-form";

type RegistrationStep = "details" | "verify" | "passkey";

export function AuthContainer() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { register, login, logout, isLoading, error } = usePasskey();

  const [registrationStep, setRegistrationStep] =
    useState<RegistrationStep>("details");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const sendCodeMutation = useMutation(
    trpc.user.sendEmailVerificationCode.mutationOptions()
  );
  const verifyCodeMutation = useMutation(
    trpc.user.verifyEmailCode.mutationOptions()
  );

  // Query the current user state
  const { data: whoamiData, isLoading: isLoadingWhoami } = useQuery(
    trpc.user.whoami.queryOptions()
  );

  const handleSendCode = async (email: string): Promise<boolean> => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      await sendCodeMutation.mutateAsync({ email });
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEmailError(err.message);
      } else {
        setEmailError("Failed to send verification code");
      }
      return false;
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyCode = async (
    email: string,
    code: string
  ): Promise<boolean> => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      await verifyCodeMutation.mutateAsync({ email, code });
      setEmailVerified(true);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEmailError(err.message);
      } else {
        setEmailError("Verification failed");
      }
      return false;
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRegister = async (username: string, email: string) => {
    const success = await register(username, email);
    if (success) {
      // Invalidate whoami to fetch the new registered state
      queryClient.invalidateQueries(trpc.user.whoami.queryFilter());
    }
  };

  const handleLogin = async (email?: string) => {
    const success = await login(email);
    if (success) {
      // Invalidate whoami to fetch the newly authenticated state
      queryClient.invalidateQueries(trpc.user.whoami.queryFilter());
    }
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      // Invalidate whoami to fetch the new guest state
      queryClient.invalidateQueries(trpc.user.whoami.queryFilter());
    }
  };

  const handleStepChange = (step: RegistrationStep) => {
    setRegistrationStep(step);
    setEmailError(null);
    if (step === "details") {
      // Reset verification state when going back
      setEmailVerified(false);
    }
  };

  if (isLoadingWhoami) {
    return <div>Loading session...</div>;
  }

  const currentUser = whoamiData?.user;

  // If the user is a registered user, show account info and logout
  if (currentUser?.type === "registered") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2>Account Settings</h2>
        <div style={{ padding: "16px", border: "1px solid #ccc" }}>
          <p>
            <strong>Username:</strong> {currentUser.username}
          </p>
          <p>
            <strong>ID:</strong> {currentUser.id}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            style={{ marginTop: "12px" }}
          >
            {isLoading ? "Processing..." : "Log Out"}
          </button>
          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
        </div>
      </div>
    );
  }

  // Otherwise, the user is a guest. Show both login and register options.
  // Combine errors from passkey hook and email verification
  const combinedError = emailError || error;
  const combinedLoading = isLoading || emailLoading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h2>Currently playing as Guest</h2>
        <p>Guest ID: {currentUser?.id}</p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "32px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <RegisterForm
            onSubmit={handleRegister}
            onSendCode={handleSendCode}
            onVerifyCode={handleVerifyCode}
            isLoading={combinedLoading}
            error={combinedError}
            emailVerified={emailVerified}
            step={registrationStep}
            onStepChange={handleStepChange}
          />
        </div>
        <div style={{ flex: "1 1 300px" }}>
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
