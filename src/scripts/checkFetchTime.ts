import { LocalStorage } from 'node-localstorage';

// Create an instance of LocalStorage
const localStorage = new LocalStorage('./scratch');

// Retrieve the lastFetchTime from localStorage
export const lastFetchTime = localStorage.getItem('lastFetchTime');
export let time_To_Insert_New_Data = false;

// Get the current time
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth()+1;
const currentDay = currentDate.getDate();

const currentHour = currentDate.getHours();
const currentMinute = currentDate.getMinutes();
console.log(`******\n[MongoDB] - Current date is: ${currentDay}/0${currentMonth}/${currentYear} at ${currentHour}:${currentMinute}\n**********`)

// Save the lastFetchTime to localStorage
export function setLastFetchTime(newTime: Date) {
    localStorage.setItem('lastFetchTime', newTime.toString());
}

if (!lastFetchTime) {
    console.log("\n[MongoDB] - No lastFetchTime found in localStorage. \nPlease Fetch more data...\n");
    const initialFetch = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    setLastFetchTime(initialFetch);
}
const isNewDay = (prevTime:string) => {
    const lastFetchDate = new Date(prevTime);
    const lastFetchYear = lastFetchDate.getFullYear();
    const lastFetchMonth = lastFetchDate.getMonth();
    const lastFetchDay = lastFetchDate.getDate();
    if(checkNewDayHasPassedSinceLastFetch(currentHour, currentMinute, lastFetchYear, lastFetchMonth, lastFetchDay)){
        return true;
    } else {
        return false;
    }
}

const timeDiff= (preTime:string) =>{
    const timeDiff = currentDate.getTime() - new Date(preTime).getTime();
    const timeDiffInMinutes = Math.round(timeDiff / 60000);
    console.log(`timeDiff in minutes: ${timeDiffInMinutes} \n**********`);
    return timeDiff;
}

// Disable new insert for the current date && Set the lastFetchTime to 5 minutes ago
export function completedInsert() {
    time_To_Insert_New_Data = false;
    const fiveMinutesAgo = new Date(currentDate.getTime() - 5 * 60 * 1000);
    setLastFetchTime(fiveMinutesAgo);
}
export function checkNewDayHasPassedSinceLastFetch(currentHour:number, currentMinute:number, lastFetchYear:number, lastFetchMonth:number, lastFetchDay:number) {
    if ((currentHour >= 9 && currentMinute>=0)&&
            (lastFetchYear <= currentYear 
            && lastFetchMonth <= currentMonth 
            && lastFetchDay < currentDay)){
                console.log("[MongoDB] - New day has passed since last fetch. \nStart fetching and inserting new record into Mongodb...\n")
                return true;
            }
    else{
        console.log("\n[MongoDB] - New day has NOT passed since last fetch. \nNew Insertion to MongoDB is disabled, \nUpdating is allowed within a 5 mins limit...\n")
        return false;
    }
}

// Check if the lastFetchTime exists and if 5 minutes have passed
export function checkFetchTime() {
    // If there is no lastFetchTime, set it to previous day and return true
    if (!lastFetchTime) {
        console.log("[MongoDB] - No lastFetchTime found in localStorage.\nStart fetching...\n");
        time_To_Insert_New_Data = true;
        return true;
    } else {
        const fiveMinutesInMs = 5 * 60 * 1000;
        if (isNewDay(lastFetchTime))
            {
                time_To_Insert_New_Data = true;
            }

        if (
            timeDiff(lastFetchTime) > fiveMinutesInMs 
        ) {
            // 5 minutes or more have passed since the last fetch
            console.log('[MongoDB] - 5 minutes or more have passed since the last fetch.\nStart fetching...\n');
            return true;
        } else {
            // Less than 5 minutes have passed since the last fetch
            console.log('[MongoDB] - Less than 5 minutes have passed since the last fetch. \nUsing saved / cached data.');
            return false;
        }
    }

}
