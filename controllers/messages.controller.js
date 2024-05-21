const path = require('path');

function getMessages(req, res) {
    // path.join(__dirname,'..' ,'uploads', '7.jpg');
    res.sendFile( path.join(__dirname,'..' ,'uploads', '7.jpg') );
    // res.send('<ul><li>hello.... </li></ul>');
}

function postMessages(req, res) {
    res.send('<ul><li>updating messages.... </li></ul>');
}

async function fetch_data(req, res) {
    res.send('<ul><li>updating messages.... </li></ul>');
}

module.exports = {
    getMessages,
    postMessages,
    fetch_data,
}