const du = require('du');
const {normalize} = require('node:path');
const {R_OK} = require('node:fs/promises').constants;
const {access, stat} = require('node:fs/promises');

/**
 * returns folder size if err resolves with null
 * it always resolves
 * @param {string} path
 * @return {Promise<number | null>}
 */
async function getFolderSize(path) {
  return new Promise((resolve) => {
    du(normalize(path)).then(resolve).catch(() => resolve(null));
  });
}

/**
 * returns size of files in bytes
 * if err resolves with null, it is
 * always resolved
 * @param {Array<string>} paths
 * @return {Promise<number | null>}
 */
async function getSizeOfMultipleFiles(paths) {
  return new Promise(async (resolve) => {
    try {
      const filestats = await Promise.all(paths.map((path) => stat(path)));
      resolve(
          filestats
              .map((stat) => stat.size)
              .reduce((prev, curr) => prev + curr),
      );
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * returns file size in bytes and if folder or error
 * it returns null but no error is thrown
 * @param {string} path
 * @return {Promise<number | null>}
*/
async function getFileSize(path) {
  return new Promise(async (resolve) => {
    path = normalize(path);
    try {
      await access(path, R_OK);
      const stats = await stat(path);
      resolve(stats.size);
    } catch (error) {
      resolve(null);
    }
  });
}

module.exports = {getFolderSize, getFileSize, getSizeOfMultipleFiles};
