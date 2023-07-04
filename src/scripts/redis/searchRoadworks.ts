import { ParsedQs } from 'qs';
import { roadworkRepository } from './client';

// Set allowed params for road works
const roadworkParams = new Set<string>(['roadNumber', 'roadSection', 'startTimeOnAfter', 'startTimeOnBefore', 'severity']);

// Search for road works based on provided params
async function searchRoadworks(params: ParsedQs) {
    try {
        let roadworks: any[] = [];
        // Query road works
        if (Object.keys(params).length === 0) {
            // If no params provided, get all road works
            roadworks = await roadworkRepository.search().return.all();
        } else {
            // Build dictionary for road work params
            const roadworkParamsDict = buildParamsDictionary(params, roadworkParams);
            // Query road works based on params
            roadworks = await buildRoadworkQuery(roadworkParamsDict).return.all();
        }
        // Return null if list is empty
        return roadworks.length === 0 ? null : roadworks;
    } catch (error: any) {
        throw new Error('Error searching road works: ' + error.message);
    }
}

// Helper function to build a road work query based on params
function buildRoadworkQuery(paramsDict: Record<string, any>) {
    let query = roadworkRepository.search();
    for (const param in paramsDict) {
        const value = paramsDict[param];
        if (param === 'startTimeOnAfter' || param === 'startTimeOnBefore') {
            if (param === 'startTimeOnAfter') {
                query = query.and('startTime').onOrAfter(value);
            } else {
                query = query.and('startTime').onOrBefore(value);
            }
        } else if (param === 'roadNumber') {
            query = query.and((search) => search.where('primaryPointRoadNumber').equals(value).or('secondaryPointRoadNumber').equals(value));
        } else if (param === 'roadSection') {
            query = query.and((search) => search.where('primaryPointRoadSection').equals(value).or('secondaryPointRoadSection').equals(value));
        }  else {
            query = query.and(param).equals(value);
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
export default { searchRoadworks }