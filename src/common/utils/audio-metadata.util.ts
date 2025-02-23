export interface AudioDuration {
  durationSeconds: number;
  minutes: number;
  seconds: number;
  usageMinutes: number; // rounded up to the next full minute for subscription usage
  durationText: string;
}

export function extractAudioDuration(durationSeconds: number): AudioDuration {
  if (!durationSeconds) {
    throw new Error("Could not determine audio duration");
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);
  const usageMinutes = Math.floor((durationSeconds / 60) * 100) / 100;
  const durationText = `${minutes}m ${seconds}s`;
  return { durationSeconds, minutes, seconds, usageMinutes, durationText };
}

// import { loadEsm } from "load-esm";

// let mm: any;
// (async () => {
//   // Dynamically loads the ESM module in a CommonJS project
//   mm = await loadEsm<typeof import("music-metadata")>("music-metadata");
// })();

// /**
//  * Extracts the duration of an audio file from its buffer.
//  * @param buffer The file buffer from multer.
//  * @param mimeType The MIME type of the file.
//  * @returns A promise that resolves with the audio duration details.
//  */
// export async function extractAudioDuration(
//   buffer: Buffer,
//   mimeType: string,
// ): Promise<AudioDuration> {
//   // Parse the file buffer using music-metadata
//   // const { parseBuffer } = await import("music-metadata");

//   const metadata = await mm.parseBuffer(buffer, mimeType, { duration: true });
//   const durationSeconds = metadata.format.duration;

//   if (!durationSeconds) {
//     throw new Error("Could not determine audio duration");
//   }

//   const minutes = Math.floor(durationSeconds / 60);
//   const seconds = Math.round(durationSeconds % 60);
//   // For subscription usage, it’s common to round up to the next full minute.
//   const usageMinutes = Math.ceil(durationSeconds / 60);

//   return { durationSeconds, minutes, seconds, usageMinutes };
// }
