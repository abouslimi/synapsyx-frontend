import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_GxKWo2hS9",
  client_id: "6c69v8akat6b5k0t54s6fm1a87",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid email profile",
  automaticSilentRenew: true,
  loadUserInfo: true,
};

const root = createRoot(document.getElementById("root")!);

// wrap the application with AuthProvider
root.render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);
