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
    yasnoStatus: 'unknown',
    plannedState: '',
    ips: '',
    battery: '',
}

const getIps = async () => {
    const ipInfoUrl = 'https://ipinfo.io/?token=0846ac66067f27';
    try {
        const respsons = await axios.get(ipInfoUrl, { timeout: 5000 });
        const ispSource = respsons.data;
        const hostname = (ispSource.hostname || "").toLowerCase();
        const org = (ispSource.org || "").toLowerCase();
    
        if (hostname.includes("starlink") || org.includes("starlink")) {
            state.ips = "📡 Starlink";
        } else if (org.includes("lifecell")) {
            state.ips = "📱 Lifecell";
        } else if (hostname.includes("faust") || org.includes("faust") || org.includes("fiber") || org.includes("optics")) {
            state.ips = "🏚️ Оптика";
        } else if (ispSource.ip) {
            state.ips = ispSource.org || ispSource.ip;
        }
    } catch (error) {
        console.error('Error fetching IP info:', error);
    }
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

    if (state.status === 'available' && state.yasnoStatus === 'outage') {
        statusText = 'Є ДТЕК (🌞outage)';
    }

    if (state.status === 'na' && state.yasnoStatus === 'outage') {
        statusText = 'НЕМА ДТЕК';
    }

    if (state.status === 'na' && state.yasnoStatus !== 'outage') {   
        statusText = 'МОЖЛИВО ВИБИЛО';
    }

    if (state.status === 'na' && state.plannedState !== 'schedule_applies') {
        statusText = 'ГРАФІК НЕ ДІЄ';
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
    await getIps();
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

            await getEntityState('sensor.yasno_kiiv_dtek_4_2_status_today')
                .then((response) => {
                    state.plannedState = response.data.state;
                    console.log(response.data.state)
                })

            await getEntityState('sensor.torchunchick_battery')
                .then((response) => {
                    state.battery = `🔋 ${response.data.state}%`;
                })
                
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
