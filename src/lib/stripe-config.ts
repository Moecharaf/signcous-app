import fs from "node:fs";
import path from "node:path";

function readEnvFileValue(key: string): string {
  const candidatePaths = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), ".env.local"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "signcous-app", ".env.local"),
  ];

  try {
    for (const envPath of candidatePaths) {
      if (!fs.existsSync(envPath)) {
        continue;
      }

      const contents = fs.readFileSync(envPath, "utf8");
      const match = contents.match(new RegExp(`^${key}=(.*)$`, "m"));

      if (match?.[1]?.trim()) {
        return match[1].trim();
      }
    }
  } catch {
    return "";
  }

  return "";
}

function resolveValue(key: string): string {
  const fileValue = readEnvFileValue(key);

  if (fileValue) {
    return fileValue;
  }

  const envValue = process.env[key] ?? "";

  if (envValue && !envValue.endsWith("REPLACE_ME")) {
    return envValue;
  }

  return "";
}

export function getStripeSecretKey(): string {
  return resolveValue("STRIPE_SECRET_KEY");
}

export function getStripePublishableKey(): string {
  return resolveValue("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
