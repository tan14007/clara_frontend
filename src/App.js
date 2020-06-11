import React from 'react'
import { Button, Layout, Table, Menu, Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import nvidia from './nvidia.png'
import axios from 'axios'
import FormData from 'form-data'
import './App.css'
import Image from 'image-js'

const { Header, Content, Sider } = Layout
const { Dragger } = Upload

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      images: [],
      results: [],
    }
  }

  DataURIToBlob = dataURI => {
    const splitDataURI = dataURI.split(',')
    const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1])
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0]

    const ia = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)

    return new Blob([ia], { type: mimeString })
  }

  handleSubmit = async () => {
    this.state.images.map(async (im, idx) => {
      let payload = new FormData()

      const img = await Image.load(im.base64)
      let grayImg = await img.grey()
      grayImg = await grayImg.resize({
        width: 224,
        interpolation: 'bilinear',
      })
      // const base64 = await grayImg.toBase64('image/png')
      const blob = await grayImg.toBlob('image/png', 1)

      payload.append('image', im.file, im.filename)
      const { data } = await axios.post('http://localhost:8080/v1/annotation?model=clara_covid_test', payload, {
        headers: { accept: 'multipart/form-data', 'Content-Type': 'multipart/form-data', params: {} },
      })
      console.log(data)
    })
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
                { file: file, base64: fileContent, filename: file.name, uid: file.uid },
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
        title: 'Result (Confidence)',
        dataIndex: 'result',
        key: ' result',
      },
    ]

    const dataSource = this.state.images.map(el => {
      return {
        image: <img src={el.base64} style={{ height: '200px', maxWidth: '200px' }} />,
        filename: el.filename,
        result:
          typeof this.state.results.find(res_el => el.uid === res_el.uid) === 'undefined'
            ? 'Please click upload image above'
            : `${this.state.results.find(res_el => el.uid === res_el.uid).result > 0.5 ? 'Positive' : 'Negative'} (${
                this.state.results.find(res_el => el.uid === res_el.uid).result * 100
              }%)`,
      }
    })

    return (
      <div className="App">
        <Layout>
          <Sider className="navigation-pane">
            <Header className="logo-container">
              <img src={nvidia} alt="logo" className="logo" />
            </Header>
            <Content>
              <Menu theme="dark">
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
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files
                </p>
              </Dragger>
              <Button type="primary" className="submit-button" onClick={this.handleSubmit}>
                Upload
              </Button>
            </div>
            <div className="result-container">
              <h3>Results</h3>
              <Table dataSource={dataSource} columns={columns} />
            </div>
          </Content>
        </Layout>
      </div>
    )
  }
}

export default App
