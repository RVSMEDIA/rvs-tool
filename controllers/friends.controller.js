const model = require('../models/friends.model');

function getFriends(req, res) {
    res.send(model);
} 

function postFriends(req, res)  {

    if(!req.body.name){
       return res.status(400).json({
            error: 'Missing friend name'
        });
    }

    const newFriend = {
        name: req.body.name,
        id: model.length
    }
    
    model.push(newFriend);
    res.json(newFriend);

}


function getFriendByid(req, res) {
    const id = Number(req.params.id);
    const fd = model[id]
    if(fd){
        res.status(200).json(fd);
    }else{
        res.status(404).json({
            error: 'user not found',
        });
    }
} 

module.exports = {
    getFriends,
    postFriends,
    getFriendByid,
}