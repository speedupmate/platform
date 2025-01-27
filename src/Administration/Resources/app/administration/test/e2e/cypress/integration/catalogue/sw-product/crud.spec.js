// / <reference types="Cypress" />

import ProductPageObject from '../../../support/pages/module/sw-product.page-object';

describe('Product: Test crud operations', () => {
    beforeEach(() => {
        cy.setToInitialState()
            .then(() => {
                cy.loginViaApi();
            })
            .then(() => {
                return cy.createProductFixture();
            })
            .then(() => {
                cy.openInitialPage(`${Cypress.env('admin')}#/sw/product/index`);
            });
    });

    // @deprecated tag:v6.5.0 - Will be removed when "FEATURE_NEXT_12429" feature flag is active
    it('@base @catalogue: create and read product', () => {
        cy.skipOnFeature('FEATURE_NEXT_12429');

        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/product`,
            method: 'post'
        }).as('saveData');
        cy.route({
            url: `${Cypress.env('apiPath')}/_action/calculate-price`,
            method: 'post'
        }).as('calculatePrice');

        // Add basic data to product
        cy.get('a[href="#/sw/product/create"]').click();

        cy.get('input[name=sw-field--product-name]').typeAndCheck('Product with file upload image');
        cy.get('.sw-select-product__select_manufacturer')
            .typeSingleSelectAndCheck('shopware AG', '.sw-select-product__select_manufacturer');

        if (Cypress.isBrowser({ family: 'chromium' })) {
            // Add image to product
            cy.fixture('img/sw-login-background.png').then(fileContent => {
                cy.get('#files').upload(
                    {
                        fileContent,
                        fileName: 'sw-login-background.png',
                        mimeType: 'image/png'
                    }, {
                        subjectType: 'input'
                    }
                );
            });
            cy.get('.sw-product-image__image img')
                .should('have.attr', 'src')
                .and('match', /sw-login-background/);
            cy.awaitAndCheckNotification('File has been saved.');
        }

        // Check net price calculation
        cy.get('select[name=sw-field--product-taxId]').select('Standard rate');
        cy.get('.sw-list-price-field .sw-price-field__gross').eq(0).type('10').type('{enter}');
        cy.wait('@calculatePrice').then(() => {
            cy.get('.sw-list-price-field .sw-price-field__net input').eq(0).should('have.value', '8.4033613445378');
        });
        cy.window().then((win) => {
            cy.get('.sw-purchase-price-field .sw-price-field__gross').eq(0).type('1').type('{enter}');
            cy.wait('@calculatePrice').then(() => {
                cy.get('.sw-purchase-price-field .sw-price-field__net input').should('have.value', '0.84033613445378');
            });
        });

        cy.get('input[name=sw-field--product-stock]').type('100');

        // Set product visible
        cy.get('.sw-product-detail__select-visibility')
            .scrollIntoView();
        cy.get('.sw-product-detail__select-visibility').typeMultiSelectAndCheck('Storefront');
        cy.get('.sw-product-detail__select-visibility .sw-select-selection-list__input')
            .type('{esc}');

        // Check whether the default feature set has been assigned
        cy.get('.sw-product-feature-set-form__form .sw-entity-single-select__selection')
            .scrollIntoView()
            .within(() => {
                // There should be no placeholder
                cy.get('.sw-entity-single-select__selection-text.is--placeholder')
                    .should('not.exist');
                // The default value should be already set instead
                cy.get('.sw-entity-single-select__selection-text')
                    .should('contain', 'Default');
            });

        // Save product
        cy.get(page.elements.productSaveAction).click();
        cy.wait('@saveData').then((xhr) => {
            expect(xhr).to.have.property('status', 204);
        });
        cy.get(page.elements.smartBarBack).click();
        cy.get(`${page.elements.dataGridRow}--0 .sw-data-grid__cell--name`)
            .contains('Product with file upload image');

        // Verify in storefront
        cy.visit('/');
        cy.get('input[name=search]').type('Product with file upload image');
        cy.get('.search-suggest-container').should('be.visible');
        cy.get('.search-suggest-product-name')
            .contains('Product with file upload image')
            .click();

        cy.get('.product-detail-name').contains('Product with file upload image');
        cy.get('.product-detail-price').contains('10.00');
    });

    it('@base @catalogue: create and read product', () => {
        cy.onlyOnFeature('FEATURE_NEXT_12429');

        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/product`,
            method: 'post'
        }).as('saveData');
        cy.route({
            url: `${Cypress.env('apiPath')}/_action/calculate-price`,
            method: 'post'
        }).as('calculatePrice');

        // Add basic data to product
        cy.get('a[href="#/sw/product/create"]').click();

        cy.get('input[name=sw-field--product-name]').typeAndCheck('Product with file upload image');
        cy.get('.sw-select-product__select_manufacturer')
            .typeSingleSelectAndCheck('shopware AG', '.sw-select-product__select_manufacturer');

        if (Cypress.isBrowser({ family: 'chromium' })) {
            // Add image to product
            cy.fixture('img/sw-login-background.png').then(fileContent => {
                cy.get('#files').upload(
                    {
                        fileContent,
                        fileName: 'sw-login-background.png',
                        mimeType: 'image/png'
                    }, {
                        subjectType: 'input'
                    }
                );
            });
            cy.get('.sw-product-image__image img')
                .should('have.attr', 'src')
                .and('match', /sw-login-background/);
            cy.awaitAndCheckNotification('File has been saved.');
        }

        // Check net price calculation
        cy.get('select[name=sw-field--product-taxId]').select('Standard rate');
        cy.get('.sw-list-price-field .sw-price-field__gross input').eq(0).type('10').type('{enter}');
        cy.wait('@calculatePrice').then(() => {
            cy.get('.sw-list-price-field .sw-price-field__net input').eq(0).should('have.value', '8.4033613445378');
        });
        cy.window().then(() => {
            cy.get('.sw-purchase-price-field .sw-price-field__gross input').type('1').type('{enter}');
            cy.wait('@calculatePrice').then(() => {
                cy.get('.sw-purchase-price-field .sw-price-field__net input').should('have.value', '0.84033613445378');
            });
        });

        cy.get('input[name=sw-field--product-stock]').type('100');

        // Set product visible
        cy.get('.sw-product-detail__select-visibility')
            .scrollIntoView();
        cy.get('.sw-product-detail__select-visibility').typeMultiSelectAndCheck('Storefront');
        cy.get('.sw-product-detail__select-visibility .sw-select-selection-list__input')
            .type('{esc}');

        // Save product
        cy.get(page.elements.productSaveAction).click();
        cy.wait('@saveData').then((xhr) => {
            expect(xhr).to.have.property('status', 204);
        });
        cy.get(page.elements.smartBarBack).click();
        cy.get(`${page.elements.dataGridRow}--0 .sw-data-grid__cell--name`)
            .contains('Product with file upload image');

        // Verify in storefront
        cy.visit('/');
        cy.get('input[name=search]').type('Product with file upload image');
        cy.get('.search-suggest-container').should('be.visible');
        cy.get('.search-suggest-product-name')
            .contains('Product with file upload image')
            .click();

        cy.get('.product-detail-name').contains('Product with file upload image');
        cy.get('.product-detail-price').contains('10.00');
    });

    it('@base @catalogue: update and read product', () => {
        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/product/*`,
            method: 'patch'
        }).as('saveData');

        // Edit base data of product
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        cy.get('input[name=sw-field--product-name]').clearTypeAndCheck('What remains of Edith Finch');

        // @deprecated tag:v6.5.0 - Will be removed when "FEATURE_NEXT_12429" feature flag is active because this class is moved
        cy.skipOnFeature('FEATURE_NEXT_12429', () => {
            cy.get('.sw-field--product-active input').click();
        });

        cy.get(page.elements.productSaveAction).click();

        // Verify updated product
        cy.wait('@saveData').then((xhr) => {
            expect(xhr).to.have.property('status', 204);
        });
        cy.get(page.elements.smartBarBack).click();
        cy.get(`${page.elements.dataGridRow}--0 .sw-data-grid__cell--name`)
            .contains('What remains of Edith Finch');
    });

    it('@base @catalogue: delete product', () => {
        const page = new ProductPageObject();

        // Request we want to wait for later
        cy.server();
        cy.route({
            url: `${Cypress.env('apiPath')}/product/*`,
            method: 'delete'
        }).as('deleteData');

        // Delete product
        cy.clickContextMenuItem(
            '.sw-context-menu-item--danger',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );
        cy.get(`${page.elements.modal} .sw-listing__confirm-delete-text`).contains(
            'Are you sure you want to delete this item?'
        );
        cy.get(`${page.elements.modal}__footer ${page.elements.dangerButton}`).click();

        // Verify updated product
        cy.wait('@deleteData').then((xhr) => {
            expect(xhr).to.have.property('status', 204);
        });
        cy.get(page.elements.emptyState).should('be.visible');
    });

    it('@base @catalogue: should be visible advanced mode setting', () => {
        cy.onlyOnFeature('FEATURE_NEXT_12429');

        const page = new ProductPageObject();
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`
        );

        cy.get('.sw-product-settings-mode').should('be.visible');
    });
});
