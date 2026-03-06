import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTRPC } from "../../../lib/trpc";

export function usePasskey() {
  const trpc = useTRPC();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerOptsMutation = useMutation(
    trpc.user.generatePasskeyRegistrationOptions.mutationOptions()
  );
  const verifyRegisterMutation = useMutation(
    trpc.user.verifyPasskeyRegistration.mutationOptions()
  );

  const authOptsMutation = useMutation(
    trpc.user.generatePasskeyAuthenticationOptions.mutationOptions()
  );
  const verifyAuthMutation = useMutation(
    trpc.user.verifyPasskeyAuthentication.mutationOptions()
  );

  const logoutMutation = useMutation(trpc.user.logout.mutationOptions());

  const register = useCallback(
    async (username: string, email?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Get options from server
        const options = await registerOptsMutation.mutateAsync({ username });

        // 2. Perform WebAuthn registration in browser
        // Type case needed since TRPC generic mapping doesn't perfectly align with simplewebauthn JSON types
        const response = await startRegistration({
          optionsJSON:
            options as unknown as PublicKeyCredentialCreationOptionsJSON,
        });

        // 3. Verify response on server
        await verifyRegisterMutation.mutateAsync({
          username,
          email,
          response: response as unknown as RegistrationResponseJSON,
        });

        return true;
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Registration failed");
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [registerOptsMutation, verifyRegisterMutation]
  );

  const login = useCallback(
    async (email?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Get options from server
        const ObjectOrUndefined = email ? { email } : undefined;
        const options = await authOptsMutation.mutateAsync(ObjectOrUndefined);

        // 2. Perform WebAuthn authentication in browser
        const response = await startAuthentication({
          optionsJSON:
            options as unknown as PublicKeyCredentialRequestOptionsJSON,
        });

        // 3. Verify response on server
        await verifyAuthMutation.mutateAsync({
          response: response as unknown as AuthenticationResponseJSON,
        });

        return true;
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Login failed");
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authOptsMutation, verifyAuthMutation]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logoutMutation.mutateAsync();
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Logout failed");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logoutMutation]);

  return {
    register,
    login,
    logout,
    isLoading,
    error,
  };
}
