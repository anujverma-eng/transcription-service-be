import { Logger } from "@nestjs/common";

export const callSafe = async <T>(
  fn: () => Promise<T>,
  logError = true,
): Promise<T | null> => {
  try {
    return await fn();
  } catch (e) {
    if (logError) new Logger().error(e);
    console.log("error in callSafe", e);
    return null;
  }
};
