import { LocalStorage } from 'node-localstorage';
/**Using node-localstorage as a temporary checking methods */
// Create an instance of LocalStorage
const localStorage = new LocalStorage('./scratch');
// Retrieve the lastFetchTime from localStorage
export const lastFetchTime = localStorage.getItem('lastFetchTime');

// Get the current date
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
const currentDay = currentDate.getDate();

const currentTime = new Date();

// Check if the lastFetchTime exists and if 5 minutes have passed
export function checkFetchTime() {
    if(!lastFetchTime){
        console.log("No lastFetchTime found in localStorage. Start fetching...\n");
        localStorage.setItem('lastFetchTime', (currentTime.getMinutes()-5).toString());
        return true;
    }
    else {
        {
            const lastFetchDate = new Date(parseInt(lastFetchTime, 10));
            const lastFetchYear = lastFetchDate.getFullYear();
            const lastFetchMonth = lastFetchDate.getMonth();
            const lastFetchDay = lastFetchDate.getDate();
            const timeDiff = currentTime.getTime() - parseInt(lastFetchTime, 10);
        
            // 5 minutes is equal to 300,000 milliseconds
            const fiveMinutesInMs = 5 * 60 * 1000;
        
            if ((timeDiff > fiveMinutesInMs) || 
                (lastFetchYear === currentYear &&
                lastFetchMonth === currentMonth &&
                lastFetchDay === currentDay - 1) ) {
                // 5 minutes or more have passed since the last fetch
                console.log('5 minutes or more have passed since the last fetch.');
                localStorage.setItem('lastFetchTime', currentTime.toString());
                return true;
            } else {
                // Less than 5 minutes have passed since the last fetch
                console.log('Less than 5 minutes have passed since the last fetch.');
                // Update the lastFetchTime in localStorage with the current time
                return false;
            }
        }
    }
}
