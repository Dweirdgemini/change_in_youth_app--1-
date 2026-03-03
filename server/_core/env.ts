export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Email configuration
  emailService: process.env.EMAIL_SERVICE ?? "console", // 'console', 'sendgrid', or 'ses'
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@changeindelivery.org",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  // Agora configuration
  AGORA_APP_ID: process.env.AGORA_APP_ID ?? "",
  AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE ?? "",
};
