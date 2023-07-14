import express from "express";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import redis from "../../scripts/redis/searchStations";
import {
  validateStationQueryParams,
  throwValidationError,
} from "./queryValidation";
import lastUpdateTimestamp from "../../scripts/redis/lastUpdateTimestamp";

// Set up the router
export const stations = express.Router();

/**
 * @swagger
 * /stations/{id}:
 *   get:
 *     summary: Retrieve a station.
 *     description: Retrieve a station including its sensor values.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: Station ID.
 *         example: 24607
 *         required: true
 *     responses:
 *       200:
 *         description: A station.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Station ID.
 *                   example: 24607
 *                 tmsNumber:
 *                   type: integer
 *                   description: Station TMS number.
 *                   example: 1607
 *                 dataUpdatedTime:
 *                   type: string
 *                   format: date-time
 *                   description: UTC timestamp of the latest station data.
 *                   example: 2023-05-30T15:13:26.000Z
 *                 name:
 *                   type: string
 *                   description: Station name.
 *                   example: vt1_Karnainen
 *                 names:
 *                   type: object
 *                   description: Station name in different languages.
 *                   example:
 *                     fi: Tie 1 Karnainen
 *                     sv: Väg 1 Karnais
 *                     en: Road 1 Karnainen
 *                 collectionStatus:
 *                   type: string
 *                   description: Station collection status.
 *                   enum:
 *                     - GATHERING
 *                     - REMOVED_TEMPORARILY
 *                     - REMOVED_PERMANENTLY
 *                   example: GATHERING
 *                 coordinates:
 *                   type: object
 *                   description: Station longitude and latitude coordinates.
 *                   example:
 *                     longitude: 24.079464
 *                     latitude: 60.289063
 *                 roadNumber:
 *                   type: integer
 *                   description: Number of a road, where the station is located.
 *                   example: 1
 *                 roadSection:
 *                   type: integer
 *                   description: Section of a road, where the station is located.
 *                   example: 12
 *                 carriageway:
 *                   type: string
 *                   description: Carriageway.
 *                   example: DUAL_CARRIAGEWAY_RIGHT_IN_INCREASING_DIRECTION
 *                 side:
 *                   type: string
 *                   description: Road address side information.
 *                   example: LEFT
 *                 municipality:
 *                   type: string
 *                   description: Municipality, where the station is located.
 *                   example: Lohja
 *                 municipalityCode:
 *                   type: integer
 *                   description: Municipality code.
 *                   example: 444
 *                 province:
 *                   type: string
 *                   description: Province, where the station is located.
 *                   example: Uusimaa
 *                 provinceCode:
 *                   type: integer
 *                   description: Province code.
 *                   example: 1
 *                 direction1Municipality:
 *                   type: string
 *                   description: Municipality in the increasing direction of the road.
 *                   example: Turku
 *                 direction1MunicipalityCode:
 *                   type: integer
 *                   description: Municipality code.
 *                   example: 853
 *                 direction2Municipality:
 *                   type: string
 *                   description: Municipality in the decreasing direction of the road.
 *                   example: Helsinki
 *                 direction2MunicipalityCode:
 *                   type: integer
 *                   description: Municipality code.
 *                   example: 91
 *                 freeFlowSpeed1:
 *                   type: integer
 *                   description: Free flow speed to direction 1 [km/h].
 *                   example: 95
 *                 freeFlowSpeed2:
 *                   type: integer
 *                   description: Free flow speed to direction 1 [km/h].
 *                   example: 95
 *       400:
 *         description: Invalid parameter value.
 *       404:
 *         description: Station is not found.
 *       500:
 *         description: Internal server error.
 */
stations.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get params
      const id = req.params.id;
      // Search data based on the provided params
      const data = await redis.searchStationById(id);
      // If no data is found, respond with the 404 status code
      if (data === null) {
        const error: any = new Error(`Station is not found.`);
        error.error = "Not Found";
        error.statusCode = StatusCodes.NOT_FOUND;
        throw error;
      }
      // Set the content type to JSON
      res.setHeader("Content-Type", "application/json");
      // Respond with the 200 status code
      res.status(StatusCodes.OK).send(data);
    } catch (err) {
      // Pass the error to the error handling middleware
      next(err);
    }
  }
);

/**
 * @swagger
 * /stations:
 *   get:
 *     summary: Retrieve a list of stations.
 *     description: Retrieve a list of stations including sensor values for each station. If no parameters are provided, all stations are retrieved.
 *     parameters:
 *       - in: query
 *         name: lastUpdated
 *         schema:
 *           type: bool
 *           enum: [true, false]
 *         description: If parameter is given, result will contain only update timestamp for stations.
 *         required: false
 *         example: false
 *       - in: query
 *         name: collectionStatus
 *         schema:
 *           type: string
 *           enum: [GATHERING, REMOVED_TEMPORARILY, REMOVED_PERMANENTLY]
 *         description: Query stations based on collection status.
 *         required: false
 *         example: GATHERING
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           format: float
 *         example: 24
 *         description: Query stations based on longitude coordinates. Latitude and radius range must be defined in addition to the longitude.
 *         required: false
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           format: float
 *         example: 60
 *         description: Query stations based on latitude coordinates. Longitude and radius range must be defined in addition to the latitude.
 *         required: false
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           format: float
 *         example: 50
 *         description: Query stations based on radius range in kilometers. Longitude and latitude must be defined in addition to the radius.
 *         required: false
 *       - in: query
 *         name: roadNumber
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Query stations based on a road number. Array params supported.
 *       - in: query
 *         name: roadSection
 *         schema:
 *           type: integer
 *         example: 12
 *         description: Query stations based on a road section. Array params supported.
 *       - in: query
 *         name: municipalityCode
 *         schema:
 *           type: integer
 *         example: 444
 *         description: Query stations based on a municipality code. Array params supported.
 *       - in: query
 *         name: provinceCode
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Query stations based on a province code. Array params supported.
 *     responses:
 *       200:
 *         description: A list of stations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Station ID.
 *                     example: 24607
 *                   tmsNumber:
 *                     type: integer
 *                     description: Station TMS number.
 *                     example: 1607
 *                   dataUpdatedTime:
 *                     type: string
 *                     format: date-time
 *                     description: UTC timestamp of the latest station data.
 *                     example: 2023-05-30T15:13:26.000Z
 *                   name:
 *                     type: string
 *                     description: Station name.
 *                     example: vt1_Karnainen
 *                   names:
 *                     type: object
 *                     description: Station name in different languages.
 *                     properties:
 *                       fi:
 *                         type: string
 *                         example: Tie 1 Karnainen
 *                       sv:
 *                         type: string
 *                         example: Väg 1 Karnais
 *                       en:
 *                         type: string
 *                         example: Road 1 Karnainen
 *                   collectionStatus:
 *                     type: string
 *                     description: Station collection status.
 *                     enum:
 *                         - GATHERING
 *                         - REMOVED_TEMPORARILY
 *                         - REMOVED_PERMANENTLY
 *                     example: GATHERING
 *                   coordinates:
 *                     type: object
 *                     description: Station longitude and latitude coordinates.
 *                     properties:
 *                       longitude:
 *                         type: string
 *                         example: 24.079464
 *                       latitude:
 *                         type: string
 *                         example: 60.289063
 *                   roadNumber:
 *                     type: integer
 *                     description: Number of a road where the station is located.
 *                     example: 1
 *                   roadSection:
 *                     type: integer
 *                     description: Section of a road where the station is located.
 *                     example: 12
 *                   carriageway:
 *                     type: string
 *                     description: Carriageway.
 *                     example: DUAL_CARRIAGEWAY_RIGHT_IN_INCREASING_DIRECTION
 *                   side:
 *                     type: string
 *                     description: Road address side information.
 *                     example: LEFT
 *                   municipality:
 *                     type: string
 *                     description: Municipality where the station is located.
 *                     example: Lohja
 *                   municipalityCode:
 *                     type: integer
 *                     description: Municipality code.
 *                     example: 444
 *                   province:
 *                     type: string
 *                     description: Province where the station is located.
 *                     example: Uusimaa
 *                   provinceCode:
 *                     type: integer
 *                     description: Province code.
 *                     example: 1
 *                   direction1Municipality:
 *                     type: string
 *                     description: Municipality in the increasing direction of the road.
 *                     example: Turku
 *                   direction1MunicipalityCode:
 *                     type: integer
 *                     description: Municipality code.
 *                     example: 853
 *                   direction2Municipality:
 *                     type: string
 *                     description: Municipality in the decreasing direction of the road.
 *                     example: Helsinki
 *                   direction2MunicipalityCode:
 *                     type: integer
 *                     description: Municipality code.
 *                     example: 91
 *                   freeFlowSpeed1:
 *                     type: integer
 *                     description: Free flow speed to direction 1 [km/h].
 *                     example: 95
 *                   freeFlowSpeed2:
 *                     type: integer
 *                     description: Free flow speed to direction 1 [km/h].
 *                     example: 95
 *       400:
 *         description: Invalid parameter value.
 *       404:
 *         description: Stations are not found.
 *       500:
 *         description: Internal server error.
 */
stations.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get query params dictionary
    const params = req.query;
    let data = null;
    // Check for lastUpdated bool
    const lastUpdated = params["lastUpdated"];
    if (lastUpdated && lastUpdated === "true") {
      data = await lastUpdateTimestamp.stationTimestamp;
    } else if (lastUpdated && lastUpdated !== "false") {
      throwValidationError("lastUpdated");
    } else {
      // Validate query parameters
      validateStationQueryParams(params);
      // Search data based on the provided params
      data = await redis.searchStations(params);
      // If no data is found, respond with the 404 status code
      if (data == null) {
        const error: any = new Error(`No stations found.`);
        error.error = "Not Found";
        error.statusCode = StatusCodes.NOT_FOUND;
        throw error;
      }
    }
    // Set the content type to JSON
    res.setHeader("Content-Type", "application/json");
    // Respond with the 200 status code
    res.status(StatusCodes.OK).send(data);
  } catch (err) {
    // Pass the error to the error handling middleware
    next(err);
  }
});

// Error handling middleware
stations.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  // Determine an appropriate status code based on the error
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  // Return the error message with the appropriate status code
  res.setHeader("Content-Type", "application/json");
  const errorResponse = {
    statusCode: statusCode,
    error: statusCode === 500 ? "Internal Server Error" : err.error,
    message: err.message,
  };
  res.status(statusCode).json(errorResponse);
});
