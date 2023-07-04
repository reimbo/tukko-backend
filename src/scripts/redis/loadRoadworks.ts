require('dotenv').config();
const axios = require('axios').default;
import { AxiosResponse } from 'axios';
import { client, roadworkRepository } from './client';

// Define the URLs for fetching road work data
const urlRoadworks = (process.env.TM_ROADWORKS_DATA_URL || 'https://tie.digitraffic.fi/api/traffic-message/v1/messages') as string;

// Configuration for Axios request
const axiosConf = {
    headers: {
        clientName: "WIMMA-lab/IoTitude/Travis"
    }
};

// Global helper variables
// Latest timestap of road work data update time
let roadworksUpdateTimestamp = new Date(0);

// Function to load road works
async function loadRoadworks(url: string) {
    let roadworksCount = 0;
    try {
        console.log('REDIS: Fetching and storing road works...');
        // Fetch data
        const response: AxiosResponse = await axios.get(
            url, {
            ...axiosConf,
            params: {
                situationType: 'ROAD_WORK',
                includeAreaGeometry: false
            }
        });
        const fetchedDataTimestamp = new Date(response.data.dataUpdatedTime);
        // Check if data has been updated
        if (fetchedDataTimestamp > roadworksUpdateTimestamp) {
            roadworksUpdateTimestamp = fetchedDataTimestamp;
            // Save road works to the repository
            for (const feature of response.data.features) {
                for (const announcement of feature.properties.announcements) {
                    for (const roadwork of announcement.roadWorkPhases) {
                        // Check if roadAddressLocation exists
                        const primaryPoint = roadwork.locationDetails.roadAddressLocation ? roadwork.locationDetails.roadAddressLocation.primaryPoint : null;
                        const secondaryPoint = roadwork.locationDetails.roadAddressLocation ? roadwork.locationDetails.roadAddressLocation.secondaryPoint : null
                        // Set entity ID as "roadworkID"
                        const id = `${roadwork.id}`;
                        await roadworkRepository.save(id, {
                            id: roadwork.id,
                            primaryPointRoadNumber: primaryPoint ? primaryPoint.roadAddress.road : null,
                            primaryPointRoadSection: primaryPoint ? primaryPoint.roadAddress.roadSection : null,
                            secondaryPointRoadNumber: secondaryPoint ? secondaryPoint.roadAddress.road : null,
                            secondaryPointRoadSection: secondaryPoint ? secondaryPoint.roadAddress.roadSection : null,
                            direction: roadwork.locationDetails.roadAddressLocation ? roadwork.locationDetails.roadAddressLocation.direction : null,
                            startTime: roadwork.timeAndDuration.startTime,
                            endTime: roadwork.timeAndDuration.endTime,
                            severity: roadwork.severity
                        });
                        // Generate a list of restrictions for the road work
                        let restrictions: any[] = [];
                        for (const restriction of roadwork.restrictions) {
                            const newRestriction = {
                                type: restriction.type,
                                name: restriction.restriction.name,
                                quantity: restriction.restriction.quantity,
                                unit: restriction.restriction.unit
                            };
                            restrictions.push(newRestriction);
                        }
                        // Append nested JSON objects to the road work key
                        client.json.set(`roadwork:${id}`, '$.workingHours', roadwork.workingHours);
                        client.json.set(`roadwork:${id}`, '$.workTypes', roadwork.workTypes);
                        client.json.set(`roadwork:${id}`, '$.restrictions', restrictions);

                        const ttlInSeconds = Math.floor((new Date(roadwork.timeAndDuration.endTime).getTime() - new Date().getTime()) / 1000);
                        // Set time to live for the road work key
                        await roadworkRepository.expire(id, ttlInSeconds);
                        roadworksCount++;
                    }
                }
            }
        } else {
            console.log('REDIS: Database already contatins the latest road work data.');
        }
    } catch (error: any) {
        throw new Error('Error loading road works: ' + error.message);
    } finally {
        console.log(`REDIS: Stored ${roadworksCount} road works.`);
    }
}

// Export the function loading road work data
export async function loadRoadworkData() {
    await loadRoadworks(urlRoadworks);
}