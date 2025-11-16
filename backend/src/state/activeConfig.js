let activeDBConfig = null;

export function setActiveConfig(config) {
  activeDBConfig = config;
}

export function getActiveConfig() {
  return activeDBConfig;
}
