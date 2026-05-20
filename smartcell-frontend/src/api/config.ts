// Almacenar la configuración pública
let publicConfig: { public_url: string; api_url: string } | null = null;
let configPromise: Promise<any> | null = null;

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL;
};

const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL;
};
/**
 * Obtiene la URL pública desde el servidor (OBLIGATORIO)
 * Esta es la ÚNICA fuente de verdad para los QR
 */
export const fetchPublicConfig = async () => {
  // Si ya hay una promesa en progreso, esperarla
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const apiUrl = getApiUrl();
        const configUrl = `${apiUrl}/config`;

        console.log(`📡 [Intento ${attempts + 1}/${maxAttempts}] Obteniendo configuración desde:`, configUrl);

        const response = await fetch(configUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Respuesta de config:', data);

          if (data.success && data.public_url) {
            publicConfig = {
              public_url: data.public_url,
              api_url: data.api_url || data.public_url + '/api',
            };
            console.log('✅ Configuración cargada correctamente:', publicConfig.public_url);
            return publicConfig;
          }
        } else {
          console.warn(`⚠️ Config endpoint retornó ${response.status}:`, await response.text());
        }
      } catch (error) {
        console.warn(`⚠️ Intento ${attempts + 1} falló:`, error);
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms antes de reintentar
      }
    }

    console.error('❌ No se pudo obtener la configuración del servidor después de 3 intentos');
    console.error('❌ Asegúrate de acceder desde la IP correcta (ejemplo: http://192.168.18.6:5173)');
    console.error('❌ NO uses localhost - accede siempre desde la IP del servidor');

    return null;
  })();

  return configPromise;
};

/**
 * Obtiene la URL pública del servidor (DEBE estar cargada previamente)
 * NUNCA retorna localhost
 */
export const getPublicUrl = (): string => {
  if (!publicConfig?.public_url) {
    console.error('❌ ERROR: Configuración pública NO está cargada');
    console.error('❌ Llama a fetchPublicConfig() primero');
    throw new Error('Public config not loaded - call fetchPublicConfig() first');
  }
  return publicConfig.public_url;
};

/**
 * Espera a que la configuración pública esté lista y retorna la URL
 */
export const getPublicUrlAsync = async (): Promise<string> => {
  const config = await fetchPublicConfig();
  if (!config?.public_url) {
    throw new Error('Failed to load public configuration from server');
  }
  return config.public_url;
};

export const API_BASE_URL = getApiUrl();
export const BACKEND_URL = getBackendUrl();
