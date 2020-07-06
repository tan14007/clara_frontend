import React from 'react'
import { Button, Layout, Table, Menu, Upload, message, Space, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import nvidia from './nvidia.png'
import chula from './chula.png'
import { Route } from 'react-router-dom'
import axios from 'axios'
import FormData from 'form-data'
import './App.css'
import Image from 'image-js'

const { Header, Content, Sider } = Layout
const { Dragger } = Upload

class Detector extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      images: [],
      results: [],
      loading: false,
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
    this.setState({ loading: true })
    this.state.images.map(async (im, idx) => {
      if (this.state.results.indexOf(el => el.uid == im.uid) !== -1) return

      let payload = new FormData()
      try {
        const img = await Image.load(im.base64)
        let grayImg = await img.grey()
        grayImg = await grayImg.resize({
          width: 224,
        })
        // const base64 = await grayImg.toBase64('image/png')
        const blob = await grayImg.toBlob('image/png', 1)

        payload.append('image', im.file, im.filename)
        const { data } = await axios.post('http://localhost:8080/v1/annotation?model=clara_covid_test', payload, {
          headers: { accept: 'multipart/form-data', 'Content-Type': 'multipart/form-data', params: {} },
        })

        this.setState(prevState => {
          return { results: prevState.results.concat([{ uid: im.uid, result: Number(data.split('\n')[9]) }]) }
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
      console.log(
        el,
        this.state.results.findIndex(res_el => res_el.uid == el.uid),
      )
      return {
        image: <img src={el.base64} style={{ height: '200px', maxWidth: '200px' }} />,
        filename: el.filename,
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
      }
    })
    return (
      <div className="detector-container">
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
          <Button type="primary" className="submit-button" onClick={this.handleSubmit} disabled={this.state.loading}>
            Upload
          </Button>
        </div>
        <div className="result-container">
          <h3>Results</h3>
          <Spin spinning={this.state.loading}>
            <Table dataSource={dataSource} columns={columns} />
          </Spin>
        </div>
      </div>
    )
  }
}

export default Detector
