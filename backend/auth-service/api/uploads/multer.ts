import multer from "multer";
import path from "path";
import fs from "fs";

/*
========================================
CREATE REAL UPLOADS FOLDER
========================================
*/

const uploadPath = path.join(
  process.cwd(),
  "api",
  "uploads"
);

if (
  !fs.existsSync(uploadPath)
) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

/*
========================================
STORAGE
========================================
*/

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(null, uploadPath);
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const safeName =
        file.originalname
          .replace(/\s+/g, "-")
          .replace(/[^\w.-]/g, "");

      cb(
        null,
        `${Date.now()}-${safeName}`
      );
    },
  });

/*
========================================
UPLOAD
========================================
*/

export const upload =
  multer({
    storage,
  });