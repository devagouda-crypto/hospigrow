# Frugal IoT for rural deployments

This doc covers what to buy, what to build, and how it connects to Hospigrow. The goal: a primary health centre (PHC) in a village can record clinical-grade vitals without a doctor present and without reliable internet.

## Buy off-the-shelf (recommended for pilots)

These BLE devices speak the standard Bluetooth SIG profiles and "just work" with the Hospigrow ASHA app via Web Bluetooth:

| Device              | Price (₹)       | Profile             | Notes                              |
| ------------------- | --------------- | ------------------- | ---------------------------------- |
| BP cuff             | 2,500-5,000     | BP 0x1810           | Omron HEM-7361T, A&D UA-651BLE     |
| Pulse oximeter      | 1,500-3,500     | Pulse Oximeter 0x1822 | Nonin 3230, Masimo MightySat       |
| Thermometer         | 800-2,500       | Health Therm 0x1809 | iHealth PT3, A&D UT-201BLE         |
| Weight scale        | 2,000-4,500     | Weight 0x181D       | Omron HBF-222T, A&D UC-352BLE      |
| Glucometer          | 800-2,500       | Glucose 0x1808      | Accu-Chek Active, Dr Morepen BG-03 |

Total kit: ~₹10,000-18,000 per PHC. Battery life: typically months.

## Build frugal devices (for scale + customization)

When pilot succeeds and you need 1,000 PHCs, off-the-shelf gets expensive and inflexible. ESP32-based homebrew gets you:
- ~₹400-800 per unit BOM cost
- Custom features (built-in ABHA QR scanner, voice prompts in local language)
- Repairability in the field (any village electronics shop has spare ESP32s)

### Reference design: ESP32 BP cuff

**Bill of materials (~₹650):**
- ESP32-S3 dev module: ₹350
- Pressure sensor + valve + manometer (Honeywell or generic): ₹150
- Small OLED display (0.96"): ₹100
- 3.7V 2000mAh LiPo battery + TP4056 charger: ₹50

**Firmware:** Arduino IDE or PlatformIO. Connects to Mosquitto broker via Wi-Fi or 4G dongle. Publishes readings to:
```
hospigrow/v1/devices/{deviceId}/blood-pressure/reading
```

See `packages/iot/src/mqtt.ts` for the payload spec.

**Provisioning:** factory burns a unique device ID + X.509 cert per unit. PHC admin scans a QR on the device to register it in the middleware.

### Reference design: ESP32 pulse oximeter

- ESP32-C3: ₹250
- MAX30102 SpO2 sensor: ₹150
- 3D-printed clip housing (any Indian fab lab): ₹100
- LiPo battery + charger: ₹50

Total: ~₹550.

### Reference design: weighing scale

A standard ₹500 mechanical scale + ESP32 + HX711 load cell amplifier = a connected scale for ₹1,200. Useful for pediatric weight tracking under government schemes (POSHAN Abhiyaan).

## Network architecture in a village

```
                    [ Cellular tower ]
                            │ (4G/NB-IoT)
                    [ 4G dongle / router at PHC ]
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        [ ESP32 BP ]   [ ESP32 SpO2 ]  [ Tablet ]
                                          │ (ASHA app — PWA, offline-first)
                                          │
                                  Mostly works offline;
                                  syncs with middleware
                                  when 4G is good
```

## When the network is down

- ASHA tablet runs ASHA app fully offline (Service Worker + IndexedDB)
- Bluetooth devices still connect to the tablet directly — no internet needed
- MQTT devices (cellular) buffer locally if Mosquitto is unreachable; reconnect+ flush on recovery
- Tablets sync when 4G returns (could be hours later)
- Critical alerts (e.g., BP readings indicating stroke risk) trigger an SMS via the Mosquitto bridge (works on 2G when 4G is down)

## When the power is down

- Tablets have batteries; PHCs should have a small UPS (~₹3,000) for the 4G dongle
- ESP32 devices run on LiPo, charge via solar panel (₹500 for a 5W panel) or a hand-crank charger
- Audit log integrity: each tablet keeps a local hash chain so even if it loses power mid-write, the next boot can verify and repair

## What this scaffold provides

- **Web Bluetooth adapters** — BP, pulse ox, thermometer, glucometer (in `packages/iot/src/adapters/`)
- **MQTT topic spec** — for ESP32 + Mosquitto integration (`packages/iot/src/mqtt.ts`)
- **Reference firmware** — to be added in week 10 of the build plan
- **Device registration UI** — to be added in the Staff app

## What you'll need to add

- ESP32 reference firmware (one per device class)
- Mosquitto deployment recipe (Docker compose for the PHC Raspberry Pi)
- Middleware MQTT subscriber (`services/middleware/app/iot/mqtt.py`)
- Device registry CRUD (FHIR Device + DeviceMetric)
- Calibration tracking + reminders
