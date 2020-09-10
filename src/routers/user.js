const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

// ADD A NEW USER
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(500).send(e);
  }
  // user
  //   .save()
  //   .then(() => {
  //     res.status(201);
  //     res.send(user);
  //   })
  //   .catch((e) => {
  //     res.status(400); // set the status before res.send
  //     res.send(e);
  //   });
});

// LOG IN
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// LOG OUT
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// LOG OUT ALL SESSIONS
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/users/me', auth, async (req, res) => {
  // console.log('req.user', req.user)
  res.send(req.user);
  // User.find({})
  //   .then((users) => {
  //     res.send(users);
  //   })
  //   .catch((e) => {
  //     res.status(500);
  //     res.send(e);
  //   });
});

// UPDATE A SPECIFIC USER
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [ 'name', 'email', 'password', 'age' ];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update])); // dynamic updating
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// DELETE YOUR USER PROFILE
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// UPLOAD(create/update) USER AVATAR IMAGE
const upload = multer({
  // dest: 'avatars',
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('File must be an image'));
    }
    cb(undefined, true);
  }
});
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// DELETE USER AVATAR
router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = undefined; // use undefiend to delete instead of null
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

// GET(read) USER AVATAR (for serving image up to the browser)
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/png'); // set header
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
