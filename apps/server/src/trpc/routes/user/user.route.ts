import { router } from "../../trpc.js";
import { whoami } from "./who-am-i.route.js";

export const userRouter = router({
  whoami,
});
