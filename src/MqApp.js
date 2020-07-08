var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
var rabbitMQHandler = require('./connection')

var app = express()
var router = express.Router()
var server = require('http').Server(app)
var multer = require('multer')
var storage = multer.memoryStorage()
var upload = multer({ storage })

var crypto = require('crypto')

rabbitMQHandler(connection => {
  try {
    connection.createChannel((err, channel) => {
      if (err) {
        throw new Error(err)
      }
    })
  } catch (e) {
    console.error("Can't connect to message queue", e)
  }
})

let results = []

app.use(cors())
app.use(bodyParser.json({ extended: true, limit: '3mb' }))
app.use('/api', router)

app.post('/api/infer', upload.single('image'), (req, res, err) => {
  try {
    // upload(req, res, err => {
    //   console.error('Upload Error:', err)
    //   throw err
    // })
    const id = crypto.randomBytes(20).toString('hex')
    rabbitMQHandler(connection => {
      connection.createChannel((err, channel) => {
        if (err) {
          throw new Error(err)
        }
        var ex = 'infer'
        var msg = JSON.stringify({ task: req.file, id })

        console.log('***Request***\n\n', req.file)

        channel.assertQueue(ex, { durable: true })
        channel.sendToQueue(ex, Buffer.from(msg), { noAck: false, persistent: true })

        channel.close(() => {
          connection.close()
        })

        // setTimeout(function () {
        //   if (connection && connection.isOpen()) connection.close()
        // }, 10000)
      })
    })
    res.status(200).send({
      message: 'success',
      id,
    })
  } catch (e) {
    console.error(e)
    res.status(400).send({
      message: e,
    })
  }
})

// app.use(bodyParser.json({ extended: true, limit: '3mb' }))

router.route('/set-result').post(upload.none(), (req, res) => {
  try {
    results.push({
      id: req.body.id,
      result: req.body.result,
      time: new Date(),
    })
    res.status(200).send({
      message: 'success',
    })
  } catch (e) {
    res.status(400).send({
      message: e,
    })
  }
})

router.route('/get-all-results').get(upload.none(), (req, res) => {
  res.status(200).send({
    message: 'success',
    results: results,
  })
})

router.route('/get-results').get(upload.none(), (req, res) => {
  try {
    const el = results.reverse().find(el => el.id === req.query.id)
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    })

    res.flushHeaders()
    setTimeout(() => {
      res.write(
        `data: ${JSON.stringify({
          message: 'success',
          result: {
            id: el.id,
            confidence: el.result,
          },
        })}\n\n`,
      )
    }, 3000)
  } catch (e) {
    res.status(400).send({
      message: e,
    })
  }
})

clearResults = () => {
  setTimeout(() => {
    const tmpList = results.filter(el => (new Date() - el.time) / 10000 > 30)
    results = tmpList
    return clearResults()
  }, 30000)
}

clearResults()

server.listen(5555, '0.0.0.0', () => {
  console.log('Running at at localhost:5555')
})
