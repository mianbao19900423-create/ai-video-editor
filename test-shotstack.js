const axios = require('axios');

const API_KEY = 'zNR4QcennZGF0kcEblR7aLt3GgHwxPS4FROIxlsx';
const API_URL = 'https://api.shotstack.io/v1/render';

const testData = {
  timeline: {
    background: "#000000",
    tracks: [
      {
        clips: [
          {
            asset: {
              type: "video",
              src: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/1.mp4"
            },
            start: 0,
            length: 4
          },
          {
            asset: {
              type: "video",
              src: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/2.mp4"
            },
            start: 4,
            length: 4,
            transition: {
              in: "fade"
            }
          }
        ]
      }
    ]
  },
  output: {
    format: "mp4",
    resolution: "sd",
    quality: "standard"
  }
};

async function testShotstack() {
  try {
    console.log('发送请求到 Shotstack...');
    console.log('请求数据:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(API_URL, testData, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('成功! 响应:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('错误!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误详情:', error.message);
    }
  }
}

testShotstack();
