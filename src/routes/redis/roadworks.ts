import express from "express";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import redis from "../../scripts/redis/searchRoadworks";
import { validateRoadworkQueryParams } from "./queryValidation";

// Compress responses using gzip
import zlib from "zlib";

// Set up the router
export const roadworks = express.Router();

/**
 * @swagger
 * /roadworks:
 *   get:
 *     summary: Retrieve a list of road works.
 *     description: Retrieve a list of road works. If no parameters are provided, all road works are retrieved.
 *     parameters:
 *       - in: query
 *         name: primaryPointRoadNumber
 *         schema:
 *           type: integer
 *         description: Query road works based on a primary point's road number.
 *         required: false
 *         example: 8102
 *       - in: query
 *         name: primaryPointRoadSection
 *         schema:
 *           type: integer
 *         description: Query road works based on a primary point's road section. If secondaryPointRoadNumber is defined and primaryPointRoadNumber equals secondaryPointRoadNumber, use primaryPointRoadSection and secondaryPointRoadSection to define a range between sections.
 *         required: false
 *         example: 1
 *       - in: query
 *         name: secondaryPointRoadNumber
 *         schema:
 *           type: integer
 *         description: Query road works based on a secondary point's road number.
 *         required: false
 *         example: 8102
 *       - in: query
 *         name: secondaryPointRoadSection
 *         schema:
 *           type: integer
 *         description: Query road works based on a secondary point's road section. If secondaryPointRoadNumber is defined and primaryPointRoadNumber equals secondaryPointRoadNumber, use primaryPointRoadSection and secondaryPointRoadSection to define a range between sections.
 *         required: false
 *         example: 5
 *       - in: query
 *         name: startTimeOnAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Query road works based on the start time UTC timestamp. Returns road works started on or after the defined datetime. Can be used in combination with startTimeOnBefore to define a range.
 *         required: false
 *         example: 2020-05-30T15:13:26.000Z
 *       - in: query
 *         name: startTimeOnBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Query road works based on the start time UTC timestamp. Returns road works started on or before the defined datetime. Can be used in combination with startTimeOnAfter to define a range.
 *         required: false
 *         example: 2030-05-30T15:13:26.000Z
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, HIGH, HIGHEST]
 *         description: Query road works based on severity of the disruption to traffic.
 *         required: false
 *         example: HIGH
 *     responses:
 *       200:
 *         description: A list of road works.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Road work ID.
 *                     example: GUID50414315
 *                   primaryPointRoadNumber:
 *                     type: integer
 *                     description: Road ID of the primary point.
 *                     example: 8102
 *                   primaryPointRoadSection:
 *                     type: integer
 *                     description: Road section of the primary point.
 *                     example: 1
 *                   secondaryPointRoadNumber:
 *                     type: integer
 *                     description: Road ID of the secondary point.
 *                     example: 8102
 *                   secondaryPointRoadSection:
 *                     type: integer
 *                     description: Road section of the secondary point.
 *                     example: 1
 *                   direction:
 *                     type: string
 *                     description: Affected road direction.
 *                     enum:
 *                       - UNKNOWN
 *                       - POS
 *                       - NEG
 *                       - BOTH
 *                     example: BOTH
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                     description: Start time UTC timestamp of the road work.
 *                     example: 2023-06-23T08:58:21.000Z
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                     description: End time UTC timestamp of the road work.
 *                     example: 2023-06-23T08:58:21.000Z
 *                   severity:
 *                     type: string
 *                     description: Severity of the disruption to traffic. How severely this road work phase disrupts traffic. LOW - no disruption, HIGH - disruption, HIGHEST - significant disruption.
 *                     enum:
 *                       - LOW
 *                       - HIGHEST
 *                       - HIGH
 *                     example: HIGH
 *                   workingHours:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         weekday:
 *                           type: string
 *                           description: Weekday.
 *                           example: MONDAY
 *                         startTime:
 *                           type: string
 *                           description: Start time.
 *                           example: 07:00:00
 *                         endTime:
 *                           type: string
 *                           description: End time.
 *                           example: 17:00:00
 *                   workTypes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           description: Type of work that is carried out.
 *                           example: ROAD_SURFACE_MARKING
 *                         description:
 *                           type: string
 *                           description: Work description.
 *                           example: Tiemerkintätyö
 *                   restrictions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           description: Restriction type.
 *                           example: SINGLE_ALTERNATE_LINE_TRAFFIC
 *                         name:
 *                           type: string
 *                           description: Restriction name.
 *                           example: Liikenne ohjataan vuorotellen tapahtumapaikan ohi
 *                         quantity:
 *                           type: number
 *                           format: double
 *                           description: Quantity, e.g. 30 (30 km/h).
 *                           example: 30
 *                         unit:
 *                           type: string
 *                           description: Quantity unit.
 *                           example: km/h
 *       400:
 *         description: Invalid parameter value.
 *       404:
 *         description: Road works are not found.
 *       500:
 *         description: Internal server error.
 */
roadworks.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get query params dictionary
    const params = req.query;
    // Validate query parameters
    validateRoadworkQueryParams(params);
    // Search data based on the provided params
    let data = await redis.searchRoadworks(params);
    // If no data is found, respond with the 404 status code
    if (data === null) {
      const error: any = new Error(`No road works found.`);
      error.error = "Not Found";
      error.statusCode = StatusCodes.NOT_FOUND;
      throw error;
    }
    
    const gzdata: Buffer = zlib.gzipSync(JSON.stringify(data))
    
    // Set the appropriate headers
    res.set({
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    });
    
    // Send the response
    res.status(StatusCodes.OK).send(gzdata);
  } catch (err) {
    // Pass the error to the error handling middleware
    next(err);
  }
});

// Error handling middleware
roadworks.use((err: any, _req: Request, res: Response) => {
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
