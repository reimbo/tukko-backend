import { StatusCodes } from 'http-status-codes';
import { ParsedQs } from 'qs';

// Dictionary to store expected data types for each parameter
const parameterTypes: Record<string, string> = {
    'includeSensors': 'boolean',
    'longitude': 'number',
    'latitude': 'number',
    'radius': 'number',
    'roadNumber': 'integer',
    'roadSection': 'integer',
    'municipalityCode': 'integer',
    'provinceCode': 'integer',
    'id': 'integer',
    'measuredTimeOnAfter': 'string',
    'measuredTimeOnBefore': 'string',
    'valueGte': 'number',
    'valueLte': 'number'
};

// Helper function to check if a value is of the expected data type
function isValidType(value: string, expectedType: string) {
    if (expectedType === 'boolean') {
        return value === 'true' || value === 'false';
    } else if (expectedType === 'string') {
        return typeof value === 'string';
    } else if (expectedType === 'number') {
        return !isNaN(Number(value));
    } else if (expectedType === 'integer') {
        return Number.isInteger(Number(value));
    } else if (expectedType === 'date-time') {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
    }
    return false;
}

// Function to validate query parameter types
export function validateQueryParams(params: ParsedQs) {
    const keys = new Set<string>(Object.keys(params));
    for (const param of keys) {
        if (param in parameterTypes && !isValidType(params[param] as string, parameterTypes[param])) {
            const error: any = new Error(`Invalid value for parameter '${param}'.`);
            error.error = 'Bad Request';
            error.statusCode = StatusCodes.BAD_REQUEST;
            throw error;
        }
    }
}