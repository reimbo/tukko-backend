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
    expect(typeof data.dataUpdatedTime).toBe('string');
  });

  describe('stations-test', () => {
    let sampleStation: Station;

    beforeAll(() => {
      sampleStation = data.stations[0];
    });

    test('sample station is defined', () => {
      expect(sampleStation).toBeDefined();
    });

    test('sample station properties and types are defined correctly', () => {
      expect(sampleStation.id).toBeDefined();
      expect(typeof sampleStation.id).toBe('number');
      expect(sampleStation.tmsNumber).toBeDefined();
      expect(typeof sampleStation.tmsNumber).toBe('number');
      expect(sampleStation.dataUpdatedTime).toBeDefined();
      expect(typeof sampleStation.dataUpdatedTime ).toBe('string');
      expect(sampleStation.name).toBeDefined();
      expect(typeof sampleStation.name).toBe('string');

      expect(sampleStation.coordinates).toBeDefined();
      expect(Array.isArray(sampleStation.coordinates)).toBe(true);

      expect(sampleStation.sensorValues).toBeDefined();
      expect(Array.isArray(sampleStation.sensorValues)).toBe(true);
      expect(sampleStation.sensorValues.length).toBeGreaterThan(0);
    });

    describe('sensor values-test', () => {
        let sampleSensor: Sensor;
        let OHITUKSET_60MIN_KIINTEA_SUUNTA2: Sensor;
        let OHITUKSET_60MIN_KIINTEA_SUUNTA1: Sensor;
        let KESKINOPEUS_60MIN_KIINTEA_SUUNTA1: Sensor;
        let KESKINOPEUS_60MIN_KIINTEA_SUUNTA2: Sensor;
        let KESKINOPEUS_5MIN_KIINTEA_SUUNTA1_VVAPAAS1: Sensor;
        let KESKINOPEUS_5MIN_KIINTEA_SUUNTA2_VVAPAAS2: Sensor;
        let OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1: Sensor;
        let OHITUKSET_60MIN_KIINTEA_SUUNTA1_MS1: Sensor;
        let OHITUKSET_5MIN_KIINTEA_SUUNTA2_MS2: Sensor;
        let OHITUKSET_60MIN_KIINTEA_SUUNTA2_MS2: Sensor;
        let OHITUKSET_5MIN_LIUKUVA_SUUNTA1: Sensor;
        let OHITUKSET_5MIN_LIUKUVA_SUUNTA2: Sensor;
        let KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1: Sensor;
        let KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2: Sensor;
        let KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1: Sensor;
        let KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2: Sensor;
        let OHITUKSET_5MIN_LIUKUVA_SUUNTA1_MS1: Sensor;
        let OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2: Sensor;

        beforeAll(() => {
            sampleSensor = sampleStation.sensorValues[0];

            // 18 sensors types in total
            OHITUKSET_60MIN_KIINTEA_SUUNTA1 = sampleStation.sensorValues[0];
            OHITUKSET_60MIN_KIINTEA_SUUNTA2 = sampleStation.sensorValues[1];
            KESKINOPEUS_60MIN_KIINTEA_SUUNTA1 = sampleStation.sensorValues[2];
            KESKINOPEUS_60MIN_KIINTEA_SUUNTA2 = sampleStation.sensorValues[3];
            KESKINOPEUS_5MIN_KIINTEA_SUUNTA1_VVAPAAS1 = sampleStation.sensorValues[4];
            KESKINOPEUS_5MIN_KIINTEA_SUUNTA2_VVAPAAS2 = sampleStation.sensorValues[5];
            OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1 = sampleStation.sensorValues[6];
            OHITUKSET_60MIN_KIINTEA_SUUNTA1_MS1 = sampleStation.sensorValues[7];
            OHITUKSET_5MIN_KIINTEA_SUUNTA2_MS2 = sampleStation.sensorValues[8];
            OHITUKSET_60MIN_KIINTEA_SUUNTA2_MS2 = sampleStation.sensorValues[9];
            OHITUKSET_5MIN_LIUKUVA_SUUNTA1 = sampleStation.sensorValues[10];
            OHITUKSET_5MIN_LIUKUVA_SUUNTA2 = sampleStation.sensorValues[11];
            KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1 = sampleStation.sensorValues[12];
            KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2 = sampleStation.sensorValues[13];
            KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1 = sampleStation.sensorValues[14];
            KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2 = sampleStation.sensorValues[15];
            OHITUKSET_5MIN_LIUKUVA_SUUNTA1_MS1 = sampleStation.sensorValues[16];
            OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2 = sampleStation.sensorValues[17];
        });

        test('sample sensor is defined', () => {
            expect(sampleSensor).toBeDefined();
        });

        test('sample sensor properties and types are defined correctly', () => {
            expect(sampleSensor.stationId).toBeDefined();
            expect(typeof sampleSensor.stationId).toBe('number');
            expect(sampleSensor.name).toBeDefined();
            expect(typeof sampleSensor.name).toBe('string');
            expect(sampleSensor.shortName).toBeDefined();
            expect(typeof sampleSensor.shortName).toBe('string');
            expect(sampleSensor.measuredTime).toBeDefined();
            expect(typeof sampleSensor.measuredTime === 'string' 
            // ||sampleSensor.measuredTime instanceof Date
            ).toBe(true);
            expect(sampleSensor.unit).toBeDefined();
            expect(typeof sampleSensor.unit).toBe('string');
            expect(sampleSensor.value).toBeDefined();
            expect(typeof sampleSensor.value).toBe('number');
        });

        test('sample sensor units are defined correctly', () => {
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA1.name === 'OHITUKSET_60MIN_KIINTEA_SUUNTA1').toBe(true);
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA1.unit === 'kpl/h').toBe(true);
            
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA2.name === 'OHITUKSET_60MIN_KIINTEA_SUUNTA2').toBe(true);
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA2.unit === 'kpl/h').toBe(true);

            expect(KESKINOPEUS_60MIN_KIINTEA_SUUNTA1.name === 'KESKINOPEUS_60MIN_KIINTEA_SUUNTA1').toBe(true);
            expect(KESKINOPEUS_60MIN_KIINTEA_SUUNTA1.unit === 'km/h').toBe(true);

            expect(KESKINOPEUS_60MIN_KIINTEA_SUUNTA2.name === 'KESKINOPEUS_60MIN_KIINTEA_SUUNTA2').toBe(true);
            expect(KESKINOPEUS_60MIN_KIINTEA_SUUNTA2.unit === 'km/h').toBe(true);
            
            expect(KESKINOPEUS_5MIN_KIINTEA_SUUNTA1_VVAPAAS1.name === 'KESKINOPEUS_5MIN_KIINTEA_SUUNTA1_VVAPAAS1').toBe(true);
            expect(KESKINOPEUS_5MIN_KIINTEA_SUUNTA1_VVAPAAS1.unit === '***').toBe(true);

            expect(KESKINOPEUS_5MIN_KIINTEA_SUUNTA2_VVAPAAS2.name === 'KESKINOPEUS_5MIN_KIINTEA_SUUNTA2_VVAPAAS2').toBe(true);
            expect(KESKINOPEUS_5MIN_KIINTEA_SUUNTA2_VVAPAAS2.unit === '***').toBe(true);
            
            expect(OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1.name === 'OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1').toBe(true);
            expect(OHITUKSET_5MIN_KIINTEA_SUUNTA1_MS1.unit === '***').toBe(true);
            
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA1_MS1.name === 'OHITUKSET_60MIN_KIINTEA_SUUNTA1_MS1').toBe(true);
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA1_MS1.unit === '***').toBe(true);
            
            expect( OHITUKSET_60MIN_KIINTEA_SUUNTA2_MS2.name === 'OHITUKSET_60MIN_KIINTEA_SUUNTA2_MS2').toBe(true);
            expect(OHITUKSET_60MIN_KIINTEA_SUUNTA2_MS2.unit === '***').toBe(true);

            expect(OHITUKSET_5MIN_KIINTEA_SUUNTA2_MS2.name === 'OHITUKSET_5MIN_KIINTEA_SUUNTA2_MS2').toBe(true);
            expect(OHITUKSET_5MIN_KIINTEA_SUUNTA2_MS2.unit === '***').toBe(true);
           
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA1.name === 'OHITUKSET_5MIN_LIUKUVA_SUUNTA1').toBe(true);
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA1.unit === 'kpl/h').toBe(true);
            
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA2.name === 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2').toBe(true);
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA2.unit === 'kpl/h').toBe(true);
            
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1.name === 'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1').toBe(true);
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1.unit === 'km/h').toBe(true);
            
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2.name === 'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2').toBe(true);
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2.unit === 'km/h').toBe(true);
            
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1.name === 'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1').toBe(true);
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA1_VVAPAAS1.unit === '***').toBe(true);
            
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2.name === 'KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2').toBe(true);
            expect(KESKINOPEUS_5MIN_LIUKUVA_SUUNTA2_VVAPAAS2.unit === '***').toBe(true);
            
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA1_MS1.name === 'OHITUKSET_5MIN_LIUKUVA_SUUNTA1_MS1').toBe(true);
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA1_MS1.unit === '***').toBe(true);
            
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2.name === 'OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2').toBe(true);
            expect(OHITUKSET_5MIN_LIUKUVA_SUUNTA2_MS2.unit === '***').toBe(true);
        });
    });
  });
});
