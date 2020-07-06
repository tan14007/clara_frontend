import React from 'react'
import { Button, Layout, Table, Menu, Upload, message, Space, Spin, Collapse, Card } from 'antd'
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

const { Header, Content, Sider } = Layout
const { Dragger } = Upload
const { Panel } = Collapse

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      images: [],
      results: [],
      loading: false,
      activeMenu: '1',
    }
  }

  handleSubmit = async () => {
    this.setState({ loading: true })
    this.state.images.map(async (im, idx) => {
      if (this.state.results.findIndex(el => el.uid == im.file.uid) !== -1) return

      let payload = new FormData()
      try {
        const img = await Image.load(im.base64)
        let grayImg = await img.grey()
        grayImg = await grayImg.resize({
          width: 256,
        })

        const blob = await grayImg.toBlob('image/png', 1)

        payload.append('image', im.file, im.filename)
        const { data } = await axios.post('http://localhost:8080/v1/annotation?model=clara_covid_test', payload, {
          headers: { accept: 'multipart/form-data', 'Content-Type': 'multipart/form-data', params: {} },
        })

        this.setState(prevState => {
          return { results: prevState.results.concat([{ uid: im.file.uid, result: Number(data.split('\n')[9]) }]) }
        })
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
                //@ts-ignore
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
      console.log(el)
      return {
        image: <img src={el.base64} style={{ height: '150px', maxWidth: '200px' }} />,
        filename: el.filename,
        time: el.time.format('HH:mm:ss'),
        result:
          this.state.results.findIndex(res_el => el.uid == res_el.uid) === -1 ? (
            'Please click upload image above'
          ) : (
            <span
              className={this.state.results.find(res_el => el.uid == res_el.uid).result > 0.5 ? 'positive' : 'negative'}
            >
              {this.state.results.find(res_el => el.uid == res_el.uid).result > 0.5 ? 'Positive' : 'Negative'} (
              {(this.state.results.find(res_el => el.uid == res_el.uid).result * 100).toFixed(2)}%)
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

    return (
      <div className="App">
        <Layout>
          <Sider className="navigation-pane">
            <Header className="header">
              <Space align="center" direction="horizontal" className="logo-container">
                <img src={nvidia} alt="nvidia-logo" className="logo" />
                <img src={chula} alt="chula-logo" className="logo" />
              </Space>
            </Header>
            <Content>
              <Menu
                theme="dark"
                selectedKeys={this.state.activeMenu}
                onClick={key => this.setState({ acitveMenu: key })}
              >
                <div className="nav-title">
                  <span>X-ray COVID-19 Analyzer</span>
                </div>
                <Menu.Item key="1">Analyze Image</Menu.Item>
                <Menu.Item key="2">About this project</Menu.Item>
              </Menu>
            </Content>
          </Sider>
          <Content className="content-container">
            <div className="header-container">
              <h1>Analyze COVID-19 from X-ray Images</h1>
              <h4>Upload your X-ray image below and click upload button to analyze images.</h4>
            </div>
            <div className="uploader-container">
              <Dragger {...uploadProps} className="uploader" showUploadList={false}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Support for a single or bulk upload. </p>
              </Dragger>
              <Button
                type="primary"
                className="submit-button"
                onClick={this.handleSubmit}
                disabled={this.state.loading}
              >
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
          </Content>
        </Layout>
      </div>
    )
  }
}

export default App
