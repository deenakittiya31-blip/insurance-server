const cloudinary = require('../config/cloudinary')

exports.createImages = async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ message: 'No image' })
    }

    const result = await cloudinary.uploader.upload(image, {
      public_id: `insur-${Date.now()}`,
      folder: 'insurance',
      resource_type: 'image'
    })

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
}

exports.uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'line-doc',
                resource_type: 'image',
                format: 'jpg'
            },
            (err, result) => {
                if (err) reject(err)
                else resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id
                })
            }
        ).end(buffer)
    })
}

exports.removeImages = async (req, res) => {
  try {
    const { logo_public_id } = req.body

    if (!logo_public_id) {
      return res.status(400).json({ message: 'no public_id' })
    }

    await cloudinary.uploader.destroy(logo_public_id)

    res.json({ msg: 'remove image successfully' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'server error' })
  }
}