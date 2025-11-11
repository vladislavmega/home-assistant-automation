const colors = {
    available: {
        textColor: "ffffff",
        gradientStartColor: "48d420",
        gradientEndColor: "41961b"
    },
    notAvailable: {
        textColor: "f0f0f0",
        gradientStartColor: "9c2424",
        gradientEndColor: "661414"
    },
    notInNetwork: {
        textColor: "ffffff",
        gradientStartColor: "9c9c9c9",
        gradientEndColor: "6b6b6b"
    }
}

async function isAvailable() {
    let resolveRouter;
    let rejectRouter;
    let resolveBoiler;
    let rejectBoiler;
    let resolveISP;
    let rejectISP;
    let since = '';
    let nextEvent = '';

    const routerPromise = new Promise((resolve, reject) => {
        resolveRouter = resolve;
        rejectRouter = reject;
    });

    const boilerPromise = new Promise((resolve, reject) => {
        resolveBoiler = resolve;
        rejectBoiler = reject;
    });

    const ISPPromise = new Promise((resolve, reject) => {
        resolveISP = resolve;
        rejectISP = reject;
    });

    var pingRouter = new Request('http://192.168.88.1:8027');
    pingRouter.allowInsecureRequest = true;
    pingRouter.timeoutInterval = 5;

    try {
        let responseRouter = await pingRouter.loadString();
        resolveRouter(!!responseRouter);
    } catch (e) {
        rejectRouter(false);
    }

    var pingBoiler = new Request('https://light.cherrypink.toys/state');
    pingBoiler.allowInsecureRequest = true;
    pingBoiler.timeoutInterval = 5;

    try {
        let responseBoiler = await pingBoiler.loadJSON();
        if (responseBoiler.status == 'available') {
            resolveBoiler(true);

        } else if (responseBoiler.status == 'na'){
            rejectBoiler(false);
        }
        nextEvent = responseBoiler.nextEvent;
        since = responseBoiler.lastChange
    } catch(e) {
        rejectBoiler(false);
        since = ''
        nextEvent = ''
    }

    var pingISP = new Request('https://ipinfo.io/?token=0846ac66067f27');
    pingISP.timeoutInterval = 10;

    try {
        let responseISP = await pingISP.loadJSON();
        resolveISP(responseISP);
    } catch(e) {
        rejectISP(false);
    }

    const test = Promise.allSettled([routerPromise, boilerPromise, ISPPromise]).then((values) => {
        let ISP = 'Невідомо';
        const ispSource = values[2].value;
        console.log(values[2]);
        console.log(ispSource);
        if (values[2] && values[2].status === 'fulfilled') {
            if (ispSource && ispSource.hostname && ispSource.hostname.includes('starlink')) {
                ISP = '📡 Starlink';
            }

            if (ispSource && ispSource.org && ispSource.org.includes('lifecell')) {
                ISP = '📱Lifecell';
            }

            if (ispSource && ispSource.hostname && ispSource.hostname.includes('faust')) {
                ISP = '🏚️ Оптика';
            }
        } else {
            ISP = 'Немає мережі'
        }
        return [(values[0] && values[0].status === 'fulfilled'), (values[1] && values[1].status === 'fulfilled'), ISP, since, nextEvent];
    });

    return test;
}

function drawHeader(message, listWidget, textColor) {
    const title = listWidget.addText(`⚡️${message}`);
    title.font = Font.boldRoundedSystemFont(18)
    listWidget.addSpacer()

    title.textColor = new Color(textColor)
}

function drawSince(message, listWidget, textColor) {
    const title = listWidget.addText(`з ${message}`);
    title.font = Font.boldRoundedSystemFont(15)
    listWidget.addSpacer()

    title.textColor = new Color(textColor)
}

function drawNextEvent(message, listWidget, textColor) {
    const title = listWidget.addText(`${message}`);
    title.font = Font.boldRoundedSystemFont(15)
    listWidget.addSpacer()

    title.textColor = new Color(textColor)
}

function drawISP(message, listWidget, textColor) {
    const title = listWidget.addText(message);
    title.font = Font.mediumSystemFont(15)
    listWidget.addSpacer();

    title.textColor = new Color(textColor);
}

function drawCurrentTime(listWidget, textColor) {
    const dateTime = new Date()
    let df = new DateFormatter()
    df.useShortTimeStyle()

    let description = listWidget.addText(`Оновлено ${df.string(dateTime)}`)
    description.font = Font.mediumSystemFont(13)
    description.textColor = new Color(textColor)
}

function drawWidgetBackgroundGradient(listWidget, activeColors, textColorHEX) {
    const startColor = new Color(activeColors.gradientStartColor)
    const endColor = new Color(activeColors.gradientEndColor)

    const gradient = new LinearGradient()
    gradient.colors = [startColor, endColor]
    gradient.locations = [0.0, 1]

    listWidget.backgroundGradient = gradient
}

async function run() {
    const listWidget = new ListWidget();
    return isAvailable().then((values) => {
        const [isRouterAvailable, isBoilderAvailable, ispName, since, nextEvent] = values;
        let message = '';

        let currentColors = 'notInNetwork';

        if (!isRouterAvailable) {
            currentColors = 'notInNetwork';
            message = 'Не вдома';
        }

        if (isRouterAvailable && isBoilderAvailable) {
            currentColors = 'available';
            message = 'Є ДТЕК';
        }

        if (isRouterAvailable && !isBoilderAvailable) {
            currentColors = 'notAvailable';
            message = 'Нема ДТЕК';
        }

        const activeColors = colors[currentColors];
        const {textColor} = activeColors

        drawHeader(message, listWidget, textColor)
        drawSince(since, listWidget, textColor);
        drawNextEvent(nextEvent,listWidget, textColor)
        drawISP(ispName, listWidget, textColor)
        drawCurrentTime(listWidget, textColor)

        drawWidgetBackgroundGradient(listWidget, activeColors)

        if (config.runsInApp) {
            listWidget.presentMedium()
        }

        Script.setWidget(listWidget)
        Script.complete();
    });
}

await run()