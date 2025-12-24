const multer = require('multer')
const path = require('path')

// ตั้งค่า storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

// (ออปชัน) กรองชนิดไฟล์
const fileFilter = (req, file, cb) => {
  const allowTypes = /jpg|jpeg|png|webp/
  const ext = allowTypes.test(path.extname(file.originalname).toLowerCase())
  const mime = allowTypes.test(file.mimetype)

  if (ext && mime) {
    cb(null, true)
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
})

module.exports = upload
