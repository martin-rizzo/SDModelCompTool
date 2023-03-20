#!/usr/bin/env node
//  NodeJS code to fix the images and data contained 'public/imagedb'
//
//  https://github.com/martin-rizzo/SDModelCompTool
//  by Martin Rizzo


// imagedb directories
const IMAGEDB_DIR           = 'public/imagedb/'
const IMAGEDB_MODEL_DIR     = IMAGEDB_DIR + 'model-prompts/';
const IMAGEDB_EMBEDDING_DIR = IMAGEDB_DIR + 'embedding-prompts/'

//--------------------------- HELPER FUNCTIONS ----------------------------//

/**
 * Takes an array of module names as input and tries to require them. If any
 * of the modules cannot be required, it will log an error message and exit. 
 * @param {Array} modules - Array containing the module names to be required.
 */
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
 * Calculates the CRC32 value of a buffer or the concatenation of two buffers.
 * @param {Buffer}  buffer1  - The first buffer to process.
 * @param {Buffer} [buffer2] - The second buffer to process (optional).
 * @returns {number} The calculated CRC32 value as an unsigned integer.
 */
function crc32(buffer1, buffer2) {
  const poly = 0xEDB88320, init = 0xFFFFFFFF, xorout = 0xFFFFFFFF;
  let crc = init;
  for (let i = 0; i < buffer1.length; i++) {
    crc ^= buffer1[i]; for (let j = 0; j < 8; j++)
    { crc = (crc >>> 1) ^ (poly & (-(crc & 1))); }
  }
  if (buffer2 !== undefined) {
    for (let i = 0; i < buffer2.length; i++) {
      crc ^= buffer2[i]; for (let j = 0; j < 8; j++)
      { crc = (crc >>> 1) ^ (poly & (-(crc & 1))); }
    }    
  }
  return (crc ^ xorout) >>> 0;
}

/**
 * Searches for files in the specified directory and its subdirectories.
 * @param {string} directory - The directory to search in.
 * @param {string} filter - The file filter. Defaults to '*' (all files).
 * @returns {string[]} - An array containing the paths of the found files.
 */
function findFiles(directory, filter = '*') {
  let   results   = [];  
  const extension = (filter.startsWith('*.') ? filter.slice(2) : filter)
                    .toLowerCase();
  for (const file of fs.readdirSync(directory)) {
    const filePath = path.join(directory, file), stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat( findFiles(filePath, filter) );
    } else if (stat.isFile()) {
      if (extension === '*' ||
          extension === path.extname(filePath).toLowerCase().substring(1))
      { results.push(filePath); }
    }
  }
  return results;
}

//---------------------------- SCREEN MESSAGES ----------------------------//

const CHECK = 0, WARN = 1, ERROR = 2, WAIT = 3, VERB = 4;

/**
 * Logs messages with different styles.
 * @param {string} style - The style of message: CHECK, WARN, ERROR, WAIT.
 * @param {string} message - The message to be logged.
 */
console.logx = function (style, message) {
  const verboseMode = false;
  if (style>=VERB) {
    if (verboseMode) { style-=VERB; } else { return; }
  }
  switch (style) {
    case CHECK:
      console.log(' \x1b[32m%s\x1b[0m', `✓ ${message}`); break;
    case WARN:
      console.log(' \x1b[33m%s\x1b[0m', `! ${message}`); break;
    case ERROR:
      console.log(' \x1b[31m%s\x1b[0m', `x ${message}`); break;
    case WAIT:
      console.log(' \x1b[33m%s\x1b[0m', `. ${message}...`); break;
  }
}

//---------------------------------- PNG ----------------------------------//

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
 * Extracts all 'tEXt' chunks from a PNG file.
 * @param {string} filePath - The path of the PNG file to extract chunks from.
 * @returns {Object} An object where each property corresponds to one of the
 *    extracted 'tEXt' chunks. The property key is the keyword of the chunk
 *    and the property value is the text data of the chunk. If no 'tEXt'
 *    chunks are found, an empty object is returned.
 * @throws {Error} If the file at the provided path is not a valid PNG file
 *    or cannot be read.
 */
function extractTextFromPNG(filePath) {
  const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
  const CHUNK_SIZE_LENGTH = 4;
  const CHUNK_TYPE_LENGTH = 4;
  const CHUNK_CRC_LENGTH  = 4;
  const TEXT_CHUNK_TYPE   = 'tEXt';
  
  const fileData   = fs.readFileSync(filePath);
  const signature  = fileData.slice(0,8);
  var   textObject = {}

  if (!Buffer.from(PNG_SIGNATURE).equals(signature)) {
    throw new Error('Invalid PNG signature');
  }
  let offset = 8;
  while (offset < fileData.length)
  {
    const chunkHeader = fileData.slice(offset, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH)
    const chunkSize   = readUInt32BE(chunkHeader, 0);
    const chunkType   = chunkHeader.slice(
      CHUNK_SIZE_LENGTH, CHUNK_SIZE_LENGTH+CHUNK_TYPE_LENGTH);    
    if (chunkType.toString('ascii') === TEXT_CHUNK_TYPE)
    {
      const chunkData = fileData.slice(offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH,             offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkSize);
      const chunkCRC  = fileData.slice(offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkSize, offset + CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkSize + CHUNK_CRC_LENGTH);
      //console.log('chunkCRC:' + readUInt32BE(chunkCRC,0).toString(16));
      //console.log('crc32   :' + crc32(chunkType,chunkData).toString(16));
      if ( readUInt32BE(chunkCRC,0) != crc32(chunkType,chunkData) ) {
        throw new Error('Invalid CRC in PNG chunk');
      }
      const separatorIndex = chunkData.indexOf('\x00');
      if (separatorIndex>0) {
        const key = chunkData.slice(0, separatorIndex).toString();
        textObject[key] = chunkData.slice(separatorIndex + 1).toString();
      }
    }
    offset += CHUNK_SIZE_LENGTH + CHUNK_TYPE_LENGTH + chunkSize + CHUNK_CRC_LENGTH;
  }
  return textObject;
}

//------------------------------ OPERATIONS -------------------------------//

function convertPNGtoJPGTx(pngFilePath) {
  const text = extractTextFromPNG(pngFilePath);
  //console.log(text.parameters);
  
  /*
  console.logx(WAIT|VERB,`Processing file: ${pngFilePath}`);
  const inputPath  = path.resolve(pngFilePath);
  const outputPath = path.resolve(`${path.dirname(inputPath)}/${path.basename(inputPath, '.png')}.jpg`);
  sharp(inputPath).jpeg().toFile(outputPath)
    .then(() => {
      console.logx(CHECK,`The file ${inputPath} was successfully converted to ${outputPath}.`);
    })
    .catch((error) => {
      console.logx(ERROR,`An error occurred while converting the file ${inputPath}: ${error}`);
    });
  */
}

function verifyJPGTxName(txtFilePath) {
  
}

//================================= START =================================//

requireModules([ 'fs', 'path', 'sharp' ]);
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');
console.logx(CHECK, 'all modules loaded successfully');

// 1) convert PNG files to JPG+TXT 
//     * find a valid name for the new JPG+TXT
//     * generate TXT from PNG chunk text data
//     * generate JPG from PNG image
//     * move PNG file to trash
// 2) adjust JPG+TXT names
//     * get "model" field from TXT
//     * if "model" field do not exist -> error + move new jpg+txt to trash
//     * if "model" != filename {
//        * if "model".jpg+txt already exists -> move old jpg+txt to trash
//        * rename JPG+TXT as "model".jpg+txt
//       }
// 3) ....
//
findFiles(IMAGEDB_MODEL_DIR,'*.PNG').forEach(convertPNGtoJPGTx);
findFiles(IMAGEDB_MODEL_DIR,'*.TXT').forEach(verifyJPGTxName);
