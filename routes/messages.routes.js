const express = require('express')

const messageController = require('../controllers/messages.controller');

const messageRouter = express.Router();

messageRouter.post('/', messageController.postMessages );
messageRouter.get('/', messageController.getMessages );
messageRouter.post('/data', messageController.fetch_data );

module.exports = messageRouter;
