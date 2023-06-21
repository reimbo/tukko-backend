import { LocalStorage } from 'node-localstorage';

// Create an instance of LocalStorage
const localStorage = new LocalStorage('./scratch');

// Retrieve the lastFetchTime from localStorage
export const lastFetchTime = localStorage.getItem('lastFetchTime');

// Get the current date
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
const currentDay = currentDate.getDate();

// Check if the lastFetchTime exists and if 5 minutes have passed
export function checkFetchTime() {
    if (!lastFetchTime) {
        console.log("No lastFetchTime found in localStorage. Start fetching...\n");
        const fiveMinutesAgo = new Date(currentDate.getTime() - 5 * 60 * 1000);
        localStorage.setItem('lastFetchTime', fiveMinutesAgo.toString());
        return true;
    } else {
        const lastFetchDate = new Date(lastFetchTime);
        const lastFetchYear = lastFetchDate.getFullYear();
        const lastFetchMonth = lastFetchDate.getMonth();
        const lastFetchDay = lastFetchDate.getDate();
        const timeDiff = currentDate.getTime() - lastFetchDate.getTime();
        console.log(`timeDiff: ${timeDiff}`);

        const fiveMinutesInMs = 5 * 60 * 1000;

        if (
            timeDiff > fiveMinutesInMs ||
            (lastFetchYear === currentYear &&
                lastFetchMonth === currentMonth &&
                lastFetchDay === currentDay - 1)
        ) {
            // 5 minutes or more have passed since the last fetch
            console.log('5 minutes or more have passed since the last fetch.');
            // Update the lastFetchTime in localStorage with the current time
            localStorage.setItem('lastFetchTime', currentDate.toString());
            return true;
        } else {
            // Less than 5 minutes have passed since the last fetch
            console.log('Less than 5 minutes have passed since the last fetch.');
            return false;
        }
    }
}
