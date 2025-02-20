import * as Joi from "joi";

export function validateEnv(config: Record<string, any>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid("development", "production").required(),
    PORT: Joi.number().default(3000),
    JWT_SECRET: Joi.string().required(),
    MONGO_URI: Joi.string().required(),
    JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
    JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
  });

  const result = schema.validate(config, { allowUnknown: true });

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.value as Record<string, any>;
}
