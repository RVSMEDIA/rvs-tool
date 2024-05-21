const express = require('express')

const friendsController = require('../controllers/friends.controller');


const friendsRouter = express.Router();

friendsRouter.use( (req, res, next)=>{
    console.log('ip addresss: ', req.ip);
    next();
} );

// create friend using post
friendsRouter.post('/', friendsController.postFriends );
friendsRouter.get('/', friendsController.getFriends);
friendsRouter.get('/:id' , friendsController.getFriendByid);

module.exports = friendsRouter;