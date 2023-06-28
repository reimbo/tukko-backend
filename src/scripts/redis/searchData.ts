import { ParsedQs } from 'qs';
import { stationRepository, sensorRepository } from './tmsModels';
import client from './client';

// Set allowed params for each object type
const stationParams = ['roadNumber', 'roadSection', 'municipalityCode', 'provinceCode', 'longitude', 'latitude', 'radius'];
const sensorParams = ['id', 'measuredTimeOnAfter', 'measuredTimeOnBefore', 'valueLte', 'valueGte'];

// Search for a station by ID
async function searchStationById(id: string, includeSensorValues: string) {
    try {
        // Connect to Redis
        await client.connect();
        // Query a station based on ID
        const station = await stationRepository.fetch(id);
        // Return null if object is empty
        if (Object.keys(station).length === 0) return null;
        // Query sensors based on the station's ID
        const sensors = await buildSensorQuery({ 'stationId': id }).return.all();
        // Convert includeSensor into bool
        const includeSensorValuesBool = includeSensorValues === 'false' ? false : true;
        // Update station with sensor values
        await updateStationWithSensorValues(station, sensors, includeSensorValuesBool);
        // Return data
        return [station];
    } catch (error: any) {
        throw new Error('Error searching station by ID: ' + error.message);
    } finally {
        // Disconnect from Redis
        await client.quit();
    }
};

// Search for stations based on provided parameters
async function searchStations(params: ParsedQs) {
    try {
        let stations: any[] = [];
        // Connect to Redis
        await client.connect();
        // Convert includeSensor into bool
        const includeSensorValues = params.includeSensorValues as string === 'false' ? false : true;
        // Build dictionary for station params
        const stationParamsDict = buildParamsDictionary(params, stationParams);
        // Query stations
        if (Object.keys(stationParamsDict).length === 0) {
            // If no params provided, get all stations with sensors
            stations = await getAllStationsWithSensors(includeSensorValues);
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
                // Update stations with sensor values
                for (const station of stations) {
                    await updateStationWithSensorValues(station, sensors, includeSensorValues);
                }
            } else if (Object.keys(sensorParamsDict).length !== 0) {
                // If no station params are provided, query stations based on sensor params only
                // Query sensors based on sensor params
                const sensors = await buildSensorQuery(sensorParamsDict).return.all();
                // Query stations based on sensors
                stations = await queryStationsBySensors(sensors);
                // Update stations with sensor values
                for (const station of stations) {
                    await updateStationWithSensorValues(station, sensors, includeSensorValues);
                }
            }
        }
        // Return null if list is empty
        return stations.length === 0 ? null : stations;
    } catch (error: any) {
        throw new Error('Error searching stations: ' + error.message);
    } finally {
        // Disconnect from Redis
        await client.quit();
    }
}

// Search for sensors based on provided params
async function searchSensors(params: ParsedQs) {
    try {
        let sensors: any[] = [];
        // Connect to Redis
        await client.connect();
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
    } finally {
        // Disconnect from Redis
        await client.quit();
    }
}

// Helper function to build a station query based on params
function buildStationQuery(paramsDict: Record<string, string>) {
    // Build a station query
    let query = stationRepository.search();
    const longitude = parseFloat(paramsDict['longitude']);
    const latitude = parseFloat(paramsDict['latitude']);
    const radius = parseFloat(paramsDict['radius']);
    // Coordinates params require unique query construction
    if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(radius)) {
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
function buildSensorQuery(paramsDict: Record<string, string>) {
    // Build a sensor query
    let query = sensorRepository.search();
    for (const param in paramsDict) {
        const value = paramsDict[param];
        if (param === 'measuredTimeOnAfter' || param === 'measuredTimeOnBefore') {
            // Convert the value to a UTC timestamp
            const utcTimestamp = new Date(value);
            if (param === 'measuredTimeOnAfter') {
                query = query.and('measuredTime').onOrAfter(utcTimestamp);
            } else {
                query = query.and('measuredTime').onOrBefore(utcTimestamp);
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
    const stations: any[] = [];
    // Get unique station IDs from the sensors
    const stationIds = getUniqueStationIds(sensors);
    // Query stations based on the list of unique station IDs
    for (const stationId of stationIds) {
        const station = await stationRepository.fetch(stationId);
        stations.push(station);
    }
    return stations;
}

// Helper function to update stations with sensor values
async function updateStationWithSensorValues(station: any, sensors: any[], includeSensorValues: boolean) {
    if (sensors.length !== 0) {
        let sensorValues: any[] = [];
        for (const sensor of sensors) {
            if (sensor.stationId === station.id) {
                if (includeSensorValues) {
                    // Push a sensor object
                    sensorValues.push(sensor);
                } else {
                    // Push a sensor ID
                    sensorValues.push(sensor.id);
                }
            }
        }
        // Update station with sensors
        station.sensorValues = sensorValues;
    }
}

// Helper function to get all stations with sensors
async function getAllStationsWithSensors(includeSensorValues: boolean) {
    // Get all stations
    const stations: any[] = await stationRepository.search().return.all();
    for (const station of stations) {
        // Get sensors for a specific station
        const sensors = await sensorRepository.search()
            .where('stationId').equals(station.id)
            .return.all();
        // Update stations with sensor values
        updateStationWithSensorValues(station, sensors, includeSensorValues);
    }
    return stations;
}

// Helper function to build a dictionary of allowed parameters
function buildParamsDictionary(params: ParsedQs, targetParams: string[]) {
    const dict: Record<string, string> = {};
    const keys: string[] = Object.keys(params);
    for (const param of keys) {
        if (targetParams.includes(param)) {
            dict[param] = params[param] as string;
        }
    }
    return dict;
}

// Helper function to create a list of unique station IDs based on provided sensors
function getUniqueStationIds(sensors: any[]) {
    // Get unique station IDs from the list of sensors
    const stationIds: string[] = [];
    for (const sensor of sensors) {
        const stationId = sensor.stationId as string;
        if (!stationIds.includes(stationId)) {
            stationIds.push(stationId);
        }
    }
    return stationIds;
}

// Export search functions
export default { searchStationById, searchStations, searchSensors }