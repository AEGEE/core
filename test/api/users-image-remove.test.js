const fs = require('fs');
const path = require('path');
const { rimraf } = require('rimraf');

const { startServer, stopServer } = require('../../lib/server');
const { request } = require('../scripts/helpers');
const mock = require('../scripts/mock-core-registry');
const generator = require('../scripts/generator');
const { User } = require('../../models');
const config = require('../../config');

describe('Users image upload', () => {
    let user;

    beforeEach(async () => {
        user = await generator.createUser();
        mock.mockAll();
        await startServer();
    });

    afterEach(async () => {
        await stopServer();
        mock.cleanAll();

        await generator.clearAll();
        rimraf(config.media_dir);
    });

    it ('should remove a file', async () => {
        const res = await request({
            uri: '/members/' + user.id + '/image',
            method: 'DELETE',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('message');

        const userFromDb = await User.findByPk(user.id);

        const oldImgPath = path.join(__dirname, '..', '..', config.media_dir, 'headimages', userFromDb.image);
        expect(fs.existsSync(oldImgPath)).toEqual(false);
    })
});
