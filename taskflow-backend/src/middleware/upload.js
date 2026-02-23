// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { upload: uploadConfig } = require('../config/environment');

// Asegurar que el directorio de uploads existe
if (!fs.existsSync(uploadConfig.path)) {
  fs.mkdirSync(uploadConfig.path, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadConfig.path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedTypes.test(file.mimetype);

  if (mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: uploadConfig.maxSize
  },
  fileFilter: fileFilter
});

module.exports = upload;