import React from 'react'
import { Button, Layout, Table, Menu, Upload, message, Space, Spin, Collapse, Card, Skeleton, Col, Row } from 'antd'
import { InboxOutlined, CloseCircleOutlined } from '@ant-design/icons'
import nvidia from './nvidia.png'
import chula from './chula.png'
import axios from 'axios'
import FormData from 'form-data'
import './App.css'
import Image from 'image-js'
import moment from 'moment'
import positive_1 from './positive_1.jpg'
import positive_2 from './positive_2.jpg'
import positive_3 from './positive_3.jpg'
import negative_1 from './negative_1.png'
import negative_2 from './negative_2.png'
import negative_3 from './negative_3.png'
import mindLogo from './datamind.png'

const apiPath = 'http://localhost:5555/api'

const { Header, Content, Sider } = Layout
const { Dragger } = Upload
const { Panel } = Collapse

class App extends React.Component {
  constructor(props) {
    console.log(process.env)
    super(props)
    try {
      this.state = {
        images: [],
        results: new Object({}),
        pendingResults: new Object({}),
        loading: false,
        activeMenu: '1',
      }
    } catch (e) {
      console.error(e)
      message.error('Error occured, please refresh the page: ', e)
    }
  }
  handleSubmit = async () => {
    this.setState({ loading: true })

    this.state.images.map(async (im, idx) => {
      if (this.state.pendingResults.hasOwnProperty(im.uid)) return

      let payload = new FormData()
      try {
        const img = await Image.load(im.base64)
        let grayImg = await img.grey()
        grayImg = await grayImg.resize({
          width: 256,
        })

        const blob = await grayImg.toBlob('image/png', 1)

        payload.append('image', await grayImg.toDataURL())

        const { data } = await axios.post(apiPath + '/infer', payload, {})

        let eventSource = new EventSource(apiPath + '/get-results?id=' + data.id)
        eventSource.onmessage = e => {
          console.log('Message', JSON.parse(e.data))
          const result = JSON.parse(e.data).result
          this.state.results[result.id] = Number(result.confidence)
          eventSource.removeEventListener('message', eventSource)
          this.forceUpdate()
        }

        this.state.pendingResults[im.file.uid] = data.id
        this.forceUpdate()
      } catch (e) {
        console.error(e)
        message.error(`Image ${im.filename} can't be processed`)
      }
    })
    this.setState({ loading: false })
    this.forceUpdate()
  }

  render() {
    const uploadProps = {
      name: 'file',
      multiple: true,
      action: file => {
        const reader = new FileReader()
        let fileContent = ''
        reader.onloadend = e => {
          fileContent = String(reader.result)
          this.setState(prevState => {
            return {
              images: prevState.images.concat([
                { file: file, base64: fileContent, filename: file.name, uid: file.uid, time: moment() },
              ]),
            }
          })
        }
        reader.readAsDataURL(file)
        return ''
      },
    }

    const columns = [
      {
        title: 'Image',
        dataIndex: 'image',
        key: 'image',
      },
      {
        title: 'Filename',
        dataIndex: 'filename',
        key: 'filename',
      },
      {
        title: 'Uploaded Time',
        dataIndex: 'time',
        key: 'time',
      },
      {
        title: 'Result (Confidence)',
        dataIndex: 'result',
        key: 'result',
      },
      {
        title: 'Remove Image',
        dataIndex: 'action',
        key: 'action',
      },
    ]

    const dataSource = this.state.images.map(el => {
      console.log(
        'Results',
        el.uid,
        this.state.pendingResults,
        this.state.pendingResults.hasOwnProperty(el.uid),
        this.state.pendingResults[String(el.uid)],
        this.state.results,
      )
      return {
        image: <img src={el.base64} style={{ height: '150px', maxWidth: '200px' }} />,
        filename: el.filename,
        time: el.time.format('HH:mm:ss'),
        result: !this.state.pendingResults.hasOwnProperty(el.uid) ? (
          'Please click upload image above'
        ) : !this.state.results.hasOwnProperty(this.state.pendingResults[el.uid]) ? (
          <Spin spinning="true" message="Wating for result">
            <Skeleton paragraph={{ rows: 1 }} />
          </Spin>
        ) : (
          <span className={this.state.results[this.state.pendingResults[el.uid]] > 0.5 ? 'positive' : 'negative'}>
            {this.state.results[this.state.pendingResults[el.uid]] > 0.5 ? 'Positive' : 'Negative'} (
            {(this.state.results[this.state.pendingResults[el.uid]] * 100).toFixed(2)}%)
          </span>
        ),

        action: (
          <span
            onClick={e => {
              this.setState(prevState => {
                const imageIndex = prevState.images.findIndex(im_el => im_el.uid == el.uid)
                const resultIndex = this.state.results.find(res_el => res_el.uid == el.uid)
                return {
                  ...prevState,
                  images: prevState.images.slice(0, imageIndex).concat(prevState.images.slice(imageIndex + 1)),
                  results:
                    resultIndex === -1
                      ? prevState.results
                      : prevState.results.slice(0, resultIndex).concat(prevState.results.slice(resultIndex + 1)),
                }
              })
            }}
            style={{ cursor: 'pointer', color: '#cc3333' }}
          >
            <CloseCircleOutlined />
          </span>
        ),
      }
    })

    const inferContent = (
      <>
        <div className="header-container">
          <h1>Analyze COVID-19 from X-ray Images</h1>
          <h4>Upload your X-ray image below and click upload button to analyze images.</h4>
        </div>
        <div className="uploader-container">
          <Dragger {...uploadProps} className="uploader" showUploadList={false}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#f0518d' }} />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">Support for a single or bulk upload. </p>
          </Dragger>
          <Button type="primary" className="submit-button" onClick={this.handleSubmit} disabled={this.state.loading}>
            Upload
          </Button>
        </div>
        <div className="example-container">
          <h2>Example image for demo (Download and try)</h2>
          <Collapse>
            <Panel header="Positive (COVID-19 patient)">
              <Space className="card-container" align="center" direction="horizontal" size="large">
                <Card hoverable style={{ width: 200 }} cover={<img src={positive_1} />}></Card>
                <Card hoverable style={{ width: 200 }} cover={<img src={positive_2} />}></Card>
                <Card hoverable style={{ width: 200 }} cover={<img src={positive_3} />}></Card>
              </Space>
            </Panel>
            <Panel header="Negative (not COVID-19 patient)">
              <Space className="card-container" align="center" direction="horizontal" size="large">
                <Card hoverable style={{ width: 200 }} cover={<img src={negative_1} />}></Card>
                <Card hoverable style={{ width: 200 }} cover={<img src={negative_2} />}></Card>
                <Card hoverable style={{ width: 200 }} cover={<img src={negative_3} />}></Card>
              </Space>
            </Panel>
          </Collapse>
        </div>
        <div className="result-container">
          <h2>Results</h2>
          <Spin spinning={this.state.loading}>
            <Table dataSource={dataSource} columns={columns} pagination={{ pageSize: 3 }} />
          </Spin>
        </div>
      </>
    )

    const aboutContent = (
      <>
        <div className="header-container">
          <h1>About this app</h1>
          <h4>
            <Row>
              <Col sm={{ span: 24 }} md={{ span: 16 }}>
                This app inference server is created using{' '}
                <a href="https://developer.nvidia.com/clara">Clara Train SDK AIAA Server</a>. We used NVIDIA pretrained{' '}
                <span style={{ fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace' }}>
                  clara_xray_classification_chest_amp
                </span>{' '}
                (DenseNet121) model trained with <a href="https://github.com/UCSD-AI4H/COVID-CT">COVID-CT-Dataset</a> in
                order to demonstrate the usage of CLARA framework.
              </Col>
            </Row>
            <Row>
              <Col sm={{ span: 24 }} md={{ span: 16 }}>
                Hopefully, we could get real X-ray images for training the model in order to develop this website
                further.
              </Col>
            </Row>
          </h4>
          <h4>
            <Row>
              <Col sm={{ span: 24 }} md={{ span: 16 }}>
                The website developed by Data Mining Group (MIND Lab), Computer Engineering of Chulalongkorn University.
                <img src={mindLogo} alt="datamind logo" />
              </Col>
            </Row>
          </h4>
        </div>
      </>
    )

    return (
      <div className="App">
        <Layout>
          <Sider className="navigation-pane">
            <Header className="header">
              <Space size="small" align="center" direction="horizontal" className="logo-container">
                <img src={nvidia} alt="nvidia-logo" className="logo" />
                <img src={chula} alt="chula-logo" className="logo" />
              </Space>
            </Header>
            <Content>
              <Menu
                theme="dark"
                selectedKeys={this.state.activeMenu}
                onClick={key => {
                  console.log(key)
                  this.setState({ activeMenu: key.key })
                }}
              >
                <div className="nav-title">
                  <span>X-ray COVID-19 Analyzer</span>
                </div>
                <Menu.Item key="1">Analyze Image</Menu.Item>
                <Menu.Item key="2">About this project</Menu.Item>
              </Menu>
            </Content>
          </Sider>
          <Content className="content-container">{this.state.activeMenu === '1' ? inferContent : aboutContent}</Content>
        </Layout>
      </div>
    )
  }
}

export default App
