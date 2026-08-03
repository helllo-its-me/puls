import { z } from 'zod';

const optionalSmtpUserSchema = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().trim().min(1).optional()
);
const optionalSmtpPasswordSchema = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.string().min(1).optional()
);

const smtpConfigSchema = z
  .object({
    PASSWORD_RESET_SMTP_HOST: z.string().trim().min(1),
    PASSWORD_RESET_SMTP_PORT: z.coerce.number().int().min(1).max(65_535),
    PASSWORD_RESET_SMTP_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true'),
    PASSWORD_RESET_SMTP_USER: optionalSmtpUserSchema,
    PASSWORD_RESET_SMTP_PASSWORD: optionalSmtpPasswordSchema,
    PASSWORD_RESET_EMAIL_FROM: z.string().trim().min(1)
  })
  .refine(
    (config) => Boolean(config.PASSWORD_RESET_SMTP_USER)
      === Boolean(config.PASSWORD_RESET_SMTP_PASSWORD),
    {
      message: 'PASSWORD_RESET_SMTP_USER and PASSWORD_RESET_SMTP_PASSWORD must be set together'
    }
  );

export type PasswordResetSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  from: string;
};

export function readPasswordResetSmtpConfig(
  environment: NodeJS.ProcessEnv = process.env
): PasswordResetSmtpConfig {
  const config = smtpConfigSchema.parse(environment);

  return {
    host: config.PASSWORD_RESET_SMTP_HOST,
    port: config.PASSWORD_RESET_SMTP_PORT,
    secure: config.PASSWORD_RESET_SMTP_SECURE,
    user: config.PASSWORD_RESET_SMTP_USER ?? null,
    password: config.PASSWORD_RESET_SMTP_PASSWORD ?? null,
    from: config.PASSWORD_RESET_EMAIL_FROM
  };
}
