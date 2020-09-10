const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

app.use(express.json()); // automatically parse incoming JSON (req) into an object
app.use(userRouter, taskRouter);

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
