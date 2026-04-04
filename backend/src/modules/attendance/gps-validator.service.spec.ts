// Feature: pesantren-management-app, Property 12: GPS Validation Konsisten dengan Radius Konfigurasi
import * as fc from 'fast-check';
import { GpsValidatorService, GPS_ACCURACY_THRESHOLD_METERS } from './gps-validator.service';

describe('GpsValidatorService — Unit Tests', () => {
  let service: GpsValidatorService;

  beforeEach(() => {
    service = new GpsValidatorService();
  });

  describe('haversineDistance', () => {
    it('should return 0 for identical coordinates', () => {
      const dist = service.haversineDistance(-6.2088, 106.8456, -6.2088, 106.8456);
      expect(dist).toBeCloseTo(0, 1);
    });

    it('should calculate known distance correctly (~111km per degree latitude)', () => {
      // 1 degree latitude ≈ 111,195 meters
      const dist = service.haversineDistance(0, 0, 1, 0);
      expect(dist).toBeGreaterThan(110000);
      expect(dist).toBeLessThan(112000);
    });

    it('should be symmetric (A→B == B→A)', () => {
      const d1 = service.haversineDistance(-6.2088, 106.8456, -6.2100, 106.8500);
      const d2 = service.haversineDistance(-6.2100, 106.8500, -6.2088, 106.8456);
      expect(d1).toBeCloseTo(d2, 5);
    });
  });

  describe('validate', () => {
    const sessionLat = -6.2088;
    const sessionLng = 106.8456;
    const radiusMeter = 100;

    it('should accept coordinates within radius with good accuracy', () => {
      // Same point = 0 distance, well within radius
      const result = service.validate({
        santriLat: sessionLat,
        santriLng: sessionLng,
        gpsAccuracy: 10,
        sessionLat,
        sessionLng,
        radiusMeter,
      });
      expect(result.accepted).toBe(true);
      expect(result.pendingReview).toBe(false);
    });

    it('should reject coordinates outside radius', () => {
      // ~500m away
      const result = service.validate({
        santriLat: -6.2133,
        santriLng: 106.8456,
        gpsAccuracy: 10,
        sessionLat,
        sessionLng,
        radiusMeter,
      });
      expect(result.accepted).toBe(false);
      expect(result.pendingReview).toBe(false);
    });

    it('should mark PENDING_REVIEW when accuracy > 50m (even if within radius)', () => {
      const result = service.validate({
        santriLat: sessionLat,
        santriLng: sessionLng,
        gpsAccuracy: 51, // > 50m threshold
        sessionLat,
        sessionLng,
        radiusMeter,
      });
      expect(result.accepted).toBe(true);
      expect(result.pendingReview).toBe(true);
    });

    it('should accept with accuracy exactly at threshold (50m)', () => {
      const result = service.validate({
        santriLat: sessionLat,
        santriLng: sessionLng,
        gpsAccuracy: 50, // exactly at threshold — not > 50
        sessionLat,
        sessionLng,
        radiusMeter,
      });
      expect(result.accepted).toBe(true);
      expect(result.pendingReview).toBe(false);
    });

    it('should accept with null accuracy (no GPS accuracy data)', () => {
      const result = service.validate({
        santriLat: sessionLat,
        santriLng: sessionLng,
        gpsAccuracy: null,
        sessionLat,
        sessionLng,
        radiusMeter,
      });
      expect(result.accepted).toBe(true);
      expect(result.pendingReview).toBe(false);
    });
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────
describe('GpsValidatorService — Property 12: GPS Validation Konsisten dengan Radius Konfigurasi', () => {
  let service: GpsValidatorService;

  beforeEach(() => {
    service = new GpsValidatorService();
  });

  /**
   * Property 12a: Koordinat identik dengan sesi selalu diterima (jika akurasi baik)
   * Validates: Requirements 5.4
   */
  it('Property 12a: Koordinat identik dengan sesi selalu diterima', () => {
    // Feature: pesantren-management-app, Property 12: GPS Validation Konsisten dengan Radius Konfigurasi
    fc.assert(
      fc.property(
        fc.float({ min: -89, max: 89, noNaN: true }),
        fc.float({ min: -179, max: 179, noNaN: true }),
        fc.integer({ min: 10, max: 1000 }),
        (lat, lng, radius) => {
          const result = service.validate({
            santriLat: lat,
            santriLng: lng,
            gpsAccuracy: 10, // good accuracy
            sessionLat: lat,
            sessionLng: lng,
            radiusMeter: radius,
          });
          // Same point = 0 distance, always within any radius
          expect(result.accepted).toBe(true);
          expect(result.pendingReview).toBe(false);
          expect(result.distanceMeters).toBeCloseTo(0, 0);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 12b: Akurasi GPS > 50m selalu menghasilkan PENDING_REVIEW (tidak ditolak)
   * Validates: Requirements 5.5
   */
  it('Property 12b: Akurasi GPS > 50m selalu menghasilkan PENDING_REVIEW', () => {
    // Feature: pesantren-management-app, Property 12: GPS Validation Konsisten dengan Radius Konfigurasi
    fc.assert(
      fc.property(
        fc.float({ min: -89, max: 89, noNaN: true }),
        fc.float({ min: -179, max: 179, noNaN: true }),
        fc.float({ min: 51, max: 500, noNaN: true }), // accuracy > 50m
        fc.integer({ min: 10, max: 1000 }),
        (lat, lng, accuracy, radius) => {
          const result = service.validate({
            santriLat: lat,
            santriLng: lng,
            gpsAccuracy: accuracy,
            sessionLat: lat, // same location to avoid distance rejection
            sessionLng: lng,
            radiusMeter: radius,
          });
          // Must be PENDING_REVIEW, not rejected
          expect(result.accepted).toBe(true);
          expect(result.pendingReview).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 12c: Haversine distance bersifat simetris
   * Validates: Requirements 5.4
   */
  it('Property 12c: Haversine distance bersifat simetris (A→B == B→A)', () => {
    // Feature: pesantren-management-app, Property 12: GPS Validation Konsisten dengan Radius Konfigurasi
    fc.assert(
      fc.property(
        fc.float({ min: -89, max: 89, noNaN: true }),
        fc.float({ min: -179, max: 179, noNaN: true }),
        fc.float({ min: -89, max: 89, noNaN: true }),
        fc.float({ min: -179, max: 179, noNaN: true }),
        (lat1, lng1, lat2, lng2) => {
          const d1 = service.haversineDistance(lat1, lng1, lat2, lng2);
          const d2 = service.haversineDistance(lat2, lng2, lat1, lng1);
          expect(Math.abs(d1 - d2)).toBeLessThan(0.001); // within 1mm
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 12d: Koordinat di luar radius selalu ditolak (jika akurasi baik)
   * Validates: Requirements 5.6
   */
  it('Property 12d: Koordinat di luar radius selalu ditolak', () => {
    // Feature: pesantren-management-app, Property 12: GPS Validation Konsisten dengan Radius Konfigurasi
    fc.assert(
      fc.property(
        // Session at equator
        fc.constant(0.0),
        fc.constant(0.0),
        // Santri at 1 degree away (~111km)
        fc.constant(1.0),
        fc.constant(0.0),
        fc.integer({ min: 10, max: 1000 }), // radius max 1km, distance ~111km
        (sessionLat, sessionLng, santriLat, santriLng, radius) => {
          const result = service.validate({
            santriLat,
            santriLng,
            gpsAccuracy: 10, // good accuracy
            sessionLat,
            sessionLng,
            radiusMeter: radius,
          });
          // ~111km >> any radius up to 1000m
          expect(result.accepted).toBe(false);
          expect(result.pendingReview).toBe(false);
          expect(result.distanceMeters).toBeGreaterThan(radius);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 12e: distanceMeters selalu non-negatif
   * Validates: Requirements 5.4
   */
  it('Property 12e: distanceMeters selalu non-negatif', () => {
    // Feature: pesantren-management-app, Property 12: GPS Validation Konsisten dengan Radius Konfigurasi
    fc.assert(
      fc.property(
        fc.float({ min: -89, max: 89, noNaN: true }),
        fc.float({ min: -179, max: 179, noNaN: true }),
        fc.float({ min: -89, max: 89, noNaN: true }),
        fc.float({ min: -179, max: 179, noNaN: true }),
        fc.integer({ min: 10, max: 1000 }),
        (lat1, lng1, lat2, lng2, radius) => {
          const result = service.validate({
            santriLat: lat1,
            santriLng: lng1,
            gpsAccuracy: 10,
            sessionLat: lat2,
            sessionLng: lng2,
            radiusMeter: radius,
          });
          expect(result.distanceMeters).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
