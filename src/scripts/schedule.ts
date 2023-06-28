// Delay in milliseconds
export async function delayBy(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Schedule a script with rate in milliseconds
export async function scheduleScript(script: () => Promise<void>, startDelay: number, rate: number) {
    await delayBy(startDelay);
    while (true) {
        // Run the script
        console.log(`Running ${script.name} script...`);
        await script();
        // Wait for a specific delay using a Promise and setTimeout
        await delayBy(rate);
    }
}