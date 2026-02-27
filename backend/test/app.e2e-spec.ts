import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Layanan E2E dapat dijalankan dengan baik', () => {
    expect(true).toBe(true);
  });

  // Contoh testing endpoint Auth, sesuaikan detail logic
  // it('/api/v1/auth/login (POST)', () => {
  //   return request(app.getHttpServer())
  //     .post('/api/v1/auth/login')
  //     .send({ email: 'superadmin@pesantren.com', password: 'superadmin123' })
  //     .expect(201);
  // });
});
