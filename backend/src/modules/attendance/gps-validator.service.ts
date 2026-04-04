import { Injectable } from '@nestjs/common';

export const GPS_ACCURACY_THRESHOLD_METERS = 50; // Requirement 5.5

export interface GpsValidationResult {
  accepted: boolean;
  pendingReview: boolean;
  distanceMeters: number;
  reason?: string;
}

@Injectable()
export class GpsValidatorService {
  /**
   * Calculate Haversine distance between two GPS coordinates in meters.
   * Requirements: 5.4
   */
  haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validate GPS coordinates against session location and radius.
   *
   * Rules:
   * - If accuracy > 50m → PENDING_REVIEW (not rejected) — Requirement 5.5
   * - If distance > radius → rejected — Requirement 5.6
   * - Otherwise → accepted (HADIR)
   *
   * Requirements: 5.4, 5.5, 5.6
   */
  validate(params: {
    santriLat: number;
    santriLng: number;
    gpsAccuracy: number | null;
    sessionLat: number;
    sessionLng: number;
    radiusMeter: number;
  }): GpsValidationResult {
    const { santriLat, santriLng, gpsAccuracy, sessionLat, sessionLng, radiusMeter } = params;

    const distanceMeters = this.haversineDistance(
      sessionLat,
      sessionLng,
      santriLat,
      santriLng,
    );

    // Accuracy check takes priority — mark PENDING_REVIEW if accuracy is poor
    // Requirement 5.5: IF akurasi GPS > 50 meter → PENDING_REVIEW (tidak langsung ditolak)
    if (gpsAccuracy !== null && gpsAccuracy > GPS_ACCURACY_THRESHOLD_METERS) {
      return {
        accepted: true,
        pendingReview: true,
        distanceMeters,
        reason: `GPS accuracy ${gpsAccuracy}m exceeds threshold of ${GPS_ACCURACY_THRESHOLD_METERS}m`,
      };
    }

    // Distance check — Requirement 5.6
    if (distanceMeters > radiusMeter) {
      return {
        accepted: false,
        pendingReview: false,
        distanceMeters,
        reason: `Distance ${distanceMeters.toFixed(1)}m exceeds allowed radius of ${radiusMeter}m`,
      };
    }

    return {
      accepted: true,
      pendingReview: false,
      distanceMeters,
    };
  }
}
