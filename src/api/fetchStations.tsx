import axios from 'axios';

// Store the station data IDs in these arrays
const stationList: string[] = [];

// Store the station data location: long, lat and alt in these arrays
const stationLocation: { longitude: number, latitude: number, altitude: number }[] = [];

//Store the station data name in these arrays
const stationName: string[] = [];
let isLoading = true;

// Main method to fetch the stations data - Will use the cached data if available
async function fetchStations() {
  // localStorage.removeItem('stationData');
  try {
    const cachedData = localStorage.getItem('stationData');
    if (cachedData) {
      const stationData = JSON.parse(cachedData);
      processStationData(stationData);
      console.log('Using cached station data');
    } else {
      const response = await axios.get('https://tie.digitraffic.fi/api/tms/v1/stations');
      const stationData = response.data.features.map((feature: any) => {
        const { id, geometry, properties } = feature;
        return { id, geometry, properties };
      });
      console.log(stationData[0])
      processStationData(stationData);
      console.log(stationName[0])

      // Store the updated data in local storage
      localStorage.setItem('stationData', JSON.stringify(stationData));
      console.log('Using fetched station data');
    }
  } catch (error) {
    console.error('Error fetching station data:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

// Process the station data and store it in the predefined arrays - which will be accessed in Root
function processStationData(stationData: any) {
  for (const station of stationData) {
    stationList.push(station.id.toString());
    const [longitude, latitude, altitude] = station.geometry.coordinates;
    stationLocation.push({ latitude, longitude, altitude });
    stationName.push(station.properties.name);
  }
}


export { stationLocation, isLoading, stationName, stationList, fetchStations };
