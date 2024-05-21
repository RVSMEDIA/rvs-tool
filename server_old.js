const express = require('express');

const messageController = require('./controllers/messages.controller');
const friendsController = require('./controllers/friends.controller');

const app = express();

const PORT = 3000;

// middleware
app.use((req, res, next) => {
    const start = Date.now();
    next();
    //actions go here......
    const delta = Date.now() - start;
    console.log(`${req.method} ${req.url}  ${delta}ms `);

})

app.use(express.json());

// create friend using post
app.post('/friends', friendsController.postFriends );

app.get('/friends', friendsController.getFriends);

app.get('/friends/:id' , friendsController.getFriendByid);


app.get('/', (req, res) => {
    res.send({
        id: 1,
        name: 'This is Dev'
    });
});


app.get('/messages', messageController.getMessages )

app.listen(PORT, () => {
    console.log(`Listing on ${PORT} .....`);
} )