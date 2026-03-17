const db = require('../config/database')

exports.getLineSecret = async() => {
  const result = await db.query('select secret_config from config where id = 1')
  return result.rows[0]
}

exports.getLineSecret = async() => {
  const result = await db.query('select secret_config from config where id = 1')
  return result.rows[0]
}

exports.getLineChanell = async() => {
  const result = await db.query('select secret_config from config where id = 4')
  return result.rows[0]
}

exports.getOcrSecret = async() => {
  const result = await db.query('select secret_config from config where id = 3')
  return result.rows[0]
}