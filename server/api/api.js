const {getDestinationPath} = require('../../src/helper.js');
const {basename, join, extname, normalize} = require('node:path');
const {R_OK} = require('node:fs/promises').constants;
const {createReadStream} = require('node:fs');
const {access} = require('node:fs/promises');
const errors = require('./errors.js');
const router = require('express').Router;
const archiver = require('archiver');
const multer = require('multer');
const getSize = require('./getSize.js');
const {ipcMain} = require('electron');

const api = router();

api.get('/download/files/single', async (req, res) => {
  const {filepath} = req.query;

  if (!filepath) {
    res.status(400).json({
      error: errors.missigQueryParameter('filepath'),
    });
    return;
  }
  const filename = basename(filepath);

  // check if we have access for the file
  try {
    await access(filepath, R_OK);
  } catch (error) {
    res.status(422).json({error: error.message});
    return;
  }

  res.set({
    'Content-type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  const filesize = await getSize.getFileSize(filepath);

  if (filesize === null) {
    res.setHeader('Transfer-Encoding', 'chunked');
  } else {
    res.setHeader('Content-Length', `${filesize}`);
  }

  let streamOptions = undefined;

  const {range} = req.headers;
  if (range && filesize) {
    const [start, end] = range.replace('bytes=', '').split('-').map(Number);
    const chunkSize = end ? end - start + 1 : 0;
    res.set({
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end || filesize - 1}/${filesize}`,
    });
    res.setHeader('Content-Length', chunkSize.toString());
    streamOptions = {start, end: end ? end : filesize - 1};
  }
  filestream = createReadStream(filepath, streamOptions);

  req.on('error', () => filestream.destroy());

  filestream
      .on('end', () => {
        filestream.close();
        res.status(200).end('\n\n');
      })
      .on('error', (err) => {
        filestream.destroy();
        res.status(500).json({error: err.message});
      });

  filestream.pipe(res);
});

api.post('/download/files/multiple', async (req, res) => {
  const {filepaths} = req.body;

  if (!filepaths) {
    res.status(400).json({error: errors.missigQueryParameter('filepaths')});
    return;
  }
  const archive = archiver('zip', {store: true, zlib: {level: 0}});

  filepaths?.forEach((path) => {
    path = normalize(path);
    archive.append(createReadStream(path), {name: basename(path)});
  });

  [archive, req].forEach((obj) => obj.on('error', (err) => {
    archive.destroy();
    res.status(500);
    console.error(err);
  }));

  archive.on('finish', archive.destroy);
  res.set({
    'x-filename': 'files.zip',
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="files.zip"`,
    'Transfer-Encoding': 'chuncked',
  });

  archive.pipe(res);
  archive.finalize();
});


api.get('/download/folder/single', async (req, res) => {
  if (!req.query.folderpath) {
    res.status(400).json({err: errors.missigQueryParameter('folderpath')});
    return;
  }

  /** @type {string} */
  const folderpath = normalize(req.query.folderpath);
  const foldername = basename(folderpath);
  const archive = archiver('zip', {store: true, zlib: {level: 0}});

  // calcualting size of folder in bytes
  // and adding the folder to archiver
  archive.directory(folderpath, foldername);
  archive.on('error', (err) => {
    archive.destroy();
    res.status(500).json({err: err.message});
  });
  archive.on('finish', archive.destroy);
  res.on('error', archive.destroy);

  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachemnt; filename="${foldername}.zip"`,
    'x-filename': `${foldername}.zip`,
    'Transfer-Encoding': 'chuncked',
  });

  archive.pipe(res);
  archive.finalize();
});


/**
 * genrates a uinque filename recusive
 * @param {string} dest
 * @param {string} originalname
 * @param {string} extension
 * @param {string} filenameWithoutExtension
 * @param {number} count
 * @return {Promise<string>}
 */
function genrateOrignalName(dest, originalname, extension,
    filenameWithoutExtension, count) {
  return new Promise(async (resolve) => {
    // if file is accessible then it already exists so
    // we have to rename it to new name to avoid
    // replacment of previous file
    try {
      await access(join(dest, originalname), R_OK);

      // file is found so recusively
      // append count at end of file
      // and check for new file
      resolve(await genrateOrignalName(
          dest,
          // try with new name by adding number at end of name
          `${filenameWithoutExtension}_${count + 1}${extension}`,
          extension,
          filenameWithoutExtension,
          count + 1));

      // rejection means the file does't exist
      // so resolve the promise with newfilename
    } catch {
      if (count > 0) {
        resolve(`${filenameWithoutExtension}_${count}${extension}`);
      } else {
        resolve(originalname);
      }
    }
  });
}

const uploadProgressMiddleware = (req, res, next) => {
  if (!req.headers['content-length']) return next();

  const totalBytes = parseInt(req.headers['content-length']);
  let uploadedBytes = 0;

  req.on('data', (chunk) => {
    uploadedBytes += chunk.length;
    ipcMain.emit('update-upload-progress', uploadedBytes, totalBytes);
  });

  next();
};

const uploadFiles = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, getDestinationPath());
    },

    filename(req, file, cb) {
      const ext = extname(file.originalname);
      genrateOrignalName(
          getDestinationPath(),
          file.originalname,
          ext,
          basename(file.originalname, ext),
          0,
      ).then((filename) => cb(null, filename));
    },
  }),
});

api.post('/upload/files',
    uploadProgressMiddleware,
    uploadFiles.array('files'),
    (req, res) => {
      res.sendStatus(200);
      console.log('file download', getDestinationPath());
    });

module.exports.api = api;
