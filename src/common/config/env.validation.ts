import * as Joi from "joi";

export function validateEnv(config: Record<string, any>) {
  const schema = Joi.object({
    PORT: Joi.number().default(3000),
  });

  const result = schema.validate(config, { allowUnknown: true });

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.value as Record<string, any>;
}
