import { router } from "../../trpc.js";
import {
  sendEmailVerificationCode,
  verifyEmailCode,
} from "./email-verification.route.js";
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "./login.route.js";
import { logout } from "./logout.route.js";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "./register.route.js";
import { whoami } from "./who-am-i.route.js";

export const userRouter = router({
  whoami,
  sendEmailVerificationCode,
  verifyEmailCode,
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  logout,
});
