import * as Joi from "joi";

export function validateEnv(config: Record<string, any>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid("development", "production").required(),
    PORT: Joi.number().default(3000),

    // MongoDB
    MONGO_URI: Joi.string().required(),
    MONGODB_USE_TRANSACTIONS: Joi.boolean().default(false),

    // JWT Auth
    JWT_SECRET: Joi.string().required(),
    JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
    JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),

    // Google OAuth
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
    GOOGLE_CALLBACK_URL: Joi.string().required(),

    // AWS S3
    AWS_REGION: Joi.string().required(),
    AWS_ACCESS_KEY_ID: Joi.string().required(),
    AWS_SECRET_ACCESS_KEY: Joi.string().required(),
    S3_BUCKET_NAME: Joi.string().required(),

    // Redis
    REDIS_HOST: Joi.string().default("localhost"),
    REDIS_PORT: Joi.number().default(6379),

    // Razorpay
    RAZORPAY_KEY_ID: Joi.string().required(),
    RAZORPAY_KEY_SECRET: Joi.string().required(),
  });

  const result = schema.validate(config, { allowUnknown: true });

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.value as Record<string, any>;
}
