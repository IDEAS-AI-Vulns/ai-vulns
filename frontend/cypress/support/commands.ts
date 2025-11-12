Cypress.Commands.add('login', (username: string, password: string) => {
    cy.visit('/');

    cy.get('#loginModal').should('be.visible');
    cy.get('#username')
        .should('be.visible')   // ensure input is visible
        .type(username);
    cy.get('#password')
        .should('be.visible')   // ensure input is visible
        .type(password);
    cy.get('#submit').click();

    cy.get('#loginModal').should('not.exist');
    cy.get('#securityKPIs').should('be.visible');
});