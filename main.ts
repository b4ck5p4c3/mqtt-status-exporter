import mqtt from "mqtt"
import fs from "fs"
import dotenv from "dotenv"
import express from "express";

dotenv.config();

const mqttUrl = process.env.MQTT_URL ?? "mqtt://root:root@127.0.0.1:1883";
const mqttTopic = process.env.MQTT_TOPIC ?? "monitoring/mqtt_exporter";
const caCertificatePath = process.env.CA_CERTIFICATE;
const port = parseInt(process.env.PORT ?? "9002");
const interval = parseInt(process.env.INTERVAL ?? "15000");
const timeout = parseInt(process.env.TIMEOUT ?? "5000");

const testMessage = 'test message';

const app = express();

let mqttSucceed = true;
let mqttRttSeconds = 0;

app.get('/metrics', (req, res) => {
    res.end('# HELP mqtt_succeed Has RTT succeed (1 - ok, 0 - failed)\n' + 
            '# TYPE mqtt_succeed gauge\n' +
            `mqtt_succeed ${mqttSucceed ? '1' : '0'}\n` + 
            '# HELP mqtt_rtt_seconds MQTT pub-recv roundtrip time\n' +
            '# TYPE mqtt_rtt_seconds gauge\n' +
            `mqtt_rtt_seconds ${mqttRttSeconds.toFixed(6)}\n`);
});

app.listen(port);

async function fetchMetrics() {
    const realTestMessage = Buffer.from(testMessage + Math.random().toFixed(10).slice(2), "utf8");
    try {
        const client = await mqtt.connectAsync(mqttUrl, caCertificatePath ? {
            ca: [fs.readFileSync(caCertificatePath)]
        } : {});
        client.on('error', (e) => {
            console.error(`MQTT failed: ${e}`);
            mqttSucceed = false;
            mqttRttSeconds = 0;
            client.end();
        });
        await client.subscribeAsync(mqttTopic);
        let publishTime = process.hrtime.bigint();
        let messageTimeout = setTimeout(() => {
            console.error(`Message timeouted`);
            mqttSucceed = false;
            mqttRttSeconds = 0;
            client.end();
        }, timeout);
        client.on('message', (topic, message) => {
            if (topic === mqttTopic && message.compare(realTestMessage) === 0) {
                clearTimeout(messageTimeout);
                mqttSucceed = true;
                mqttRttSeconds = Number((process.hrtime.bigint() - publishTime) / 1000n) / 1000000;
            } else {
                mqttSucceed = false;
                mqttRttSeconds = 0;
            }
            client.end();
        });
        await client.publishAsync(mqttTopic, realTestMessage);
    } catch (e) {
        console.error(`Failed: ${e}`);
        mqttSucceed = false;
        mqttRttSeconds = 0;
    }
}

setInterval(() => fetchMetrics().catch(console.error), interval);
fetchMetrics().catch(console.error);