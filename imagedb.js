//  NodeJS code to fix the images and data contained 'public/imagedb'
//
//  https://github.com/martin-rizzo/SDModelCompTool
//  by Martin Rizzo


// imagedb directories
const IMAGEDB_DIR           = 'public/imagedb/';
const IMAGEDB_MODEL_DIR     = IMAGEDB_DIR + 'model-prompts/';
const IMAGEDB_EMBEDDING_DIR = IMAGEDB_DIR + 'embedding-prompts/';
const MOVED_TO_TRASH        = 'moved to the trash directory';

//--------------------------- HELPER FUNCTIONS ----------------------------//

Array.prototype.forEachFile = function(callback) {
  let promises = [];
  for (let i = 0; i < this.length; i++) {
    promises.push( callback(this[i]) );
  }
  return Promise.all(promises);
};

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

//---------------------------- SCREEN MESSAGES ----------------------------//

const CHECK = 0, WARN = 1, ERROR = 2, WAIT = 3, VERB = 4, VVV = 5;

/**
 * Logs messages with different styles.
 * @param {string} style - The style of message: CHECK, WARN, ERROR, WAIT.
 * @param {string} message - The message to be logged.
 */
console.logx = function (style, message, description) {
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
  if (description !== undefined) {
    console.log(`   ${description}`);
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
      //console.log('crc32   :' + utils.crc32(chunkType,chunkData).toString(16));
      if ( readUInt32BE(chunkCRC,0) != utils.crc32(chunkType,chunkData) ) {
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

/**
 * Parses a string with format generated by Stable Diffussion WebUI and
 * extracts key-value pairs.
 * @param {string} webuiText - The text with format generated by SD WebUI.
 * @returns {Object} - An object with all the found keys and their
 *                     respective values set as properties.
 */
function extractWebuiParameters(webuiText) {
  const NEGATIVE_PREFIX = 'negative prompt';
  let parameters = {}, index = 0;  
  // extract prompt  
  const textLines = webuiText.split('\n');
  if (textLines[index] !== undefined) { 
    parameters['prompt'] = textLines[index];
    index++;
  }
  // extract negative prompt
  if (textLines[index] !== undefined &&
      textLines[index].toLowerCase().startsWith(NEGATIVE_PREFIX)) {
    const [name, value] = textLines[index].split(':');
    parameters['negative'] = value.trim();
    index++;
  }
  // extract extra parameters
  while (textLines[index] !== undefined && textLines[index] !== '') {
    const extraParams = textLines[index].split(',');
    extraParams.forEach( extraParam => {
      const [name, value] = extraParam.split(':');
      const propertyName = name.trim().toLowerCase().replace(/\s+/g, '_');
      parameters[propertyName] = value.trim();
    });
    index++;
  }
  return parameters;
} 

//------------------------- CONVERT PNG TO JPGTX --------------------------//

/**
 * Converts a PNG file to JPG+TXT format.
 * @param {string} pngFilePath - The path of the PNG file to convert.
 * @returns {displayName: string, errorMessage?: string}
 *   An object with a "displayName" property that is the shortened name of
 *   the PNG file for display, and an optional "errorMessage" property that
 *   is added only when an error occurs.
 */ 
async function convertPNGtoJPGTx(pngFilePath) {
  const displayName = utils.getDisplayName(pngFilePath);
  let   result      = { displayName: displayName };
  try {
    const jpgFilePath = utils.findUniqueFileName(pngFilePath,'.jpg','.txt');
    const txtFilePath = utils.modifyFilePathExtension(jpgFilePath,'.txt');
    
    console.logx(WAIT|VERB,`extracting WebUI prompt from ${displayName}`);
    const text = extractTextFromPNG(pngFilePath);
    if (text.parameters === undefined) {
      utils.moveFileToTrashSync(pngFilePath);
      throw new Error('file don´t have WebUI prompt info, '+
                      `it was ${MOVED_TO_TRASH}`);
    }
    console.logx(WAIT|VERB,`converting ${displayName} to JPG`);
    const jpgBuffer = await sharp(pngFilePath).jpeg().toBuffer();
    fs.writeFileSync(jpgFilePath, jpgBuffer);
    fs.writeFileSync(txtFilePath, text.parameters);
    utils.moveFileToTrashSync(pngFilePath);
  }
  catch (err) {
    result.errorMessage = err.message;
  }
  return result;
}

/**
 * Convert all PNG files in the specified directory to JPG+TXT format.
 * @param {string} directoryPath - The path to the directory containing PNG files.
 */
async function convertAllPNGtoJPGTx(directoryPath) {
  const pngFiles = utils.findFiles(directoryPath, '*.PNG');
  const promises = pngFiles.map(convertPNGtoJPGTx);
  const results  = await Promise.all(promises);
  if (results.length === 0) { return; }
  
  const count = results.reduce((count, result) => {
    if (result.errorMessage === undefined) {
      console.logx(CHECK,`file ${result.displayName} successfully converted to JPG+TXT`);
      count.ok++;
    } else {
      console.logx(ERROR,`file ${result.displayName} cannot be converted to JPG+TXT`,
                  result.errorMessage);
      count.error++;
    }
    return count;
  }, { ok:0, error:0 });
  //-- print final result --//
  if (count.error === 0) {
    console.logx(CHECK,`${count.ok} files converted to JPG+TXT`);
  } else {
    console.logx(WARN,`${count.ok} files converted to JPG+TXT with ${count.error} errors`);
  }
}

//--------------------------- VERIFY JPGTX NAME ---------------------------//

async function verifyJPGTxName(txtFilePath) {
  const jpgFilePath = utils.modifyFilePathExtension(txtFilePath,'.jpg');
  const displayName = utils.getDisplayName(txtFilePath);
  const fileName    = path.parse(txtFilePath).name;
  const text        = fs.readFileSync(txtFilePath,'utf-8');
  const modelHash   = extractWebuiParameters(text).model_hash;
  
  if (!fs.existsSync(jpgFilePath)) {
    console.logx(ERROR, `file ${displayName} does not have any related JPG file and will therefore be deleted`);
    utils.moveFileToTrashSync(txtFilePath);
    return;
  }
  if (modelHash === undefined) {
    console.logx(ERROR, `file ${displayName} has an unknown format and will be deleted along with its related JPG file`);
    utils.moveFileToTrashSync(txtFilePath);
    utils.moveFileToTrashSync(jpgFilePath);
    return;   
  }
  if (fileName === modelHash) {
    // nothing to do
    return;
  }
  
  const directory = path.parse(txtFilePath).dir; 
  const newJpgFilePath = path.join(directory, modelHash+'.jpg');
  const newTxtFilePath = path.join(directory, modelHash+'.txt');
  if (fs.existsSync(newJpgFilePath)) {
    utils.moveFileToTrashSync(newJpgFilePath);
    const jpgDisplayName = utils.getDisplayName(newJpgFilePath);
    console.logx(WARN, `old file ${jpgDisplayName} has been replaced by a new one`);
  }
  if (fs.existsSync(newTxtFilePath)) {
    utils.moveFileToTrashSync(newTxtFilePath);
    const txtDisplayName = utils.getDisplayName(newTxtFilePath);
    console.logx(WARN, `old file ${txtDisplayName} has been replaced by a new one`);
  }  
  fs.renameSync(jpgFilePath, newJpgFilePath);
  fs.renameSync(txtFilePath, newTxtFilePath);
  console.logx(CHECK, `file ${displayName} renamed to ${modelHash}`);
}


async function verifyAllJPGTxNames(imagedbDirectory) {
  const jpgtxFiles = utils.findFiles(imagedbDirectory,'*.JPG');
  const promises = jpgtxFiles.map(verifyJPGTxName);
  const results  = await Promise.all(promises);
}

//================================= START =================================//
requireModules([ 'fs', 'path', 'sharp' ]);
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');
const utils = require('./imagedb-utils');
console.logx(CHECK|VERB, 'all modules loaded successfully');
main()
  .then(() => {console.logx(CHECK|VERB,'program finalized without errors')})
  .catch(error => {
    console.error(error);
  });

// 1) convert PNG files to JPG+TXT 
//     X find a valid name for the new JPG+TXT
//     X generate TXT from PNG chunk text data
//     X generate JPG from PNG image
//     X send PNG file to trash
//
// 2) verify JPG+TXT names
//     X get "model" field from TXT
//     X if JPG related file do not exist -> error + move txt to trash
//     X if "model" field do not exist -> error + move new jpg+txt to trash
//     X if "model" != filename {
//        X if "model".jpg+txt already exists -> move old jpg+txt to trash
//        X rename JPG+TXT as "model".jpg+txt
//       }
// 3) make the JSON
//     - armar una lista con todos los subdirectorios
//     - agrupar los jpg en base al directorio donde se encuentran
//     - el JSON de prompts es un array donde cada elemento contiene:
//       - name  : un texto que resume de que trata el prompt
//       - subdir: el nombre del subdir que contiene las img del prompt
//       - models: un array de hashes de los modelos evaluados en ese prompt
//     - el JSON de modelos mapea hash -> model
//
async function main()
{ 
  //const pngFiles = utils.findFiles(IMAGEDB_MODEL_DIR,'*.PNG');
  //await pngFiles.forEachFile(convertPNGtoJPGTx);
  //console.logx(CHECK,`${pngFiles.length} files converted to JPG+TXT`);
  await convertAllPNGtoJPGTx(IMAGEDB_MODEL_DIR);

  const jpgtxFiles = utils.findFiles(IMAGEDB_MODEL_DIR,'*.TXT');
  await jpgtxFiles.forEachFile(verifyJPGTxName);
  console.logx(CHECK,`${jpgtxFiles.length} JPG+TXT files verified`);
}


