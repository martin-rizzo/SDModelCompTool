//  Util functions used by 'imagedb.js'
//  https://github.com/martin-rizzo/SDModelCompTool
//  by Martin Rizzo
const fs   = require('fs');
const path = require('path');

const TRASH_DIR = 'deleted_files/';

//--------------------------- HELPER FUNCTIONS ----------------------------//

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

/**
 * Modifies the file extension of a file path.
 * @param {string} filePath - The file path to modify.
 * @param {string} extension - The new extension to set.
 * @returns {string} - The modified file path with the new extension.
 */
function modifyFilePathExtension(filePath, extension) {
  if (extension === undefined) { return filePath; }
  if (!extension.startsWith('.')) { extension = '.' + extension; }
  const dotIndex = filePath.lastIndexOf('.');
  if (dotIndex !== -1) {
    var modifiedPath = filePath.slice(0, dotIndex) + extension;
  } else {
    var modifiedPath = filePath + extension;
  }
  return modifiedPath;
}

/**
 * Returns a unique file name based on the path to the original file.
 * If a file with the same name already exists, a number is added to the
 * end of the name until a file name that is not in use is found.
 *
 * If 'extension1' is provided, the function searches for a unique file name
 * with that extension. If both 'extension1' and 'extension2' are provided,
 * it searches for a unique file name that is available with both extensions.
 *
 * @param {string} filePath     - Path to the original file.
 * @param {string} [extension1] - Optional ext to use for the new file.
 * @param {string} [extension2] - Optional second ext to use for the new file.
 * @returns {string} - Path to the file with unique name.
*/
function findUniqueFileName(filePath, extension1, extension2) {
  const parsedPath = path.parse(filePath);
  if (extension1 === undefined) { extension1 = parsedPath.ext; }
  let newFilePath1 = modifyFilePathExtension(filePath, extension1);
  let newFilePath2 = modifyFilePathExtension(filePath, extension2);
  let i = 1;
  while (fs.existsSync(newFilePath1) ||
         (extension2 !== undefined && fs.existsSync(newFilePath2)))
  {
    newFilePath1 = path.join(
      parsedPath.dir, `${parsedPath.name}-${i}${extension1}`
    );
    if (extension2 !== undefined) {
      newFilePath2 = path.join(
        parsedPath.dir, `${parsedPath.name}-${i}${extension2}`
      )
    }
    i++;
  }
  return newFilePath1;
}

/**
 * Moves a file to the trash folder synchronously.
 * @param {string} filePath - The path of the file to be moved to the trash folder.
 */
function moveFileToTrashSync(filePath) {
  const shortName = getShortName(filePath);
  const fileName  = path.basename(filePath);
  const trashPath = findUniqueFileName(path.join(TRASH_DIR, fileName));
  if (!fs.existsSync(TRASH_DIR)) { fs.mkdirSync(TRASH_DIR); }
  fs.renameSync(filePath, trashPath);
  console.logx(CHECK|VERB,`file ${shortName} has been ${MOVED_TO_TRASH}`);
}

/**
 * Get a shortened version of a full path string
 * @param {string} fullPath - The full path to the file
 * @returns {string} - The shortened path (dir name + file name and extension)
 */
function getDisplayName(fullPath) {
  const lengthLimit          = 40;
  const directoryName        = path.basename(path.dirname(fullPath));
  const fileNameAndExtension = path.basename(fullPath);
  let shortenedPath = `${directoryName}/${fileNameAndExtension}`;
  if (shortenedPath.length > lengthLimit) {
    shortenedPath = `...${shortenedPath.slice(3-lengthLimit)}`;
  }
  return '"'+shortenedPath+'"';
}


module.exports = {
  crc32,
  findFiles,
  modifyFilePathExtension,
  findUniqueFileName,
  moveFileToTrashSync,
  getDisplayName
};
