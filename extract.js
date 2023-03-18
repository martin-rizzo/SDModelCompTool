#!/usr/bin/env node

const fs = require('fs');

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHUNK_SIZE_LENGTH = 4;
const CHUNK_TYPE_LENGTH = 4;
const CHUNK_CRC_LENGTH = 4;
const TEXT_CHUNK_TYPE = 'tEXt';

function readChunkHeader(chunkData) {
  const chunkSize = readUInt32BE(chunkData, 0);
  const chunkType = chunkData.slice(CHUNK_SIZE_LENGTH, CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH).toString('ascii');
  return { size: chunkSize, type: chunkType };
}


function extractChunks(filePath) {
  const fileData = fs.readFileSync(filePath);
  const signature = fileData.slice(0, 8);
  if (!Buffer.from(PNG_SIGNATURE).equals(signature)) {
    throw new Error('Invalid PNG signature');
  }

  const chunks = [];
  let offset = 8;
  while (offset < fileData.length) {
    const chunkHeader = readChunkHeader(fileData.slice(offset, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH));
    const chunkData = fileData.slice(offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size);
    const chunkCRC = fileData.slice(offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size + CHUNK_CRC_LENGTH);
    offset += CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size + CHUNK_CRC_LENGTH;

    const chunk = { type: chunkHeader.type, length: chunkHeader.size, data: chunkData };
    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Reads an unsigned 32-bit integer from a buffer at the specified offset,
 * using big-endian byte order.
 * @param {Buffer} buffer - The buffer to read from.
 * @param {number} offset - The offset in the buffer to start reading from.
 * @returns {number} The unsigned 32-bit integer value read from the buffer.
 */
function readUInt32BE(buffer, offset) {
  return (buffer.readUInt8(offset    ) << 24) +
         (buffer.readUInt8(offset + 1) << 16) +
         (buffer.readUInt8(offset + 2) <<  8) +
         (buffer.readUInt8(offset + 3)      ) >>> 0;
}

/**
 * Calculates the CRC-32 checksum for the given buffer.
 * @param {Buffer} buffer - The buffer data to calculate the checksum for.
 * @returns {number} - The CRC-32 checksum as an unsigned 32-bit integer.
 */
function crc32(buffer) {
  const poly = 0xEDB88320, init = 0xFFFFFFFF, xorout = 0xFFFFFFFF;
  let crc = init;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) { crc = (crc >>> 1) ^ (poly & (-(crc & 1))); }
  }
  return (crc ^ xorout) >>> 0;
}



function extractTextFromPNG(filePath) {
  const fileData   = fs.readFileSync(filePath);
  const signature  = fileData.slice(0,8);
  var   textObject = {}

  if (!Buffer.from(PNG_SIGNATURE).equals(signature)) {
    throw new Error('Invalid PNG signature');
  }
  let offset = 8;
  while (offset < fileData.length)
  {
    const chunkHeader = readChunkHeader(fileData.slice(offset, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH));
    if (chunkHeader.type === TEXT_CHUNK_TYPE) {
      const chunkTypeData = fileData.slice(offset + CHUNK_SIZE_LENGTH, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size);
      const chunkCRC      = fileData.slice(offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size + CHUNK_CRC_LENGTH);
      if ( readUInt32BE(chunkCRC,0) != crc32(chunkTypeData) ) {
        throw new Error('Invalid CRC in PNG chunk');
      }
      const chunkData      = chunkTypeData.slice(CHUNK_TYPE_LENGTH);
      const separatorIndex = chunkData.indexOf('\x00');
      if (separatorIndex>0) {
        const key = chunkData.slice(0, separatorIndex).toString();
        textObject[key] = chunkData.slice(separatorIndex + 1).toString();
      }
    }
    offset += CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkHeader.size + CHUNK_CRC_LENGTH;
  }
  return textObject;
}

// Example usage:
const text = extractTextFromPNG("example.png");
console.log(text.parameters);
