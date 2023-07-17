const axios = require("axios").default;
import { StationData } from "models/tms_data_model";
import { AxiosResponse } from "axios";

require("dotenv").config();

const axiosConf = {
  headers: {
    clientName: "WIMMA-lab/IoTitude/Tuko",
  },
};

export const fetch = async (url: String) => {
  try {
    const tmsData_response: AxiosResponse = await axios.get(url, axiosConf);
    const tmsStation_response: AxiosResponse = await axios.get(
      process.env.TMS_STATION_LIST_URL ||
        "https://tie.digitraffic.fi/api/tms/v1/stations",
      axiosConf
    );

    // Filter out station data with sensor values from tmsData_response
    const stationDataFetched = tmsData_response.data.stations.map(
      (station: any) => {
        return {
          stationId: station.id,
          dataUpdatedTime: station.dataUpdatedTime,
          tmsNumber: station.tmsNumber,
          sensorValues: station.sensorValues.map((sensor: any) => {
            return {
              stationId: sensor.stationId,
              name: sensor.name,
              shortName: sensor.shortName,
              timeWindowStart: sensor.timeWindowStart,
              timeWindowEnd: sensor.timeWindowEnd,
              measuredTime: sensor.measuredTime,
              unit: sensor.unit,
              value: sensor.value,
            };
          }),
        };
      }
    );

    // Filter out station names and coordinates from tmsStation_response
    const stationsListFetched = tmsStation_response.data.features.map(
      (location: any) => {
        return {
          id: location.id,
          geometry: {
            coordinates: location.geometry.coordinates,
          },
          properties: {
            id: location.properties.id,
            tmsNumber: location.properties.tmsNumber,
            name: location.properties.name,
            dataUpdatedTime: location.properties.dataUpdatedTime,
          },
        };
      }
    );

    // Combine the required data from both responses into one object
    const combinedData: StationData = {
      dataUpdatedTime: new Date(Date.now()).toISOString(),
      stations: stationDataFetched.map((station: any) => {
        const matchingStation = stationsListFetched.find(
          (location: any) => location.id === station.stationId
        );

        return {
          id: matchingStation.id,
          tmsNumber: station.tmsNumber,
          dataUpdatedTime: station.dataUpdatedTime,
          name: matchingStation.properties.name,
          coordinates: [
            matchingStation.geometry.coordinates[1],
            matchingStation.geometry.coordinates[0],
          ],
          sensorValues: station.sensorValues,
        };
      }),
    };

    // Return the fetched data in combined form for use in redis and mongoDB...
    return combinedData;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
