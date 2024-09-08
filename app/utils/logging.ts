
/**
 * Log a message to the console, and return the data to keep the promise chain going
 * 
 * @param data the resolved data passed in 
 * @param message message to log to the console
 * @returns the data passed in (@param data)
 */
export function promiseLog(data: any, message: string): Promise<any> {
  console.log(message);
  return Promise.resolve(data);
}