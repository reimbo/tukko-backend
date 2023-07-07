import { ParsedQs } from 'qs';
import { stationRepository, sensorRepository } from './client';

// Set allowed params for each object type
const stationParams = new Set<string>(['roadNumber', 'roadSection', 'municipalityCode', 'provinceCode', 'longitude', 'latitude', 'radius']);
const sensorParams = new Set<string>(['id', 'stationId', 'measuredTimeOnAfter', 'measuredTimeOnBefore', 'valueLte', 'valueGte']);

// Search for a station by ID
async function searchStationById(id: string) {
    try {
        // Query a station based on ID
        const stationEntity = await stationRepository.fetch(id);
        // Return null if object is empty
        return Object.keys(stationEntity).length === 0 ? null : [stationEntity];
    } catch (error: any) {
        throw new Error('Error searching station by ID: ' + error.message);
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
            // Build dictionaries for sensor params
            const sensorParamsDict = buildParamsDictionary(params, sensorParams);
            // Query stations based on all provided params
            if (Object.keys(stationParamsDict).length !== 0) {
                // Query sensors based on sensor params
                const sensors = await buildSensorQuery(sensorParamsDict).return.all();
                // Query stations based on sensors
                const stationSet1 = await queryStationsBySensors(sensors);
                // Query stations based on station params
                const stationSet2 = await buildStationQuery(stationParamsDict).return.all();
                // Calculate intersection of two station sets
                for (const station of stationSet1) {
                    if (stationSet2.some(st => st.id === station.id)) {
                        stations.push(station);
                    }
                }
            } else if (Object.keys(sensorParamsDict).length !== 0) {
                // If no station params are provided, query stations based on sensor params only
                // Query sensors based on sensor params
                const sensors = await buildSensorQuery(sensorParamsDict).return.all();
                // Query stations based on sensors
                stations = await queryStationsBySensors(sensors);
            }
        }
        // Return null if list is empty
        return stations.length === 0 ? null : stations;
    } catch (error: any) {
        throw new Error('Error searching stations: ' + error.message);
    }
}

// Search for sensors based on provided params
async function searchSensors(params: ParsedQs) {
    try {
        let sensors: any[] = [];
        // Query sensors
        if (Object.keys(params).length === 0) {
            // If no params provided, get all sensors
            sensors = await sensorRepository.search().return.all();
        } else {
            // Build dictionary for sensor params
            const sensorParamsDict = buildParamsDictionary(params, sensorParams);
            // Query sensors based on params
            sensors = await buildSensorQuery(sensorParamsDict).return.all();
        }
        // Return null if list is empty
        return sensors.length === 0 ? null : sensors;
    } catch (error: any) {
        throw new Error('Error searching sensors: ' + error.message);
    }
}

// Helper function to build a station query based on params
function buildStationQuery(paramsDict: Record<string, any>) {
    // Build a station query
    let query = stationRepository.search();
    const longitude = paramsDict['longitude'];
    const latitude = paramsDict['latitude'];
    const radius = paramsDict['radius'];
    // Coordinates params require unique query construction
    if (longitude && latitude && radius) {
        query = query.where('coordinates').inRadius(circle => circle
            .longitude(longitude)
            .latitude(latitude)
            .radius(radius)
            .kilometers);
    }
    // Other params
    for (const param in paramsDict) {
        if (param != 'longitude' && param != 'latitude' && param != 'radius') {
            query = query.and(param).equals(paramsDict[param]);
        }
    }
    return query;
}

// Helper function to build a sensor query based on params
function buildSensorQuery(paramsDict: Record<string, any>) {
    // Build a sensor query
    let query = sensorRepository.search();
    for (const param in paramsDict) {
        const value = paramsDict[param];
        if (param === 'measuredTimeOnAfter' || param === 'measuredTimeOnBefore') {
            if (param === 'measuredTimeOnAfter') {
                query = query.and('measuredTime').onOrAfter(value);
            } else {
                query = query.and('measuredTime').onOrBefore(value);
            }
        } else if (param === 'valueGte') {
            query = query.and('value').gte(value);
        } else if (param === 'valueLte') {
            query = query.and('value').lte(value);
        } else {
            query = query.and(param).equals(value);
        }
    }
    return query;
}

// Helper function to query stations based on sensor params
async function queryStationsBySensors(sensors: any[]) {
    let stations: any[] = [];
    // Get unique station IDs from the sensors
    const stationIds = getUniqueStationIds(sensors);
    // Query stations based on the list of unique station IDs
    for (const stationId of stationIds) {
        const station = await stationRepository.fetch(stationId);
        stations.push(station);
    }
    return stations;
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

// Helper function to create a list of unique station IDs based on provided sensors
function getUniqueStationIds(sensors: any[]) {
    // Get unique station IDs from the list of sensors
    let stationIds = new Set<string>();
    for (const sensor of sensors) {
        stationIds.add(sensor.stationId);
    }
    return stationIds;
}

// Export search functions
export default { searchStationById, searchStations, searchSensors }