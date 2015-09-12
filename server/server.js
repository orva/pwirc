import path from 'path'
import express from 'express'

const app = express()
app.use(express.static(path.join(__dirname, '../dist')))

const server = app.listen(31337, () => {
  console.log('server starter, port 31337')
})
