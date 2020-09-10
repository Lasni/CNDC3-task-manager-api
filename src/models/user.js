const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error('Age must be a positive number');
        }
      }
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Email is invalid');
        }
      }
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length <= 6) {
          throw new Error('Password must be at least 7 characters long');
        }
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password must not include the word "password"');
        }
      }
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    avatar: {
      type: Buffer
    }
  },
  {
    timestamps: true
  }
);

// virtual property (relationship between two entities - User and Task)
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

// instance methods are accessible on the instances (user)
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user.id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

// static methods are accessible on the model (User)
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
};

// Hash the plaintext password before saving
userSchema.pre('save', async function(next) {
  // must be a standard function
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Delete user's tasks when user is removed
userSchema.pre('remove', async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
