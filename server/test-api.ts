import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:5000';

// 测试API连接
async function testApiConnection() {
  try {
    console.log('测试API服务器连接...');
    const response = await axios.get(`${API_URL}/api/test`);
    console.log('API连接测试结果:', response.data);
    return true;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('API连接测试失败:', axiosError.message);
    return false;
  }
}

// 测试学生登录
async function testStudentLogin() {
  try {
    console.log('测试学生登录API...');
    const response = await axios.post(`${API_URL}/api/student/login`, {
      studentId: '2022001',
      password: '123456'
    });
    console.log('登录结果:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('登录测试失败:', axiosError.message);
    if (axiosError.response) {
      console.error('服务器返回:', axiosError.response.status, axiosError.response.data);
    }
    return null;
  }
}

// 测试获取批次列表
async function testGetBatches() {
  try {
    console.log('测试获取批次列表...');
    const response = await axios.get(`${API_URL}/api/student/batches`);
    console.log('批次列表:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('获取批次列表失败:', axiosError.message);
    if (axiosError.response) {
      console.error('服务器返回:', axiosError.response.status, axiosError.response.data);
    }
    return null;
  }
}

// 测试获取申请记录
async function testGetApplications() {
  try {
    console.log('测试获取申请记录...');
    const studentId = '2022001';
    const response = await axios.get(`${API_URL}/api/student/applications/${studentId}`);
    console.log('申请记录:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('获取申请记录失败:', axiosError.message);
    if (axiosError.response) {
      console.error('服务器返回:', axiosError.response.status, axiosError.response.data);
    }
    return null;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('=== 开始API测试 ===');
  
  // 测试API连接
  const apiConnected = await testApiConnection();
  if (!apiConnected) {
    console.log('API连接失败，终止测试');
    return;
  }
  
  // 测试学生登录
  await testStudentLogin();
  
  // 测试获取批次列表
  await testGetBatches();
  
  // 测试获取申请记录
  await testGetApplications();
  
  console.log('=== API测试完成 ===');
}

// 执行测试
runAllTests(); 