/**
 * WhatsApp Provider Adapter Interface
 * Requirements: 18.6, 18.7
 *
 * Provider dapat diganti tanpa mengubah logika bisnis WA_Engine.
 * Konfigurasi via environment variable WA_PROVIDER.
 */
export interface WaProviderAdapter {
  /**
   * Kirim pesan WhatsApp ke nomor tujuan.
   * @returns messageId dari provider jika berhasil
   */
  send(to: string, message: string): Promise<{ messageId: string }>;

  /**
   * Cek status pengiriman pesan berdasarkan messageId.
   */
  getStatus(messageId: string): Promise<WaMessageStatus>;
}

export type WaMessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export const WA_PROVIDER_ADAPTER = Symbol('WA_PROVIDER_ADAPTER');
