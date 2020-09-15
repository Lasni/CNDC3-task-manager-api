const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

// User 1
const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: 'Name1',
  email: 'email1@gmail.com',
  password: 'testpass1',
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }
  ]
};

// User 2
const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: 'Name2',
  email: 'email2@gmail.com',
  password: 'testpass2',
  tokens: [
    {
      token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
    }
  ]
};

// Task 1
const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Task1',
  completed: false,
  owner: userOneId
};

// Task 2
const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Task2',
  completed: true,
  owner: userOneId
};

// Task 3
const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Task3',
  completed: false,
  owner: userTwoId
};

// Set up a uniform database for every test
const setupDatabase = async () => {
  // Clean up the database first
  await User.deleteMany();
  await Task.deleteMany();
  // Create new users for CRUD testing
  await new User(userOne).save();
  await new User(userTwo).save();
  // Create new tasks for CRUD testing
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOne,
  userOneId,
  userTwo,
  userTwoId,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase
};
