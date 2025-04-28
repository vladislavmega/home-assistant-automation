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
    console.log(req.query)
    const yellow = (req.query?.yellow === '1') ? 'yellow' : ''

    res.render('home', {
        ...state,
        yellow,
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

router.get('/state', function (req, res, next) {
    res.send({
        ...state,
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

router.get('/phonecamera', function (req, res, next) {
    res.render('phonecamera', {

    })
})

router.get('/phonecamera/params', async function (req, res, next) {
    const url = `http://192.168.88.18/parameters`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        res.send(json)
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/phonecamera/torch/:value', async function (req, res, next) {
    console.log(req.params.value);
    const url = `http://192.168.88.18/parameters?torch=${req.params.value}`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        res.send(json)
    } catch (error) {
        res.send(error.message)
    }
})

module.exports = router;
