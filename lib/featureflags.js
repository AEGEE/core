const Flagsmith = require('flagsmith-nodejs'); // nice but less strategies, weirder to selfhost
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

async function isFFEnabled(feature) {
    const flags = await flagsmith.getEnvironmentFlags();
    return flags.isFeatureEnabled(feature);
}

module.exports = isFFEnabled;
