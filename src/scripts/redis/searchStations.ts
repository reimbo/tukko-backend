import { ParsedQs } from "qs";
import { buildParamsDict } from "./buildParamsDict";
import { stationRepository } from "./client";

// Set allowed params for station queries
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
    if (param === "collectionStatus") {
      // Protect against arrays
      if (Array.isArray(paramsDict[param])) {
        const arrayValues: any = paramsDict[param];
        let subquery = stationRepository.search();
        for (const arrayValue of arrayValues) {
          subquery = subquery.or(param).match(arrayValue);
        }
        query = query.where((search) => subquery);
      } else query = query.and(param).match(paramsDict[param]);
    } else if (
      param !== "longitude" &&
      param !== "latitude" &&
      param !== "radius"
    ) {
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
    const stationParamsDict = buildParamsDict(params, stationParams);
    // Query stations
    if (Object.keys(stationParamsDict).length === 0) {
      // If no params provided, get all stations
      stations = await stationRepository.search().return.all({ pageSize: 100 });
    } else {
      // Query stations based on station params
      stations = await buildStationQuery(stationParamsDict).return.all({
        pageSize: 100,
      });
    }
    // Return null if list is empty
    return stations.length === 0 ? null : stations;
  } catch (error: any) {
    throw new Error("Error searching stations: " + error.message);
  }
}

// Export search functions
export default { searchStationById, searchStations };
