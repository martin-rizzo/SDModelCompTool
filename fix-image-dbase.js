#!/usr/bin/env node
//  NodeJS code to fix the images and data contained 'public/model-prompts'
//
//  https://github.com/martin-rizzo/sdcompare-web
//  by Martin Rizzo

requireModules([ 'fs', 'path', 'sharp' ]);
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');
styledLog('check', 'all modules loaded successfully');


const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHUNK_SIZE_LENGTH = 4;
const CHUNK_TYPE_LENGTH = 4;
const CHUNK_CRC_LENGTH = 4;
const TEXT_CHUNK_TYPE = 'tEXt';


//--------------------------------- HELPERS --------------------------------

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
 * Logs messages with different styles.
 * @param {string} style - The style of message: check, warn, error, wait.
 * @param {string} message - The message to be logged.
 */
function styledLog(style, message) {
  if (style === 'check') {
    console.log(' \x1b[32m%s\x1b[0m', `✓ ${message}`);
  } else if (style === 'warn') {
    console.log(' \x1b[33m%s\x1b[0m', `! ${message}`);
  } else if (style === 'error') {
    console.log(' \x1b[31m%s\x1b[0m', `x ${message}`);
  } else if (style === 'wait') {
    console.log(' \x1b[33m%s\x1b[0m', `. ${message}...`);
  } else {
    console.log(message);
  }
}

function requireModules(modules) {
  for (let module of modules) {
    try { require(module); } catch (err) {
      console.error('  The sharp library is not installed.');
      console.error('  Please make sure the module is installed by running ' +
                    `"npm install ${module}"`);
      process.exit(1);
    }
  }
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

/**
 * Calls the given callback function for each file in the specified directory
 * with the specified extension (if provided), or for all files in the
 * directory (if no extension is provided).
 *
 * @param {function} callback  - The callback function to call for each file.
 *                               This function should take the file path as
 * @param {string}  directory  - The directory to search for files.
 * @param {string} [extension] - The file extension to search for (optional).
 *                               If no extension is provided, the callback
 *                               function will be called for all files in the
 *                               directory.
 */
function forEachFile(callback, directory, extension = '*') {
  const fs = require('fs');
  const path = require('path');

  fs.readdirSync(directory).forEach((file) => {
    const filePath = path.join(directory, file);
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);

    if (fs.statSync(filePath).isDirectory()) {
      forEachFile(callback, filePath, extension);
    } else if (extension === '*' || fileExtension === extension.toLowerCase()) {
      callback(filePath);
    }
  });
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


function convertToJPG(filePath) {
  console.log(`Processing file: ${filePath}`);
  const inputPath = path.resolve(filePath);
  const outputPath = path.resolve(`${path.dirname(inputPath)}/${path.basename(inputPath, '.png')}.jpg`);
  sharp(inputPath)
    .jpeg()
    .toFile(outputPath)
    .then(() => {
      console.log(`The file ${inputPath} was successfully converted to ${outputPath}.`);
    })
    .catch((error) => {
      console.error(`An error occurred while converting the file ${inputPath}: ${error}`);
    });
}

//================================= START =================================//


forEachFile(convertToJPG, 'public/model-prompts', 'png');

