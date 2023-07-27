import { ParsedQs } from "qs";
import { buildParamsDict } from "./buildParamsDict";
import { sensorRepository } from "./client";

// Set allowed params for sensor queries
const sensorParams = new Set<string>([
  "id",
  "stationId",
  "measuredTimeOnAfter",
  "measuredTimeOnBefore",
  "valueLte",
  "valueGte",
]);

// Helper function to build a sensor query based on params
function buildSensorQuery(paramsDict: Record<string, any>) {
  // Build a sensor query
  let query = sensorRepository.search();
  for (const param in paramsDict) {
    const value = paramsDict[param];
    if (param === "measuredTimeOnAfter" || param === "measuredTimeOnBefore") {
      if (param === "measuredTimeOnAfter") {
        query = query.and("measuredTime").onOrAfter(value);
      } else {
        query = query.and("measuredTime").onOrBefore(value);
      }
    } else if (param === "valueGte") {
      query = query.and("value").gte(value);
    } else if (param === "valueLte") {
      query = query.and("value").lte(value);
    } else {
      // Protect against arrays
      if (Array.isArray(value)) {
        const arrayValues: any = value;
        let subquery = sensorRepository.search();
        for (const arrayValue of arrayValues) {
          subquery = subquery.or(param).equals(arrayValue);
        }
        query = query.where((search) => subquery);
      } else query = query.and(param).equals(value);
    }
  }
  return query;
}

// Search for sensors based on provided params
async function searchSensors(params: ParsedQs) {
  try {
    let sensors: any[] = [];
    // Query sensors
    if (Object.keys(params).length === 0) {
      // If no params provided, get all sensors
      sensors = await sensorRepository.search().return.all({ pageSize: 100 });
    } else {
      // Build dictionary for sensor params
      const sensorParamsDict = buildParamsDict(params, sensorParams);
      // Query sensors based on params
      sensors = await buildSensorQuery(sensorParamsDict).return.all({
        pageSize: 100,
      });
    }
    // Return null if list is empty
    return sensors.length === 0 ? null : sensors;
  } catch (error: any) {
    throw new Error("Error searching sensors: " + error.message);
  }
}

// Export search functions
export default { searchSensors };
