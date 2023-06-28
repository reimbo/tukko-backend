import { Repository, Schema } from 'redis-om';

// Redis schema for storing stations
export const stationSchema = new Schema('station', {
  // type: { type: 'string' },
  id: { type: 'number', sortable: true },
  tmsNumber: { type: 'number', sortable: true },
  name: { type: 'string' },
  dataUpdatedTime: { type: 'date' },
  // collectionStatus: { type: 'string' },
  // state: { type: 'string' },
  // geometryType: { type: 'string' },
  coordinates: { type: 'point' },
  roadNumber: { type: 'number', sortable: true },
  roadSection: { type: 'number', sortable: true },
  // distanceFromRoadSectionStart: { type: 'number' },
  carriageway: { type: 'string' },
  side: { type: 'string' },
  // liviId: { type: 'string' },
  municipality: { type: 'string' },
  municipalityCode: { type: 'number', sortable: true },
  province: { type: 'string' },
  provinceCode: { type: 'number', sortable: true },
  direction1Municipality: { type: 'string' },
  direction1MunicipalityCode: { type: 'number', sortable: true },
  direction2Municipality: { type: 'string' },
  direction2MunicipalityCode: { type: 'number', sortable: true },
  // freeFlowSpeed1: { type: 'number', sortable: true },
  // freeFlowSpeed2: { type: 'number', sortable: true },
  sensors: { type: 'string[]' }
});

// Redis schema for storing sensors
export const sensorSchema = new Schema('sensor', {
  id: { type: 'number', sortable: true },
  stationId: { type: 'number', sortable: true },
  name: { type: 'string' },
  // shortName: { type: 'string' },
  timeWindowStart: { type: 'date' },
  timeWindowEnd: { type: 'date' },
  measuredTime: { type: 'date', sortable: true },
  unit: { type: 'string' },
  value: { type: 'number', sortable: true },
  // sensorValueDescriptionFi: { type: 'text' },
  // sensorValueDescriptionEn: { type: 'text' }
});