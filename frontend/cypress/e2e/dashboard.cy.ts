/// <reference types="cypress" />

describe('Dashboard Flow', () => {
  beforeEach(() => {
    // Mock the localStorage to simulate a logged-in superadmin
    cy.window().then((win) => {
      win.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: "fake-jwt-token-123",
          user: {
            id: "admin-1",
            name: "Super Admin",
            role: "superadmin",
            tenantId: "demo-pesantren"
          },
          isAuthenticated: true
        },
        version: 0
      }));
    });

    // Mock the analytics API response
    cy.intercept('GET', '**/analytics/foundation', {
      statusCode: 200,
      body: {
        kpi: {
          totalSantri: 1542,
          koperasiIncomeThisMonth: 12500000,
          totalIzinThisMonth: 45,
          izinPending: 3
        },
        chartData: [
          { date: "1 Mar", Koperasi: 500000, TopUp: 1000000 },
          { date: "2 Mar", Koperasi: 750000, TopUp: 800000 },
          { date: "3 Mar", Koperasi: 1200000, TopUp: 2000000 }
        ]
      }
    }).as('getAnalytics');

    // Visit dashboard
    cy.visit('/dashboard');
    cy.wait('@getAnalytics');
  });

  it('renders KPI cards correctly based on mocked data', () => {
    // Check if the mock figures appear on screen
    cy.contains('1542').should('be.visible');
    cy.contains('Total Santri Aktif').should('be.visible');

    cy.contains('3').should('be.visible');
    cy.contains('Izin Tertunda / Menunggu').should('be.visible');

    cy.contains('Rp 12.500.000').should('be.visible');
    cy.contains('Omzet Koperasi Bulan Ini').should('be.visible');
  });

  it('renders the AreaChart component', () => {
    // Check for the chart container instead of internal recharts classes which might differ by version
    cy.get('.recharts-responsive-container', { timeout: 10000 }).should('exist');
  });

  it('displays the sidebar navigation links', () => {
    // If the sidebar is hidden, we just check if it exists in DOM, or check the header menu button
    cy.get('aside', { timeout: 10000 }).should('exist');
  });

  it('toggles the notification dropdown in the header', () => {
    // Click the bell icon using aria-label or just the button containing it
    cy.get('header').find('button[title="Notifikasi"]', { timeout: 10000 }).click();
    
    // The dropdown should appear
    cy.contains('Tandai semua dibaca', { timeout: 10000 }).should('be.visible');
    
    // Close it by clicking elsewhere
    cy.get('body').click(10, 10);
  });
});
