/*
 * Copyright 2020 SkillTree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';
import './cliend-display-commands';
import 'cypress-file-upload';
import LookupUtil from "./LookupUtil.js";

addMatchImageSnapshotCommand();

Cypress.Commands.add("register", (user, pass, grantRoot) => {
    return cy.request(`/app/users/validExistingDashboardUserId/${user}`)
        .then((response) => {
            if (response.body !== true) {
                cy.log(`Creating user [${user}]`)
                cy.request('PUT', '/createAccount', {
                    firstName: 'Firstname',
                    lastName: 'LastName',
                    email: user,
                    password: pass,
                });
                if (grantRoot) {
                    cy.request('POST', '/grantFirstRoot');
                }
                cy.request('POST', '/logout');
            } else {
                cy.log(`User [${user}] already exist`)
            }
        });
});

Cypress.Commands.add("login", (user, pass) => {
    cy.request( {
        method: 'POST',
        url: '/performLogin',
        body: {
            username: user,
            password: pass
        },
        form: true,
    })
});

Cypress.Commands.add("resetEmail", () => {
    cy.request({
       method: "DELETE",
       url: "http://localhost:1081/api/emails"
    });
});

Cypress.Commands.add("getResetLink", () => {
    cy.request({
        "method":"GET",
        "url": "http://localhost:1081/api/emails"
    }).then((response) => {
        if (response.isOkStatusCode && response.body) {
            const localPart = /[http(?:s)?:\/\/^[:]+:\d+\/([^"]+)]/
            const match = response.body[0].text.match(localPart)
            if(match) {
                return match[1]
            }
            return '';
        } else {
            return '';
        }
    });
});

Cypress.Commands.add("logout", () => {
    cy.request('POST', '/logout');
});

Cypress.Commands.add("clickSave", () => {
    cy.get("button:contains('Save')").click();
});

Cypress.Commands.add("clickButton", (label) => {
    cy.get(`button:contains('${label}')`).click();
});

Cypress.Commands.add("getIdField", () => {
    return cy.get("#idInput");
});


Cypress.Commands.add("setResolution", (size) => {
    if (size !== 'default') {
        if (Cypress._.isArray(size)) {
            cy.viewport(size[0], size[1]);
        } else {
            cy.viewport(size);
        }
        cy.log(`Set viewport to ${size}`);
    } else {
        cy.log(`Using default viewport`);
    }
});

Cypress.Commands.add('vuex', () => {
   return cy.window().its('vm.$store');
});

//see cypress-io #7306
Cypress.Commands.add('get$', (selector) => {
   return cy.wrap(Cypress.$(selector)).should('have.length.gte', 1);
});

Cypress.Commands.add('resetDb', () => {
    const db = LookupUtil.getDb();

    // first call to npm fails, looks like this may be the bug: https://github.com/cypress-io/cypress/issues/6081
    cy.exec('npm version', {failOnNonZeroExit: false})
    if (db && db === 'postgres') {
        cy.exec('npm run backend:resetDb:postgres')
    } else {
        cy.exec('npm run backend:resetDb')
    }
});

Cypress.Commands.add('clearDb', () => {
    const db = LookupUtil.getDb();

    // first call to npm fails, looks like this may be the bug: https://github.com/cypress-io/cypress/issues/6081
    cy.exec('npm version', {failOnNonZeroExit: false})
    if (db && db === 'postgres') {
        cy.exec('npm run backend:clearDb:postgres')
    } else {
        cy.exec('npm run backend:clearDb')
    }
});

Cypress.Commands.add('clickNav', (navName) => {
    cy.get(`[data-cy=nav-${navName}]`).click()
});

Cypress.Commands.add('reportHistoryOfEvents', (projId, user, numDays=10, skipWeeDays = [5,6], availableSkillIds=['skill1', 'skill2', 'skill3']) => {
    let skipDays = [...skipWeeDays];
    for(let daysCounter=0; daysCounter < numDays; daysCounter++) {
        let toSkip = false;
        skipDays.forEach((skipNum, index) => {
            if(daysCounter === skipNum) {
                toSkip = true;
                skipDays[index] += 7;
            }
        });
        if(toSkip) {
            continue;
        }

        const time = new Date().getTime() - (daysCounter)*1000*60*60*24;
        const numSkillsToReport = Math.random() * (availableSkillIds.length-1);
        for(let skillsCounter=0; skillsCounter < numSkillsToReport; skillsCounter++) {
            const skillId = availableSkillIds[skillsCounter];
            cy.request('POST', `/api/projects/${projId}/skills/${skillId}`, {userId: user, timestamp: time})
        }
    }
});
