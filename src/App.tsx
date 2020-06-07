import React from 'react'
import { Button, Layout, Table, Menu, Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import nvidia from './nvidia.png'
import './App.css'

const { Header, Content, Sider } = Layout
const { Dragger } = Upload

function App() {
  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange: (info: any) => {
      const { status } = info.file
      if (status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`)
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
      }
    },
  }
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
            <Dragger {...uploadProps} className="uploader">
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files
              </p>
            </Dragger>
            <Button type="primary" className="submit-button">
              Upload
            </Button>
          </div>
          <div className="result-container">
            <h3>Results</h3>
            <Table />
          </div>
        </Content>
      </Layout>
    </div>
  )
}

export default App
