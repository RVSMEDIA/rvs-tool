const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser')


// Read data from the data.json file
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
const data = JSON.parse(fs.readFileSync('data.json'));
app.set('view engine', 'hbs');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Get all users
app.get('/all', (req, res) => {
  // res.send(data.users);
  res.render('users/index', {
    users: data.users,
  });
});
app.get('/users', (req, res) => {
  // res.send(data.users);
  res.render('users/create', {
    users: data.users,
  });
});

// Get a single user by id
app.get('/users/:id', (req, res) => {
  const user = data.users.find(u => u.id === parseInt(req.params.id));

  res.render('users/edit', {
    user: user,
  });

  // if (!user) return res.status(404).send('User not found');
  // res.json(user);
});

// Create a new user
app.post('/users', (req, res) => {
    // res.send(req.body.email);
  const newUser = {
    id: data.users.length + 1,
    email: req.body.email,
    name: req.body.name,
  };
  data.users.push(newUser);
  fs.writeFileSync('data.json', JSON.stringify(data));
  res.json(newUser);
});

// Update an existing user by id
app.post('/users/:id', (req, res) => {
  const user = data.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).send('User not found');
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  fs.writeFileSync('data.json', JSON.stringify(data));
  res.json(user);
});

// Delete an existing user by id
app.post('/users-delete/:id', (req, res) => {
  // res.send('ddd ggg');
  const userIndex = data.users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) return res.status(404).send('User not found');
  data.users.splice(userIndex, 1);
  fs.writeFileSync('data.json', JSON.stringify(data));
  res.send('User deleted successfully');
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
