var express = require('express')
var bodyParser = require('body-parser')
var rabbitMQHandler = require('./connection')

var app = express()
var router = express.Router()
var server = require('http').Server(app)

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

app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api', router)
router.route('/infer').post((req, res) => {
  try {
    rabbitMQHandler(connection => {
      connection.createChannel((err, channel) => {
        if (err) {
          throw new Error(err)
        }
        var ex = 'infer'
        var msg = JSON.stringify({ task: req.body })

        channel.assertQueue(ex, { durable: false })
        channel.sendToQueue(ex, Buffer.from(msg), { noAck: false })

        channel.close(() => {
          connection.close()
        })

        setTimeout(function () {
          if (connection.isOpen()) connection.close()
        }, 10000)
      })
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

router.route('/set-result').post((req, res) => {
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

router.route('/get-all-results').get((req, res) => {
  res.status(200).send({
    message: 'success',
    results: results,
  })
})

router.route('/get-results').get((req, res) => {
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

setTimeout(() => {
  const tmpList = results.filter(el => (new Date() - el.time) / 10000 > 30)
  results = tmpList
}, 30000)

server.listen(5555, '0.0.0.0', () => {
  console.log('Running at at localhost:5555')
})
