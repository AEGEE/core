const Flagsmith = require('flagsmith-nodejs'); // nice but less strategies, weirder to selfhost
const { Unleash } = require('unleash-client'); // cumbersome with the proxy thing but seems ok, good to selfhost
const DVC = require('@devcycle/nodejs-server-sdk'); // what the actual fuck to get the flag
const config = require('../config');
const logger = require('./logger');

// NOTE: for all three providers, the choice of environment is
// via the API key (i.e. there's an API key for each env)

/** Flagsmith */

let flagsmith;
if (!flagsmith) {
    flagsmith = new Flagsmith({
        environmentKey: config.flagsmith_token,
    });
    logger.info('Feature Flag: provider flagsmith initialised');
}

/* usage:
var showButton = flags.isFeatureEnabled('secret_button');
var buttonData = flags.getFeatureValue('secret_button');
*/

/** unleash */

let unleash;
if (!unleash) {
    unleash = new Unleash({
        url: config.featureflag_url, // NOT proxy but the :4242/api
        appName: 'Default', // can't change the stupid name in the unleash UI...
        customHeaders: { Authorization: config.featureflag_token },
    });
    logger.info('Feature Flag: provider unleash initialised');
}

/** DevCycle */

let devcycleClient;

async function initializeDevCycle() {
    try {
        devcycleClient = await DVC.initializeDevCycle(config.devcycle_token).onClientInitialized();
        logger.info('Feature Flag: provider DVC initialised');
    } catch (ex) {
        return logger.error(`Error initializing DevCycle: ${ex}`);
    }
}

if (!devcycleClient) initializeDevCycle();

function returnDVCVariable(feature, user = null) {
    // The user data must be passed into every method, only the user_id is required
    const userDescription = user || {
        user_id: 'user1@devcycle.com', // whatever name or ID works
        name: 'user 1 name',
        customData: {
            customKey: 'customValue'
        }
    };

    // Fetch variable values using the identifier key coupled with a default value
    // The default value can be of type string, boolean, number, or object
    const dvcVariableValue = devcycleClient.variableValue(userDescription, feature, false);
    return dvcVariableValue;
}

async function isFFEnabled(feature, engine = 'flagsmith') {
    switch (engine) {
    case 'dvc':
        return returnDVCVariable(feature);
    case 'unleash':
        return unleash.isEnabled(feature);
    default:
        // eslint-disable-next-line no-case-declarations
        const flags = await flagsmith.getEnvironmentFlags();
        return flags.isFeatureEnabled(feature);
    }
}

module.exports = isFFEnabled;
