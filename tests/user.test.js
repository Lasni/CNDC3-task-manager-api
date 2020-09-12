const request = require('supertest');
const app = require('../src/app');

test('Should sign up a new user', async () => {
  await request(app)
    .post('/users')
    .send({
      name: 'Grega1',
      email: 'grega1@example.com',
      password: 'testpass1'
    })
    .expect(201);
});
