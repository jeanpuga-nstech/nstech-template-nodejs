import { plainToInstance } from "class-transformer";
import { Equals, IsIn, IsNumber, IsString, validateSync } from "class-validator";

export class EnvironmentVariables {
  @IsNumber()
  PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  DATABASE_HOST!: string;

  @IsNumber()
  DATABASE_PORT!: number;

  @IsString()
  DATABASE_USERNAME!: string;

  @IsString()
  DATABASE_PASSWORD!: string;

  @IsString()
  DATABASE_NAME!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  KEYCLOAK_ISSUER!: string;

  @Equals("UTC")
  TZ!: "UTC";

  @IsString()
  AWS_BUCKET_NAME!: string;

  @IsIn(["development", "homolog", "production"])
  NODE_ENV: "development" | "homolog" | "production" = "development";
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
