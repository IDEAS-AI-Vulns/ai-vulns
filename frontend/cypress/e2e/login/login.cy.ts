describe('template spec', () => {
  it('Should login user after providing user and password', () => {
    cy.login('admin', 'password123');
  });

  it('Should login user after providing user and password', () => {
    // 1. Visit your Angular app on a specific link
    cy.visit('/'); // replace with your route, e.g. '/dashboard'

    cy.get('#loginModal').should('not.exist');
    cy.get('#securityKPIs').should('be.visible');
  });
})