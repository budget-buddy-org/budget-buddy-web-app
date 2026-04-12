export interface AppConfig {
  VITE_API_URL: string
}

let config: AppConfig | null = null

/**
 * Loads the application configuration from /config.json at runtime.
 * Falls back to Vite environment variables during local development or if the fetch fails.
 */
export async function loadConfig(): Promise<AppConfig> {
  if (config) return config

  try {
    const response = await fetch('/config.json')
    if (response.ok) {
      const runtimeConfig = await response.json()
      // Filter out un-substituted placeholders like "$VITE_API_URL"
      if (runtimeConfig.VITE_API_URL && !runtimeConfig.VITE_API_URL.startsWith('$')) {
        config = runtimeConfig
        console.info('Runtime configuration loaded successfully')
      }
    }
  } catch (error) {
    // Expected during local development where /config.json doesn't exist
    if (import.meta.env.PROD) {
      console.error('Failed to load runtime config, falling back to build-time env', error)
    }
  }

  if (!config) {
    config = {
      VITE_API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
    }
  }

  return config
}

/**
 * Synchronously returns the already loaded configuration.
 * Must be called after loadConfig() has completed.
 */
export function getConfig(): AppConfig {
  if (!config) {
    // If getConfig is called before loadConfig (e.g. in some early side-effect),
    // we return a temporary object based on env vars as a last-resort fallback.
    return {
      VITE_API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
    }
  }
  return config
}
