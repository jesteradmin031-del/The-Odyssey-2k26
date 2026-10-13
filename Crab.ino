#define BLYNK_TEMPLATE_ID "TMPL3Xckio2DE"
#define BLYNK_TEMPLATE_NAME "SENSEFORGE"
#define BLYNK_AUTH_TOKEN    "4EJniUqrwWGrbE2RzNdDBjRaq_u-uj4V"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <OneWire.h>
#include <DallasTemperature.h>

char ssid[] = "ODESSEY3";
char pass[] = "odyssey2026";

// ESP32 GPIO connections
const int TEMP_PIN  = 4;
const int PH_PIN    = 34;
const int TDS_PIN   = 35;
const int LEVEL_PIN = 32;

// DS18B20
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

BlynkTimer timer;

// ---------- CALIBRATION SETTINGS ----------
// Replace these with measured values from your own sensors.
float PH4_VOLTAGE  = 3.00;  // Example only
float PH7_VOLTAGE  = 2.50;  // Example only

// TDS conversion factor; tune against a known TDS solution.
float TDS_FACTOR = 0.50;

// HW-038 thresholds must be determined by testing.
int LEVEL_LOW_THRESHOLD  = 900;
int LEVEL_HIGH_THRESHOLD = 1800;

// ---------- READ ANALOG VOLTAGE ----------
float readVoltage(int pin) {
  uint32_t totalMilliVolts = 0;
  const int samples = 20;

  for (int i = 0; i < samples; i++) {
    totalMilliVolts += analogReadMilliVolts(pin);
    delay(5);
  }

  return (totalMilliVolts / (float)samples) / 1000.0;
}

// ---------- TEMPERATURE ----------
void readTemperature() {
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);

  if (tempC == DEVICE_DISCONNECTED_C ||
      tempC < -40 || tempC > 125) {
    Serial.println("Temperature sensor error");
    Blynk.virtualWrite(V4, "Sensor error");
    return;
  }

  Serial.printf("Temperature: %.2f C\n", tempC);
  Blynk.virtualWrite(V0, tempC);
  Blynk.virtualWrite(V4, "OK");
}

// ---------- PH ----------
void readPH() {
  float voltage = readVoltage(PH_PIN);

  // Linear calibration between pH 4 and pH 7.
  // This assumes PH4_VOLTAGE and PH7_VOLTAGE are
  // actual measured voltages from your calibrated probe.
  if (abs(PH4_VOLTAGE - PH7_VOLTAGE) < 0.01) {
    Serial.println("Invalid pH calibration voltages");
    Blynk.virtualWrite(V5, "Calibration error");
    return;
  }

  float phValue = 4.0 +
    (voltage - PH4_VOLTAGE) *
    (7.0 - 4.0) /
    (PH7_VOLTAGE - PH4_VOLTAGE);

  Serial.printf("pH voltage: %.3f V, pH: %.2f\n",
                voltage, phValue);

  // Flag implausible values rather than treating them as valid.
  if (phValue < 0 || phValue > 14) {
    Blynk.virtualWrite(V1, 0);
    Blynk.virtualWrite(V5, "Check pH probe/calibration");
  } else {
    Blynk.virtualWrite(V1, phValue);
    Blynk.virtualWrite(V5, "OK");
  }
}

// ---------- TDS ----------
void readTDS() {
  float voltage = readVoltage(TDS_PIN);

  // Basic approximate conversion for a common analog TDS kit.
  // Actual formula and factor depend on the module and calibration.
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);

  if (tempC == DEVICE_DISCONNECTED_C ||
      tempC < -40 || tempC > 125) {
    tempC = 25.0; // Fallback; no temperature compensation
  }

  float compensation = 1.0 + 0.02 * (tempC - 25.0);
  float compensatedVoltage = voltage / compensation;

  float tdsPPM =
    (133.42 * compensatedVoltage * compensatedVoltage *
     compensatedVoltage
     - 255.86 * compensatedVoltage * compensatedVoltage
     + 857.39 * compensatedVoltage) * TDS_FACTOR;

  if (tdsPPM < 0) tdsPPM = 0;

  Serial.printf("TDS voltage: %.3f V, TDS: %.0f ppm\n",
                voltage, tdsPPM);

  Blynk.virtualWrite(V2, tdsPPM);
  Blynk.virtualWrite(V6, "OK");
}

// ---------- HW-038 WATER CONTACT / LEVEL ----------
void readWaterLevel() {
  int raw = analogRead(LEVEL_PIN);

  String levelStatus;

  if (raw < LEVEL_LOW_THRESHOLD) {
    levelStatus = "Low / little water contact";
  } else if (raw < LEVEL_HIGH_THRESHOLD) {
    levelStatus = "Medium";
  } else {
    levelStatus = "High water contact";
  }

  Serial.printf("HW-038 raw reading: %d, status: %s\n",
                raw, levelStatus.c_str());

  Blynk.virtualWrite(V3, raw);
  Blynk.virtualWrite(V7, levelStatus);
}

// ---------- ALL SENSORS ----------
void sendSensorReadings() {
  readTemperature();
  readPH();
  readTDS();
  readWaterLevel();

  Serial.println("--------------------------");
}

void setup() {
  Serial.begin(115200);

  analogReadResolution(12);

  tempSensor.begin();

  pinMode(PH_PIN, INPUT);
  pinMode(TDS_PIN, INPUT);
  pinMode(LEVEL_PIN, INPUT);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  // Send readings every 5 seconds.
  timer.setInterval(5000L, sendSensorReadings);

  // Read immediately once connected.
  sendSensorReadings();
}

void loop() {
  Blynk.run();
  timer.run();
}