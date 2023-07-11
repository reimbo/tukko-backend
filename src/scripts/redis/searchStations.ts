import { ParsedQs } from "qs";
import { stationRepository } from "./client";

// Set allowed params for each object type
const stationParams = new Set<string>([
  "collectionStatus",
  "roadNumber",
  "roadSection",
  "municipalityCode",
  "provinceCode",
  "longitude",
  "latitude",
  "radius",
]);

// Search for a station by ID
async function searchStationById(id: string) {
  try {
    // Query a station based on ID
    const stationEntity = await stationRepository.fetch(id);
    // Return null if object is empty
    return Object.keys(stationEntity).length === 0 ? null : [stationEntity];
  } catch (error: any) {
    throw new Error("Error searching station by ID: " + error.message);
  }
}

// Search for stations based on provided parameters
async function searchStations(params: ParsedQs) {
  try {
    let stations: any[] = [];
    // Build dictionary for station params
    const stationParamsDict = buildParamsDictionary(params, stationParams);
    // Query stations
    if (Object.keys(stationParamsDict).length === 0) {
      // If no params provided, get all stations
      stations = await stationRepository.search().return.all();
    } else {
      // Query stations based on station params
      stations = await buildStationQuery(stationParamsDict).return.all();
    }
    // Return null if list is empty
    return stations.length === 0 ? null : stations;
  } catch (error: any) {
    throw new Error("Error searching stations: " + error.message);
  }
}

// Helper function to build a station query based on params
function buildStationQuery(paramsDict: Record<string, any>) {
  // Build a station query
  let query = stationRepository.search();
  const longitude = paramsDict["longitude"];
  const latitude = paramsDict["latitude"];
  const radius = paramsDict["radius"];
  // Coordinates params require unique query construction
  if (longitude && latitude && radius) {
    query = query
      .where("coordinates")
      .inRadius(
        (circle) =>
          circle.longitude(longitude).latitude(latitude).radius(radius)
            .kilometers
      );
  }
  // Other params
  for (const param in paramsDict) {
    if (param != "longitude" && param != "latitude" && param != "radius") {
      // Protect against arrays
      if (Array.isArray(paramsDict[param])) {
        const arrayValues: any = paramsDict[param];
        let subquery = stationRepository.search();
        for (const arrayValue of arrayValues) {
          subquery = subquery.or(param).equals(arrayValue);
        }
        query = query.where((search) => subquery);
      } else query = query.and(param).equals(paramsDict[param]);
    }
  }
  return query;
}

// Helper function to build a dictionary of allowed parameters
function buildParamsDictionary(params: ParsedQs, targetParams: Set<string>) {
  const dict: Record<string, any> = {};
  const keys = new Set<string>(Object.keys(params));
  for (const param of keys) {
    if (targetParams.has(param)) {
      dict[param] = params[param];
    }
  }
  return dict;
}

// Export search functions
export default { searchStationById, searchStations };
