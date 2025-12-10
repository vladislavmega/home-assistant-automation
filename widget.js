// Scriptable widget for power availability status.
// Refactored for clarity, robustness, and performance.

const colors = {
    available: {
        textColor: "ffffff",
        gradientStartColor: "48d420",
        gradientEndColor: "41961b",
    },
    na: {
        textColor: "f0f0f0",
        gradientStartColor: "9c2424",
        gradientEndColor: "661414",
    },
    gray: {
        textColor: "ffffff",
        // Fixed invalid hex (was 9c9c9c9)
        gradientStartColor: "9c9c9c",
        gradientEndColor: "6b6b6b",
    },
};

const ROUTER_URL = "http://192.168.88.1:8027";
const BOILER_URL = "https://light.cherrypink.toys/state";
const ISPINFO_URL = "https://ipinfo.io/?token=0846ac66067f27";
const TIMEOUT_SHORT = 5; // seconds
const TIMEOUT_MEDIUM = 10; // seconds

function safeColor(hex) {
    try {
        return new Color(hex);
    } catch (e) {
        // Fallback to white on invalid hex
        return new Color("ffffff");
    }
}

function drawHeader(message, listWidget, textColor) {
    const title = listWidget.addText(`⚡️${message || "—"}`);
    title.font = Font.boldRoundedSystemFont(18);
    listWidget.addSpacer();
    title.textColor = safeColor(textColor);
}

function drawSince(message, listWidget, textColor) {
    const title = listWidget.addText(message ? `з ${message}` : "з —");
    title.font = Font.boldRoundedSystemFont(15);
    listWidget.addSpacer();
    title.textColor = safeColor(textColor);
}

function drawNextEvent(message, listWidget, textColor) {
    const title = listWidget.addText(message || "—");
    title.font = Font.boldRoundedSystemFont(15);
    listWidget.addSpacer();
    title.textColor = safeColor(textColor);
}

function drawISP(message, listWidget, textColor) {
    const title = listWidget.addText(message || "Невідомо");
    title.font = Font.mediumSystemFont(15);
    listWidget.addSpacer();
    title.textColor = safeColor(textColor);
}

function drawCurrentTime(listWidget, textColor) {
    const dateTime = new Date();
    const df = new DateFormatter();
    df.useShortTimeStyle();

    const description = listWidget.addText(`Оновлено ${df.string(dateTime)}`);
    description.font = Font.mediumSystemFont(13);
    description.textColor = safeColor(textColor);
}

function drawWidgetBackgroundGradient(listWidget, activeColors) {
    const startColor = safeColor(activeColors.gradientStartColor);
    const endColor = safeColor(activeColors.gradientEndColor);

    const gradient = new LinearGradient();
    gradient.colors = [startColor, endColor];
    gradient.locations = [0, 1];

    listWidget.backgroundGradient = gradient;
}

async function getStatus() {
    const req = new Request(BOILER_URL);
    req.allowInsecureRequest = true;
    req.timeoutInterval = TIMEOUT_SHORT;
    try {
        const json = await req.loadJSON();
        return json
    } catch (e) {
        return {
            "status": "gray",
            "lastChange": "",
            "nextConnectivity": "",
            "nextOutage": "",
            "nextPossibleOutage": "",
            "yasnoStatus": "",
            "plannedState": "",
            "ips": "",
            "nextEvent": "",
            "statusText": ""
        }
    }
}

async function run() {
    const listWidget = new ListWidget();
    try {
        const status = await getStatus();

        const activeColors = colors[status.status];
        const { textColor } = activeColors;

        drawHeader(status.statusText, listWidget, textColor);
        drawSince(status.lastChange, listWidget, textColor);
        drawNextEvent(status.nextEvent, listWidget, textColor);
        drawISP(status.ips, listWidget, textColor);
        drawCurrentTime(listWidget, textColor);

        drawWidgetBackgroundGradient(listWidget, activeColors);

        if (config.runsInApp) {
            listWidget.presentMedium();
        }
    } catch (e) {
        // In case of unexpected failure, present a minimal widget.
        const activeColors = colors.notInNetwork;
        const { textColor } = activeColors;
        drawHeader("Помилка", listWidget, textColor);
        drawISP("Невідомо", listWidget, textColor);
        drawCurrentTime(listWidget, textColor);
        drawWidgetBackgroundGradient(listWidget, activeColors);
    }

    Script.setWidget(listWidget);
    Script.complete();
}

await run()