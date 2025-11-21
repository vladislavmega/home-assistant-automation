const axios = require('axios');
const moment = require('moment');
const express = require('express');
const router = express.Router();

moment.locale('uk');

const state = {
    status: 'na',
    lastChange: new Date(),
    nextConnectivity: 'unknown',
    nextOutage: 'unknown',
    nextPossibleOutage: 'unknown',
    yasnoStatus: 'unknown'
}

const getState = () => {
    let nextEvent = '';

    if (state.status === 'available') {
        nextEvent = state.nextOutage;
    } else if (state.status === 'na') {
        nextEvent = state.nextConnectivity;
    } else {
        nextEvent = 'unknown';
    }

    // hide shit
    if (nextEvent === 'unknown') { 
        nextEvent = '';
    } else {
        const eventName = (state.status === 'available') ? 'Відключення' : 'Підключення';
        nextEvent = `${eventName} о ${moment(nextEvent).format('HH:mm')}`;
    }

    let statusText = ''
    if (state.status === 'available') {
        statusText = 'Є ДТЕК';
    }

    if (state.status === 'na' && state.yasnoStatus === 'outage') {
        statusText = 'НЕМА ДТЕК';
    }

    if (state.status === 'na' && state.yasnoStatus !== 'outage') {   
        statusText = 'МОЖЛИВО ВИБИЛО';
    }

    return {
        ...state,
        nextEvent,
        statusText,
    }
};

const HA_URL = "http://homeassistant.local:8123"; // або http://192.168.1.x:8123
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZGVlOWMzNGIxMDA0Y2I3ODRkZDQxZTI3ZDQ5YWQ4MiIsImlhdCI6MTc2MTM5MTUzMiwiZXhwIjoyMDc2NzUxNTMyfQ.4M4ej7q2OxwJEtyQ1GVjO-yULdq7G8hXLhml_DV6j60"

async function getEntityState(entityId) {
    return await axios.get(`${HA_URL}/api/states/${entityId}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    })
}

const getStatus = async () => {
    await axios
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

        try {
            await getEntityState('sensor.yasno_kiiv_dtek_4_2_next_connectivity')
                    .then((response) => {
                        state.nextConnectivity = response.data.state;
                    })

            await getEntityState('sensor.yasno_kiiv_dtek_4_2_next_planned_outage')
                .then((response) => {
                    state.nextOutage = response.data.state;
                })

            await getEntityState('sensor.yasno_kiiv_dtek_4_2_next_probable_outage')
                .then((response) => {
                    state.nextPossibleOutage = response.data.state;
                })

            await getEntityState('sensor.yasno_kiiv_dtek_4_2_electricity')
                .then((response) => {
                    state.yasnoStatus = response.data.state;
                })
                console.log('done')
        } catch (error) {
            console.error('Error fetching entity states:', error);
        }
}

setInterval(async () => {
    // getEntityState('592b54f71af7da09a48919a7cbcc8143')
    await getStatus();
}, 60000);

getStatus();
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        ...getState(),
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

router.get('/home', function (req, res, next) {
    console.log(req.query)
    const yellow = (req.query?.yellow === '1') ? 'yellow' : ''

    res.render('home', {
        ...getState(),
        yellow,
        lastChange: moment(state.lastChange).format('HH:mm DD-MM')
    });
});

router.get('/state', function (req, res, next) {
    res.send({
        ...getState(),
        lastChange: moment(state.lastChange).format('HH:mm D MMMM')
    });
});

// router.get('/phonecamera/params', async function (req, res, next) {
//     const url = `http://192.168.88.18/parameters`
//     try {
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error(`Response status: ${response.status}`);
//         }
//         const json = await response.json();
//         res.send(json)
//     } catch (error) {
//         res.send(error.message)
//     }
// })

// router.get('/phonecamera/torch/:value', async function (req, res, next) {
//     console.log(req.params.value);
//     const url = `http://192.168.88.18/parameters?torch=${req.params.value}`
//     try {
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error(`Response status: ${response.status}`);
//         }
//         const json = await response.json();
//         res.send(json)
//     } catch (error) {
//         res.send(error.message)
//     }
// })

module.exports = router;
