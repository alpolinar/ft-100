import { AuthContainer } from "../../features/auth/containers/auth-container";

export default function AuthPage() {
  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Authentication</h1>
      <AuthContainer />
    </div>
  );
}
