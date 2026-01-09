const jwt = require('jsonwebtoken')

exports.authCheck = async(req, res, next) => {
    try {
        const headerToken = req.headers.authorization
        if(!headerToken){
            return res.status(401).json({message: 'No token, Authorization'})
        }

        //ตัดเอาตำแหน่ง token หลัง split =>["Bearer", "abc123xyz"]
        const token = headerToken.split(" ")[1]

        //ถอดรหัส
        const decode = jwt.verify(token, process.env.SECRET)
        console.log('DECODE JWT:', decode)

        req.user = decode

        next()
    } catch (error) {
        console.log(error.message)
        return res.status(401).json({ message: 'Token invalid or expired' })
    }
}

exports.roleCheck = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' })
  }
  next()
}