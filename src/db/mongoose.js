const mongoose = require('mongoose');

// mongoose connects to the back-end database
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true, // deprecation warning
  useFindAndModify: false, // deprecation warning
});

