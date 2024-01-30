# mqtt-status-exporter

Simple MQTT status checker with metrics for Prometheus

`GET /metrics` - get MQTT metrics

`.env` variables:
- `TIMEOUT` - timeout after which MQTT server will be considered dead
- `PORT` - port to listen onto
- `MQTT_URL` - MQTT server URL with credentials
- `MQTT_TOPIC` - topic to write to
- `CA_CERTIFICATE` - MQTT server CA certificate if present
- `INTERVAL` - polling interval