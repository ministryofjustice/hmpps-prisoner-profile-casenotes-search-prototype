# hmpps-prisoner-profile-casenotes-search-prototype
[![repo standards badge](https://img.shields.io/badge/dynamic/json?color=blue&style=flat&logo=github&label=MoJ%20Compliant&query=%24.result&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-prisoner-profile-casenotes-search-prototype)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#hmpps-prisoner-profile-casenotes-search-prototype "Link to report")
[![CircleCI](https://circleci.com/gh/ministryofjustice/hmpps-prisoner-profile-casenotes-search-prototype/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/hmpps-prisoner-profile-casenotes-search-prototype)


## Running the app
The easiest way to run the app is to use docker compose to run a local instance of Open Search and to use other dependencies from the dev environment.

There is an example .env file [here](.env.template) which can be copied to a new file called `.env` and updated with the correct values.

`docker compose pull`

`docker compose up`

### Dependencies
The app requires: 
* hmpps-auth - for authentication
* redis - session store and token caching

### Running the app for development

You will need to seed the local running open search with some data. This can be done by:

* creating an index and adding dummy data by following the procedure [here](https://dsdmoj.atlassian.net/wiki/spaces/ALIGN/pages/4664655877/Case+Notes+Search+Prototype#Real-Queries-with-Example-Case-Notes) 

Install dependencies using `npm install`, ensuring you are using `node v18.x` and `npm v9.x`

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the CircleCI build config.

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db and wiremock instance by:

`docker compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`
 
Or run tests with the cypress UI:

`npm run int-test-ui`

## Change log

A changelog for the service is available [here](./CHANGELOG.md)


## Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`
