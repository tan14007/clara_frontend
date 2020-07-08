var amqp = require('amqplib/callback_api')
var axios = require('axios')
var FormData = require('form-data')
// var Blob = require('blob')

amqp.connect('amqp://localhost', async function (error0, connection) {
  if (error0) {
    throw error0
  }
  connection.createChannel(async function (error1, channel) {
    if (error1) {
      throw error1
    }
    var queue = 'infer'

    channel.assertQueue(queue, {
      durable: true,
    })
    channel.prefetch(1)
    console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue)
    channel.consume(
      queue,
      async function (msg) {
        try {
          // console.log(' [x] Received %s', msg.content.toString())

          const payloadData = JSON.parse(msg.content.toString())
          const body = payloadData.task
          const tmp = payloadData.task.buffer.data.toString('base64')
          // console.log(body)
          console.log('Payload', String.fromCharCode.apply(null, new Uint8Array(body.buffer.data.slice(0, 1000))))
          const id = payloadData.id

          // const img = await Image.Image.load(body.task.image)
          // let grayImg = await img.grey()
          // grayImg = await grayImg.resize({
          //   width: 256,
          // })

          const payload = new FormData()

          // const blob = new Blob(body)

          // const blob = await grayImg.toBlob('image/png', 1)
          payload.append('image', body, body.originalName)

          const { data } = await axios.post('http://localhost:8080/v1/annotation?model=clara_covid_test', payload, {
            headers: { accept: 'multipart/form-data', 'Content-Type': 'multipart/form-data', params: {} },
          })

          console.log(' [x] Done, ID:', id)

          const resultPayload = new FormData()
          resultPayload.append('id', id)
          resultPayload.append('result', data.result)

          const { data: setResultData } = await axios.post('http://localhost:5555/api/set-result', payload)

          console.log(' [x] Result sent!: ', id)

          channel.ack(msg)
        } catch (e) {
          console.error('Error:', e)
        }
      },
      {
        // manual acknowledgment mode,
        // see https://www.rabbitmq.com/confirms.html for details
        noAck: false,
      },
    )
  })
})
