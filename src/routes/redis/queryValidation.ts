import { StatusCodes } from 'http-status-codes';
import { ParsedQs } from 'qs';

// Dictionary to store expected data types for each parameter of station and sensor queries
const stationParameterTypes: Record<string, string> = {
    'includeSensors': 'boolean',
    'longitude': 'number',
    'latitude': 'number',
    'radius': 'number',
    'roadNumber': 'integer',
    'roadSection': 'integer',
    'municipalityCode': 'integer',
    'provinceCode': 'integer',
    'id': 'integer',
    'measuredTimeOnAfter': 'date-time',
    'measuredTimeOnBefore': 'date-time',
    'valueGte': 'number',
    'valueLte': 'number'
};

// Dictionary to store expected data types for each parameter of station and sensor queries
const roadworkParameterTypes: Record<string, string> = {
    'roadNumber': 'integer',
    'roadSection': 'integer',
    'startTimeOnAfter': 'date-time',
    'startTimeOnBefore': 'date-time',
    'severity': 'severity-string'
};

// Helper function to check if a value is of the expected data type
function isValidType(value: string, expectedType: string) {
    if (expectedType === 'boolean') {
        return value === 'true' || value === 'false';
    } else if (expectedType === 'string') {
        return typeof value === 'string';
    } else if (expectedType === 'severity-string') {
        return (value === 'LOW' || value === 'HIGH' || value === 'HIGHEST');
    }  else if (expectedType === 'number') {
        return !isNaN(Number(value));
    } else if (expectedType === 'integer') {
        return Number.isInteger(Number(value));
    } else if (expectedType === 'date-time') {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
    }
    return false;
}

// Function to validate station query parameter types
export function validateStationQueryParams(params: ParsedQs) {
    const keys = new Set<string>(Object.keys(params));
    for (const param of keys) {
        if (param in stationParameterTypes && !isValidType(params[param] as string, stationParameterTypes[param])) {
            const error: any = new Error(`Invalid value for parameter '${param}'.`);
            error.error = 'Bad Request';
            error.statusCode = StatusCodes.BAD_REQUEST;
            throw error;
        }
    }
}

// Function to validate roadwork query parameter types
export function validateRoadworkQueryParams(params: ParsedQs) {
    const keys = new Set<string>(Object.keys(params));
    for (const param of keys) {
        if (param in roadworkParameterTypes && !isValidType(params[param] as string, roadworkParameterTypes[param])) {
            const error: any = new Error(`Invalid value for parameter '${param}'.`);
            error.error = 'Bad Request';
            error.statusCode = StatusCodes.BAD_REQUEST;
            throw error;
        }
    }
}