import { ParsedQs } from 'qs';
import { stationRepository, sensorRepository } from './client';

// Set allowed params for each object type
const stationParams = ['roadNumber', 'roadSection', 'municipalityCode', 'provinceCode', 'longitude', 'latitude', 'radius'];
const sensorParams = ['id', 'measuredTimeOnAfter', 'measuredTimeOnBefore', 'valueLte', 'valueGte'];

// Search for a station by ID
async function searchStationById(id: string, includeSensors: string) {
    try {
        // Query a station based on ID
        const stationEntity = await stationRepository.fetch(id);
        // Return null if object is empty
        if (Object.keys(stationEntity).length === 0) return null;
        const station: any[] = [stationEntity];
        // Convert includeSensors into bool
        const includeSensorsBool = includeSensors === 'false' ? false : true;
        // Update station with sensor values
        await updateStationsWithSensors(station, includeSensorsBool);
        // Return data
        return station;
    } catch (error: any) {
        throw new Error('Error searching station by ID: ' + error.message);
    }
}

// Search for stations based on provided parameters
async function searchStations(params: ParsedQs, includeSensors: string) {
    try {
        let stations: any[] = [];
        // Convert includeSensors into bool
        const includeSensorsBool = includeSensors === 'false' ? false : true;
        // Build dictionary for station params
        const stationParamsDict = buildParamsDictionary(params, stationParams);
        // Query stations
        if (Object.keys(stationParamsDict).length === 0) {
            // If no params provided, get all stations
            stations = await stationRepository.search().return.all();
            // Update stations with sensor values
            await updateStationsWithSensors(stations, includeSensorsBool);
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
                await updateStationsWithSensors(stations, includeSensorsBool);
            } else if (Object.keys(sensorParamsDict).length !== 0) {
                // If no station params are provided, query stations based on sensor params only
                // Query sensors based on sensor params
                const sensors = await buildSensorQuery(sensorParamsDict).return.all();
                // Query stations based on sensors
                stations = await queryStationsBySensors(sensors);
                // Update stations with sensor values
                await updateStationsWithSensors(stations, includeSensorsBool);
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

// Helper function to update stations with sensor values
async function updateStationsWithSensors(stations: any[], includeSensors: boolean) {
    // Update stations with sensors if includeSensors is true
    if (includeSensors) {
        for (const station of stations) {
            const sensorIds = station.sensors;
            let sensors: any[] = [];
            for (const sensorId of sensorIds) {
                const sensor = await sensorRepository.fetch(`${station.id}:${sensorId}`);
                sensors.push(sensor);
            }
            station.sensors = sensors;
        }
    }
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
    let stationIds = new Set<string>();
    for (const sensor of sensors) {
        stationIds.add(sensor.stationId);
    }
    return stationIds;
}

// Export search functions
export default { searchStationById, searchStations, searchSensors }