const { send } = require('@sendgrid/mail');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.js');
const { userOne, userOneId, setupDatabase } = require('./fixtures/db');
const sleep = require('util').promisify(setTimeout);

// Wipe the database before running tests
beforeEach(setupDatabase);

test('Should sign up a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Grega1',
      email: 'grega1@example.com',
      password: 'testpass1'
    })
    .expect(201);
  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();
  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Grega1',
      email: 'grega1@example.com'
    },
    token: user.tokens[0].token
  });
  // Assert that the plaintext password is not stored in the database
  expect(user.password).not.toBe('testpass1');
});

test('Should log in existing user', async () => {
  await sleep(800); // used to avoid a case where it saves two of the same tokens
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200);
  // Assert that new token is saved
  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not log in nonexsistent user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'nonexistent@gmail.com',
      password: 'nonexsistentpassword'
    })
    .expect(400);
});

test('Should get profile for user', async () => {
  await request(app).get('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send().expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app).get('/users/me').send().expect(401);
});

test('Should delete account for user', async () => {
  await request(app).delete('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send().expect(200);
  // Assert that the user was removed
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  await request(app).delete('/users/me').send().expect(401);
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
  const response = await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'updatedName'
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.name).toBe(response.body.name);
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      profession: 'programmer'
    })
    .expect(400);
});

test('Should not signup user with invalid email', async () => {
  await request(app)
    .post('/users')
    .send({
      email: 'invalid.email.com'
    })
    .expect(400);
});

test('Should not sign up user with invalid password', async () => {
  await request(app)
    .post('/users')
    .send({
      password: 'invalidpassword'
    })
    .expect(400);
});

test('Should not update user if unauthenitcated', async () => {
  await request(app)
    .patch('/users/me')
    .send({
      name: 'unauthenticatedUser'
    })
    .expect(401);
});

test('Should not update user with invalid email', async () => {
  const response = await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      email: 'invalid.email.com'
    })
    .expect(400);
  const user = User.findById(userOneId);
  expect(user.email).not.toEqual('invalid.email.com');
});

test('Should not update user with invalid password', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      password: 'invalidpassword'
    })
    .expect(400);
  const user = User.findById(userOneId);
  expect(user.password).not.toEqual('invalidpassword');
});

test('Should not delete user if unauthenticated', async () => {
  await request(app).delete('/users/me').send().expect(401);
});
