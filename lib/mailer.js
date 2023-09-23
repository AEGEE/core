const request = require('request-promise-native');
const amqp = require('amqplib/callback_api');
const logger = require('./logger');
const isFFEnabled = require('./featureflags');
const config = require('../config');

/**
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {object} options.reply_to
 * @param {string} options.subject
 * @param {string} options.template
 * @param {object} options.parameters
 */
const sendMail = async (options) => {
    logger.error('into old mailer');
    const mailerBody = await request({
        url: config.mailer.url + ':' + config.mailer.port + '/',
        method: 'POST',
        simple: false,
        json: true,
        body: {
            to: options.to,
            reply_to: options.reply_to,
            subject: options.subject,
            template: options.template,
            parameters: options.parameters
        }
    });

    if (typeof mailerBody !== 'object') {
        throw new Error('Malformed response from mailer: ' + mailerBody);
    }

    if (!mailerBody.success) {
        throw new Error('Unsuccessful response from mailer: ' + JSON.stringify(mailerBody));
    }

    return mailerBody;
};

const queue = 'email';
const enqueuer = async (options) => {
    amqp.connect('amqp://rabbit', (error0, connection) => {
        if (error0) {
            throw error0;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1;
            }

            const msg = {
                from: 'mailer@aegee.eu', // it was auto-set in mailer, here we must set it
                to: options.to,
                reply_to: options.reply_to || 'noreply@aegee.eu', // FIXME
                subject: options.subject,
                template: options.template,
                parameters: options.parameters,
            };

            // channel.assertQueue(queue, {
            //     durable: true,
            //     'x-dead-letter-exchange': 'dead_letter_exchange'
            // });

            channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
            logger.info(' [x] Sent %s', msg);
        });
        setTimeout(() => {
            connection.close();
        }, 500);
        return { response: { success: true } }; // TODO: handle rabbit issues
    });
};

// This function is in order to bypass the fact that one can't
// change the export at runtime
const sender = async (options) => {
    if (await isFFEnabled('new_mailer')) {
        logger.info('Experimental: new mailer');
        options.template = options.template.replace('.html', ''); // the dispatcher adds the extension
        const thevalue = await enqueuer(options);
        return thevalue;
    }
    const thevalue = await sendMail(options);
    return thevalue;
};

module.exports.sendMail = sender;
