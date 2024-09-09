/*
    This is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// TODO: Include source for these functions (link)

// Set up audio context
// (window as any).AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
// const audioContext = new AudioContext();

/**
 * The size of the sample we average by (in milliseconds)
 */
export const sampleSize = 50; 

/**
 * Filters the AudioBuffer retrieved from an external source
 * @param {AudioBuffer} audioBuffer the AudioBuffer from drawAudio()
 * @returns {Array} an array of floating point numbers
 */
export const filterData = (audioBuffer: AudioBuffer): Array<any> => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const rawDuration = audioBuffer.duration * 1000; // duration of the audio in milliseconds
  const samples = Math.floor(rawDuration / sampleSize) // 70; // Number of samples we want to have in our final data set
  console.log(`Raw data length: ${rawData.length}; Rate: ${audioBuffer.sampleRate} Hz; Duration: ${rawDuration} s; Samples: ${samples}`);
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
  }
  return filteredData;
};

/**
 * Normalizes the audio data to make a cleaner illustration 
 * @param {Array} filteredData the data from filterData()
 * @returns {Array} an normalized array of floating point numbers
 */
export const normalizeData = (filteredData: Array<any>): Array<any> => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
}

