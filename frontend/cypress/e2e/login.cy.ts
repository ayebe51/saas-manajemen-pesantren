/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Navigate to the login page before each test
    cy.visit('/login');
    // Clear localStorage to ensure a clean state
    cy.clearLocalStorage();
  });

  it('renders the login page correctly', () => {
    cy.get('h1').contains('Login Admin');
    cy.get('p').contains('Gunakan 6-digit PIN Superadmin Anda');
    // Check if the 6 digit inputs exist
    cy.get('input[type="password"]').should('have.length', 6);
  });

  it('shows an error toast for incorrect PIN', () => {
    // Intercept login failure
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'PIN salah' }
    }).as('loginFail');

    const wrongPin = '000000';
    for (let i = 0; i < wrongPin.length; i++) {
      cy.get('input[type="password"]').eq(i).type(wrongPin[i]);
    }
    
    cy.wait('@loginFail');
    // We check if toast is in the DOM. Not asserting visibility is safer due to CSS animations
    cy.contains('PIN salah', { timeout: 10000 }).should('exist');
  });

  it('successfully logs in with the correct Superadmin PIN', () => {
    const correctPin = '123456'; 

    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token-123',
        user: { id: 'admin-1', name: 'Super Admin', role: 'superadmin', tenantId: 'demo' }
      }
    }).as('loginSuccess');

    for (let i = 0; i < correctPin.length; i++) {
      cy.get('input[type="password"]').eq(i).type(correctPin[i]);
    }

    cy.wait('@loginSuccess');
    cy.url().should('include', '/dashboard');
  });
});
