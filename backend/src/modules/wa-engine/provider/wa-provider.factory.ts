import { ConfigService } from '@nestjs/config';
import { FonnteAdapter } from './fonnte.adapter';
import { CustomHttpAdapter } from './custom-http.adapter';
import { WaProviderAdapter } from './wa-provider.interface';

/**
 * Factory untuk membuat instance WaProviderAdapter berdasarkan env WA_PROVIDER.
 * Mengganti provider tidak memerlukan perubahan kode WA_Engine.
 * Requirements: 18.6
 */
export function createWaProviderAdapter(config: ConfigService): WaProviderAdapter {
  const provider = config.get<string>('WA_PROVIDER', 'fonnte').toLowerCase();

  switch (provider) {
    case 'fonnte':
      return new FonnteAdapter(config);
    case 'custom':
      return new CustomHttpAdapter(config);
    default:
      // Default ke Fonnte jika provider tidak dikenal
      return new FonnteAdapter(config);
  }
}
