import express from 'express';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import redis from '../../scripts/redis/searchData';

// Set up the router
export const stations = express.Router()

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
 *         example: 24607
 *         description: Station ID.
 *         required: true
 *       - in: query
 *         name: includeSensors
 *         schema:
 *           type: boolean
 *           enum: [true, false]
 *         default: true
 *         description: True by default. If set to true, sensor values are attached to each station. If set to false, only IDs of sensors are returned.
 *         required: false
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
 *                   name:
 *                     type: string
 *                     description: Station name.
 *                     example: vt1_Karnainen
 *                   dataUpdatedTime:
 *                     type: string
 *                     format: date-time
 *                     description: UTC timestamp of the latest station data.
 *                     example: 2023-05-30T15:13:26.000Z
 *                   coordinates:
 *                     type: string
 *                     description: Station longitude and latitude coordinates.
 *                     example:
 *                       longitude: 24.079464
 *                       latitude: 60.289063
 *                   roadNumber:
 *                     type: integer
 *                     description: Number of a road, where the station is located.
 *                     example: 1
 *                   roadSection:
 *                     type: integer
 *                     description: Section of a road, where the station is located.
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
 *                     description: Municipality, where the station is located.
 *                     example: Lohja
 *                   municipalityCode:
 *                     type: integer
 *                     description: Municipality code.
 *                     example: 444
 *                   province:
 *                     type: string
 *                     description: Province, where the station is located.
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
 *                   sensors:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: Sensor ID.
 *                           example: 5119
 *                         stationId:
 *                           type: integer
 *                           description: Station ID.
 *                           example: 24607
 *                         name:
 *                           type: string
 *                           description: Sensor name.
 *                           example: OHITUKSET_5MIN_LIUKUVA_SUUNTA2
 *                         timeWindowStart:
 *                           type: string
 *                           format: date-time
 *                           description: UTC timestamp of the latest measurement start datetime.
 *                           example: 2023-06-23T08:58:21.000Z
 *                         timeWindowEnd:
 *                           type: string
 *                           format: date-time
 *                           description: UTC timestamp of the latest measurement end datetime.
 *                           example: 2023-06-23T08:58:21.000Z
 *                         measuredTime:
 *                           type: string
 *                           format: date-time
 *                           description: UTC timestamp of the latest sensor value.
 *                           example: 2023-06-23T08:58:21.000Z
 *                         unit:
 *                           type: string
 *                           description: Sensor measurement unit.
 *                           example: kpl/h
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Sensor value.
 *                           example: 100
 *       404:
 *         description: Station is not found.
 *       500:
 *         description: Internal server error.
 */
stations.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    // Get includeSensors bool
    const includeSensors = req.query.includeSensors === 'false' ? false : true;
    // Get params
    const id = req.params.id;
    // Search data based on the provided params
    try {
        const data = await redis.searchStationById(id, includeSensors);
        // If no data is found, respond with the 404 status code
        if (data === null) {
            const error: any = new Error(`Station is not found.`);
            error.statusCode = StatusCodes.NOT_FOUND;
            throw error;
        }
        // Set the content type to JSON
        res.setHeader('Content-Type', 'application/json');
        // Respond with the 200 status code
        res.status(StatusCodes.OK).send(data);
    } catch (err) {
        // Pass the error to the error handling middleware
        next(err);
    }
});

/**
 * @swagger
 * /stations:
 *   get:
 *     summary: Retrieve a list of stations.
 *     description: Retrieve a list of stations including sensor values for each station. If no parameters provided, all stations are retrieved.
 *     parameters:
 *       - in: query
 *         name: includeSensors
 *         schema:
 *           type: boolean
 *           enum: [true, false]
 *         default: true
 *         description: True by default. If set to true, sensor values are attached to each station. If set to false, only IDs of sensors are returned.
 *         required: false
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
 *         description: Query stations based on a road number.
 *       - in: query
 *         name: roadSection
 *         schema:
 *           type: integer
 *         example: 12
 *         description: Query stations based on a road section.
 *       - in: query
 *         name: municipalityCode
 *         schema:
 *           type: integer
 *         example: 444
 *         description: Query stations based on a municipality code.
 *       - in: query
 *         name: provinceCode
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Query stations based on a province code.
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         example: 5119
 *         description: Query stations based on a sensor id.
 *         required: false
 *       - in: query
 *         name: measuredTimeOnAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         example: 2020-05-30T15:13:26.000Z
 *         description: Query stations based on the last measured UTC timestamp. Returns stations with sensor values measured on or after the defined datetime. Can be used in combination with measuredTimeOnBefore to define a range.
 *         required: false
 *       - in: query
 *         name: measuredTimeOnBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         example: 2030-05-30T15:13:26.000Z
 *         description: Query stations based on the last measured UTC timestamp. Returns stations with sensor values measured on or before the defined datetime. Can be used in combination with measuredTimeOnAfter to define a range.
 *         required: false
 *       - in: query
 *         name: valueGte
 *         schema:
 *           type: number
 *           format: float
 *         example: 10
 *         description: Query stations based on the value of a sensor. Returns stations with sensor values greater or equal to the defined value. Can be used in combination with ValueLte to define a range.
 *         required: false
 *       - in: query
 *         name: valueLte
 *         schema:
 *           type: number
 *           format: float
 *         example: 5000
 *         description: Query stations based on the value of a sensor. Returns stations with sensor values less or equal to the defined value. Can be used in combination with ValueGte to define a range.
 *         required: false
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
 *                   name:
 *                     type: string
 *                     description: Station name.
 *                     example: vt1_Karnainen
 *                   dataUpdatedTime:
 *                     type: string
 *                     format: date-time
 *                     description: UTC timestamp of the latest station data.
 *                     example: 2023-05-30T15:13:26.000Z
 *                   coordinates:
 *                     type: string
 *                     description: Station longitude and latitude coordinates.
 *                     example:
 *                       longitude: 24.079464
 *                       latitude: 60.289063
 *                   roadNumber:
 *                     type: integer
 *                     description: Number of a road, where the station is located.
 *                     example: 1
 *                   roadSection:
 *                     type: integer
 *                     description: Section of a road, where the station is located.
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
 *                     description: Municipality, where the station is located.
 *                     example: Lohja
 *                   municipalityCode:
 *                     type: integer
 *                     description: Municipality code.
 *                     example: 444
 *                   province:
 *                     type: string
 *                     description: Province, where the station is located.
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
 *                   sensors:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: Sensor ID.
 *                           example: 5119
 *                         stationId:
 *                           type: integer
 *                           description: Station ID.
 *                           example: 24607
 *                         name:
 *                           type: string
 *                           description: Sensor name.
 *                           example: OHITUKSET_5MIN_LIUKUVA_SUUNTA2
 *                         timeWindowStart:
 *                           type: string
 *                           format: date-time
 *                           description: UTC timestamp of the latest measurement start datetime.
 *                           example: 2023-06-23T08:58:21.000Z
 *                         timeWindowEnd:
 *                           type: string
 *                           format: date-time
 *                           description: UTC timestamp of the latest measurement end datetime.
 *                           example: 2023-06-23T08:58:21.000Z
 *                         measuredTime:
 *                           type: string
 *                           format: date-time
 *                           description: UTC timestamp of the latest sensor value.
 *                           example: 2023-06-23T08:58:21.000Z
 *                         unit:
 *                           type: string
 *                           description: Sensor measurement unit.
 *                           example: kpl/h
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Sensor value.
 *                           example: 100
 *       404:
 *         description: Stations are not found.
 *       500:
 *         description: Internal server error.
 */
stations.get('/', async (req: Request, res: Response, next: NextFunction) => {
    // Get includeSensors bool
    const includeSensors = req.query.includeSensors === 'false' ? false : true;
    // Get query params dictionary
    const params = req.query;
    // TODO Check params before passing to search
    // ------------------------------------------
    // Search data based on the provided params
    try {
        const data = await redis.searchStations(params, includeSensors);
        // If no data is found, respond with the 404 status code
        if (data == null) {
            const error: any = new Error(`No stations found.`);
            error.statusCode = StatusCodes.NOT_FOUND;
            throw error;
        }
        // Set the content type to JSON
        res.setHeader('Content-Type', 'application/json');
        // Respond with the 200 status code
        res.status(StatusCodes.OK).send(data);
    } catch (err) {
        // Pass the error to the error handling middleware
        next(err);
    }
});

// Error handling middleware
stations.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err)
    // Determine an appropriate status code based on the error
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    // Return the error message with the appropriate status code
    res.setHeader('Content-Type', 'application/json');
    const errorResponse = {
        error: err.message,
        statusCode: statusCode,
    };
    res.status(statusCode).json(errorResponse);
});