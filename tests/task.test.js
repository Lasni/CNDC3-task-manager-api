const request = require('supertest');
const Task = require('../src/models/task.js');
const app = require('../src/app');
const { userOne, setupDatabase, userTwo, taskOne } = require('./fixtures/db');
const { send } = require('@sendgrid/mail');

// Wipe the database before running tests
beforeEach(setupDatabase);

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'From my task test'
    })
    .expect(201);
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});

test('Should fetch all tasks for userOne', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(2);
});

test('Should not delete task by unauthorized user', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test('Should not create task with no description', async () => {
  await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: ''
    })
    .expect(400);
});

test('Should not create task with completed=true', async () => {
  await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      completed: true
    })
    .expect(400);
});

test('Should not update task with no description', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: ''
    })
    .expect(400);
  const task = Task.findById(taskOne._id);
  expect(task.description).not.toEqual('');
});

test('Should delete user task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const task = await Task.findById(taskOne._id);
  expect(task).toBeNull();
});

test('Should not delete task if unauthenticated', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

test('Should not update other users task', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send({
      description: "can't update other user's task",
      completed: true
    })
    .expect(404);
  const task = await Task.findById(taskOne._id);
  expect(task.description).not.toEqual("can't update other user's task");
});

test('Should fetch user task by id', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.description).toEqual(taskOne.description);
});

test('Should not fetch user task by id if unauthenticated', async () => {
  await request(app).get(`/tasks/${taskOne._id}`).send().expect(401);
});

test('Should not fetch other users task by id', async () => {
  await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test('Should fetch only completed tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
  expect(response.body[0].completed).toEqual(true);
});

test('Should fetch only incomplete tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
  expect(response.body[0].completed).toEqual(false);
});

test('Should sort tasks by description', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=description:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body[0].description).toEqual('Task2');
});

test('Should sort tasks by createdAt', async () => {
  const response = await request(app)
    .get('/tasks?sortBy=createdAt:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body[0].description).toEqual('Task2');
});

test('Should sort tasks by updatedAt', async () => {
  // update the first task
  await Task.findByIdAndUpdate(taskOne._id, { description: 'Updated Task1' });
  // test it out
  const response = await request(app)
    .get('/tasks?sortBy=updatedAt:desc')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body[0].description).toEqual('Updated Task1');
});

test('Should fetch 1 page of tasks', async () => {
  const response = await request(app)
    .get('/tasks?limit=1')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(1);
});
