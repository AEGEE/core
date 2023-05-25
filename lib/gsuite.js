const request = require('request-promise-native');

const config = require('../config');

async function postAccount(options) {
    const gsuiteBody = await request({
        url: config.gsuiteWrapper.url + ':' + config.gsuiteWrapper.port + '/',
        method: 'POST',
        simple: false,
        json: true,
        body: {
        }
    });

    if (typeof gsuiteBody !== 'object') {
        throw new Error('Malformed response from gsuiteWrapper: ' + gsuiteBody);
    }

    if (!gsuiteBody.success) {
        throw new Error('Unsuccessful response from gsuiteWrapper: ' + JSON.stringify(gsuiteBody));
    }

    return gsuiteBody;
}

async function editAccount(options) {
    const gsuiteBody = await request({
        url: config.gsuiteWrapper.url + ':' + config.gsuiteWrapper.port + '/accounts/' + options.gsuite_id,
        method: 'PUT',
        simple: false,
        json: true,
        body: {
            // Body should be flexible, sometimes it is the password, or the name or something else
            // Should always have at least 1 field
        }
    });

    if (typeof gsuiteBody !== 'object') {
        throw new Error('Malformed response from gsuiteWrapper: ' + gsuiteBody);
    }

    if (!gsuiteBody.success) {
        throw new Error('Unsuccessful response from gsuiteWrapper: ' + JSON.stringify(gsuiteBody));
    }

    return gsuiteBody;
}

module.exports = {
    postAccount,
    editAccount
};

/*
const gsuiteEmail = req.body.first_name + '.' + req.body.last_name + '@' + constants.GSUITE_DOMAIN;
const payload = {
    primaryEmail: gsuiteEmail.toLowerCase().replace(' ', ''),
    name: {
        givenName: req.body.first_name,
        familyName: req.body.last_name
    },
    secondaryEmail: req.body.email,
    password: crypto.createHash('sha1').update(JSON.stringify(req.body.password)).digest('hex'),
    userPK: req.body.username,
    antenna: 'Undefined-yet'
};

// Adding a person to a body if campaign has the autojoin body.
if (campaign.autojoin_body_id) {
    await BodyMembership.create({
        user_id: user.id,
        body_id: campaign.autojoin_body_id
    }, { transaction: t });

    payload.antenna = campaign.autojoin_body_id;
}

await request({
    url: config.gsuiteWrapper.url + ':' + config.gsuiteWrapper.port + '/accounts',
    method: 'POST',
    json: true,
    body: payload
});

const confirmation = await MailConfirmation.createForUser(user.id, t);

await mailer.sendMail({
    to: user.notification_email,
    subject: constants.MAIL_SUBJECTS.MAIL_CONFIRMATION,
    template: 'confirm_email.html',
    parameters: {
        name: user.first_name,
        surname: user.last_name,
        token: confirmation.value
    }
});
*/

// Part 1 implements the various features from GSuiteWrapper into a core class
// It possibly also mocks tests for them (but they are not put in any existing tests yet)
// What will happen in part 2 is that the features are combined in the core (and added to existing tests)

// TODO in Part 1 (all in one PR but probably multiple commits depending on the features):
// Make module with wrapper functions
// Add mocking
// Add mock tests

// TODO in Part 1.5ish (can also be 2.5 if needed):
// Update password generation to something better, also do that in gsuite-wrapper itself

// TODO in Part 2 (this is made after Part 1 is merged and consists of various PRs depending on the features):
// Add validation to the gsuite_id that checks if it does not exist in either body, circle or user
// Add transliteration to creation of GSuite account
// Add functions to existing code in core
// Update existing tests
// Add tests with new workflows

// Wrapper functions to be supported
// Accounts
// DELETE singular account (not yet supported by GsuiteWrapper)
// POST account (antenna/contact antenna) (not yet supported by GsuiteWrapper)
// POST account (contact, difference is in the name) (not yet supported by GsuiteWrapper)
// POST account (user)
// Above three things might use nested functions, one to connect with the actual GSuiteWrapper and some helper functions to determine specific payload things
// PUT account to update information (all cases)
// PUT account to suspend (not yet supported by GsuiteWrapper)
// PUT account to activate (not yet supported by GsuiteWrapper)

// POST /account createAccount
// PUT /account/:userPK editAccount

// Think about where in core it should fit
// Checking if users have permission for an active GSuite account

// Other things to keep in mind:
// Check what happens to data/files of deleted users, maybe suspend them first and add deletion later
// Check with CD which users should have an active GSuite account and later seperate Shared Drive access

// Before this all; ALMOST NOTHING IS FULLY IMPLEMENTED OR TESTED IN GSUITEWRAPPER ATM (so I'll have to do that as well, fun times)
// Start with account creation, updating and suspending/activation of real users
// Then possibly do account things for locals (but maybe wait until Google Group things)
// Then allow manually inputting Gsuite Groups and Shared Drives to circles
// Then sync those inputted groups with the members and shared drives with the groups
// TODO: Think of default user permissions, everybody content manager at first? Then update manually if other wishes
// Then event sync probably

/**
 * @swagger
 *
 * /account:
 *   post:
 *     tags:
 *       - "Account"
 *     summary: "Create user account"
 *     description: "This endpoint is to create a deactivated Gsuite \
 *                   account. It will be activated at a later stage \
 *                   during the registration process"
 *     operationId: "createAccount"
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - name: "data"
 *         in: "body"
 *         description: "User account object"
 *         required: true
 *         schema:
 *           $ref: "#/definitions/Account"
 *     responses:
 *       201:
 *         description: "Successful operation"
 *       400:
 *         description: "Invalid input"
 *       409:
 *         description: "Duplicate entity"
 */

/*
    const payload = {
      suspended: true,
      primaryEmail: data.primaryEmail,
      name: data.name,
      password: data.password,
      hashFunction: 'SHA-1',
      recoveryEmail: data.secondaryEmail,
      emails: [
        {
          address: data.secondaryEmail,
          type: 'home',
          customType: '',
          primary: true,
        },
      ],
      organizations: [
        {
          department: data.antenna,
        },
      ],
      orgUnitPath: '/individuals',
      includeInGlobalAddressList: true,
    };

    try {
      let result = await runGsuiteOperation(gsuiteOperations.addAccount, payload);
      response = {success: result.success, message: result.data.primaryEmail + ' account has been created', data: result.data };
      statusCode = result.code;

      redis.hset('user:' + data.userPK, 'GsuiteAccount', data.primaryEmail, 'SecondaryEmail', data.secondaryEmail);
      redis.set('primary:' + data.userPK, data.primaryEmail);
      redis.set('primary:' + data.secondaryEmail, data.primaryEmail);
      redis.set('id:' + data.primaryEmail, data.userPK);
      redis.set('secondary:' + data.primaryEmail, data.secondaryEmail);

    } catch (GsuiteError){
      log.warn('GsuiteError');
      response = {success: false, errors: GsuiteError.errors, message: GsuiteError.errors[0].message };
      statusCode = GsuiteError.code;
    }
*/

/**
 * @swagger
 *
 * /account/{personPK}:
 *   put:
 *     description: Edit an user account
 *     tags:
 *       - Account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: personPK
 *         description: The primary key of the gsuite user
 *         in: path
 *         required: true
 *         type: string
 *       - name: secondaryEmail
 *         description: The user's new alternative email (i.e. the one they used to register on MyAEGEE)
 *         in: body
 *         required: false
 *         type: string
 *       - name: password
 *         description: The password hashed in a SHA-1 format
 *         in: body
 *         required: false
 *         type: string
 *       - name: antennae # FIXME
 *         description: The antenna of the user
 *         in: body
 *         required: false
 *         type: string
 *       - name: givenName
 *         description: Name of the user
 *         in: body
 *         required: false
 *         type: string
 *       - name: familyName
 *         description: Surname of the user
 *         in: body
 *         required: false
 *         type: string
 *       - name: photoData
 *         description: A web-safe base64 representation of the image
 *         in: body
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: The user is created (deactivated)
 *         schema:
 *           '$ref': '#/definitions/successResponse'
 *       400:
 *         description: Validation error
 *         schema:
 *           '$ref': '#/definitions/generalResponse'
 *       500:
 *         description: Internal error
 *         schema:
 *           '$ref': '#/definitions/errorResponse'
 */

/*
    const removeEmpty = (obj) => {
      Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]);
      return obj;
    };

    const payload = removeEmpty(Object.assign(
      {},
      data,
      {hashFunction: data.password ? 'SHA-1' : null},
      {emails: data.secondaryEmail ? [
        {
          address: data.secondaryEmail,
          type: 'home',
          customType: '',
          primary: true,
        },
      ] : null},
      {organizations: data.antennae ? [ { department: data.antennae.toString() } ] : null},
    ));

      try {
        let result = await runGsuiteOperation(gsuiteOperations.editAccount, payload);
        response = {success: result.success, message: result.data[0].primaryEmail + ' account has been updated', data: result.data };
        statusCode = result.code;
      } catch (GsuiteError){
        log.warn('GsuiteError');
        response = {success: false, errors: GsuiteError.errors, message: GsuiteError.errors[0].message };
        statusCode = GsuiteError.code;
      }
*/
