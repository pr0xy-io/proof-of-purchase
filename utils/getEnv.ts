const getEnv = (environment: string | undefined) => {
  switch (environment) {
    case "development":
      return ".env.development";
    case "deploy":
      return ".env.deploy";
    case "production":
      return ".env";
    default:
      return ".env";
  }
};

export default getEnv;
