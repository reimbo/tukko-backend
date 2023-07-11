import { StatusCodes } from "http-status-codes";
import { ParsedQs } from "qs";

// Dictionary to store expected data types for each parameter of station and sensor queries
const stationParameterTypes: Record<string, string> = {
  collectionStatus: "collectionStatus",
  longitude: "number",
  latitude: "number",
  radius: "number",
  roadNumber: "integer",
  roadSection: "integer",
  municipalityCode: "integer",
  provinceCode: "integer",
};

// Dictionary to store expected data types for each parameter of road work queries
const roadworkParameterTypes: Record<string, string> = {
  primaryPointRoadNumber: "integer",
  primaryPointRoadSection: "integer",
  secondaryPointRoadNumber: "integer",
  secondaryPointRoadSection: "integer",
  startTimeOnAfter: "date-time",
  startTimeOnBefore: "date-time",
  severity: "severity",
};

// Helper function to check if a value is of the expected data type
function isValidType(value: string, expectedType: string) {
  if (expectedType === "boolean") {
    return value === "true" || value === "false";
  } else if (expectedType === "string") {
    return typeof value === "string";
  } else if (expectedType === "collectionStatus") {
    return value === "GATHERING" || value === "REMOVED_TEMPORARILY" || value === "REMOVED_PERMANENTLY ";
  } else if (expectedType === "severity") {
    return value === "LOW" || value === "HIGH" || value === "HIGHEST";
  } else if (expectedType === "number") {
    return !isNaN(Number(value));
  } else if (expectedType === "integer") {
    return Number.isInteger(Number(value));
  } else if (expectedType === "date-time") {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }
  return false;
}

// Helper function to throw the 400 status code error
function throwValidationError(param: string) {
  const error: any = new Error(`Invalid value for parameter '${param}'.`);
  error.error = "Bad Request";
  error.statusCode = StatusCodes.BAD_REQUEST;
  throw error;
}

// Helper function to validate query params using passed parameter types
function validateQueryParams(
  params: ParsedQs,
  parameterTypes: Record<string, any>
) {
  const keys = new Set<string>(Object.keys(params));
  for (const param of keys) {
    if (param in parameterTypes) {
      // Protect against arrays
      if (Array.isArray(params[param])) {
        const values: any = params[param];
        for (const value in values) {
          if (!isValidType(value as string, parameterTypes[param]))
            throwValidationError(param);
        }
      } else {
        const value = params[param] as string;
        if (!isValidType(value, parameterTypes[param]))
          throwValidationError(param);
      }
    }
  }
}

// Function to validate station query parameter types
export function validateStationQueryParams(params: ParsedQs) {
  validateQueryParams(params, stationParameterTypes);
}

// Function to validate roadwork query parameter types
export function validateRoadworkQueryParams(params: ParsedQs) {
  validateQueryParams(params, roadworkParameterTypes);
}
