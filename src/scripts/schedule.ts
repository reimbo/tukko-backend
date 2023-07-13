// Delay in milliseconds
export async function delayBy(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Schedule a script with rate in milliseconds
export async function scheduleScript(
  script: () => Promise<void>,
  startDelay: number,
  rate: number
) {
  await delayBy(startDelay);
  console.log(
    `Running ${script.name} script with a rate of ${rate / 1000} seconds...`
  );
  // Run the script
  while (true) {
    await script();
    console.log(`Finished running ${script.name} script.`);
    // Wait for a specific delay using a Promise and setTimeout
    await delayBy(rate);
  }
}
