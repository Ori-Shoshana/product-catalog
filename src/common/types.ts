export interface AppConfig {
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  telemetry: {
    logger: {
      level: string;
      prettyPrint: boolean;
    };
  };
}
