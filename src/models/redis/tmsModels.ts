import { Schema } from "redis-om";

// Redis schema for storing stations
export const stationSchema = new Schema("station", {
  // type: { type: 'string' },
  id: { type: "number" },
  tmsNumber: { type: "number" },
  dataUpdatedTime: { type: "date" },
  name: { type: "string" },
  // collectionStatus: { type: "text", sortable: true },
  // state: { type: 'string' },
  // geometryType: { type: 'string' },
  coordinates: { type: "point" },
  roadNumber: { type: "number", sortable: true },
  roadSection: { type: "number", sortable: true },
  // distanceFromRoadSectionStart: { type: 'number' },
  carriageway: { type: "string" },
  side: { type: "string" },
  // liviId: { type: 'string' },
  municipality: { type: "string" },
  municipalityCode: { type: "number", sortable: true },
  province: { type: "string" },
  provinceCode: { type: "number", sortable: true },
  direction1Municipality: { type: "string" },
  direction1MunicipalityCode: { type: "number" },
  direction2Municipality: { type: "string" },
  direction2MunicipalityCode: { type: "number" },
  freeFlowSpeed1: { type: "number" },
  freeFlowSpeed2: { type: "number" },
});

// Redis schema for storing sensors
export const sensorSchema = new Schema("sensor", {
  id: { type: "number", sortable: true },
  stationId: { type: "number", sortable: true },
  name: { type: "string" },
  shortName: { type: "string" },
  timeWindowStart: { type: "date" },
  timeWindowEnd: { type: "date" },
  measuredTime: { type: "date", sortable: true },
  unit: { type: "string" },
  // sensorValueDescriptionFi: { type: "text" },
  // sensorValueDescriptionEn: { type: "text" },
  value: { type: "number", sortable: true },
});

// Redis schema for storing road work phases
export const roadworkSchema = new Schema("roadwork", {
  id: { type: "string" },
  dataUpdatedTime: { type: "date" },
  primaryPointRoadNumber: { type: "number", sortable: true },
  primaryPointRoadSection: { type: "number", sortable: true },
  // primaryPointDistanceFromRoadSectionStart: { type: 'number', sortable: true },
  secondaryPointRoadNumber: { type: "number", sortable: true },
  secondaryPointRoadSection: { type: "number", sortable: true },
  // secondaryPointDistanceFromRoadSectionStart: { type: 'number', sortable: true },
  direction: { type: "string" },
  startTime: { type: "date", sortable: true },
  endTime: { type: "date" },
  severity: { type: "string" },
  // workingHours: { type: 'string' },
  // workTypes: { type: 'string' },
  // restrictions: { type: 'string[]' }
});
