import { fetch } from './fetch';
import { StationData, Station, Sensor } from '../models/tms_data_model';

describe('fetch-test', () => {
  let data: StationData;

  beforeAll(async () => {
    const url = 'https://tie.digitraffic.fi/api/tms/v1/stations/data';
    data = await fetch(url);
  });

  test('live-fetched data is defined', () => {
    expect(data).toBeDefined();
  });

  test('data has updated time', () => {
    expect(data.dataUpdatedTime).toBeDefined();
  });

  describe('stations-test', () => {
    let sampleStation: Station;

    beforeAll(() => {
      sampleStation = data.stations[0];
    });

    test('sample station is defined', () => {
      expect(sampleStation).toBeDefined();
    });

    test('sample station properties are defined correctly', () => {
      expect(sampleStation.id).toBeDefined();
      expect(sampleStation.tmsNumber).toBeDefined();
      expect(sampleStation.dataUpdatedTime).toBeDefined();
      expect(sampleStation.name).toBeDefined();
      expect(sampleStation.coordinates).toBeDefined();
      expect(Array.isArray(sampleStation.coordinates)).toBe(true);
      expect(sampleStation.sensorValues).toBeDefined();
      expect(Array.isArray(sampleStation.sensorValues)).toBe(true);
      expect(sampleStation.sensorValues.length).toBeGreaterThan(0);
    });

    describe('sensor values-test', () => {
      let sampleSensor: Sensor;

      beforeAll(() => {
        sampleSensor = sampleStation.sensorValues[0];
      });

      test('sample sensor is defined', () => {
        expect(sampleSensor).toBeDefined();
      });

      test('sample sensor properties are defined correctly', () => {
        expect(sampleSensor.stationId).toBeDefined();
        expect(sampleSensor.name).toBeDefined();
        expect(sampleSensor.shortName).toBeDefined();
        expect(sampleSensor.measuredTime).toBeDefined();
        expect(sampleSensor.unit).toBeDefined();
        expect(sampleSensor.value).toBeDefined();
      });
    });
  });
});
