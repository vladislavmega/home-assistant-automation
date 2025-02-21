const axios = require('axios');
const moment = require('moment');
const express = require('express');
const router = express.Router();

const state = {
    status: 'na',
    lastChange: new Date()
}

const getStatus = () => {
    axios
        .get(`http://192.168.88.25`, {
            timeout: 1000 * 5,
        })
        .then(() => {
            if (state.status === 'na') {
                state.lastChange = new Date();
            }
            state.status = 'available';
        })
        .catch(() => {
            if (state.status === 'available') {
                state.lastChange = new Date();
            }
            state.status = 'na';
        })
}

setInterval(() => {
    getStatus();
}, 60000);


getStatus();
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        ...state,
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

router.get('/home', function (req, res, next) {
    res.render('home', {
        ...state,
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

router.get('/state', function (req, res, next) {
    res.send({
        ...state,
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

module.exports = router;
