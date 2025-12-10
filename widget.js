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

const BACKEND_URL = "https://light.cherrypink.toys/state";
const ISPINFO_URL = "https://ipinfo.io/?token=0846ac66067f27";
const TIMEOUT_SHORT = 5; // seconds


function safeColor(hex) {
    try {
        return new Color(hex);
    } catch (e) {
        // Fallback to white on invalid hex
        return new Color("ffffff");
    }
}

// Draw header and battery on the same horizontal row so it doesn't affect vertical flow.
function drawHeader(message, listWidget, textColor, batteryState = "") {
    const row = listWidget.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    row.setPadding(0, 0, 0, 0);

    const title = row.addText(`⚡️${message || "—"}`);
    title.font = Font.boldRoundedSystemFont(18);
    title.textColor = safeColor(textColor);

    row.addSpacer(); // push battery to the right within the same row

    const battery = row.addText(batteryState);
    battery.font = Font.mediumSystemFont(16);
    battery.textColor = safeColor(textColor);

    listWidget.addSpacer(4);
}

// Deprecated: battery is now rendered within header row to avoid shifting content.
function drawBattery() {}

function drawSince(message, listWidget, textColor) {
    const title = listWidget.addText(message ? `з ${message}` : "з —");
    title.font = Font.boldRoundedSystemFont(15);
    listWidget.addSpacer();
    title.textColor = safeColor(textColor);
}

function drawNextEvent(message, listWidget, textColor) {
    const title = listWidget.addText(message);
    title.font = Font.boldRoundedSystemFont(15);
    listWidget.addSpacer();
    title.textColor = safeColor(textColor);
}

function drawISP(message, listWidget, textColor) {
    const title = listWidget.addText(message);
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
    const req = new Request(BACKEND_URL);
    req.allowInsecureRequest = true;
    req.timeoutInterval = TIMEOUT_SHORT;
    try {
        const json = await req.loadJSON(); 
        
        return json;
    } catch (e) {
        // Fallback structure for UI stability
        return {
            status: "gray",
            lastChange: "",
            nextConnectivity: "",
            nextOutage: "",
            nextPossibleOutage: "",
            yasnoStatus: "",
            plannedState: "",
            ips: "",
            nextEvent: "",
            statusText: "",
        };
    }
}

async function run() {
    const listWidget = new ListWidget();
    try {
        const status = await getStatus();
        const activeColors = colors[status.status] || colors.gray;
        const { textColor } = activeColors;

        drawHeader(status.statusText, listWidget, textColor, status.battery);
        drawSince(status.lastChange, listWidget, textColor);
        drawNextEvent(status.nextEvent, listWidget, textColor);
        drawISP(status.ips, listWidget, textColor);
        drawCurrentTime(listWidget, textColor);

        drawWidgetBackgroundGradient(listWidget, activeColors);

        if (config.runsInApp) {
            listWidget.presentMedium();
        }
    } catch (e) {
        const activeColors = colors.gray;
        const { textColor } = activeColors;
        drawHeader("Помилка", listWidget, textColor, '');
        drawISP("Невідомо", listWidget, textColor);
        drawCurrentTime(listWidget, textColor);
        drawWidgetBackgroundGradient(listWidget, activeColors);
    }

    Script.setWidget(listWidget);
    Script.complete();
}

await run()
