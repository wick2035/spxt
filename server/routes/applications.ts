import express from 'express';
import Application from '../models/Application';
import Batch from '../models/Batch';
import { auth, adminAuth } from '../middleware/auth';

const router = express.Router();

// 获取用户的所有申请
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { userId: req.user.id },
      include: [{ model: Batch, as: 'batch' }],
      order: [['createdAt', 'DESC']]
    });
    res.json(applications);
  } catch (error) {
    console.error('获取申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新申请
router.post('/', auth, async (req, res) => {
  try {
    const { batchId, scholarshipItems } = req.body;
    
    // 检查批次是否存在
    const batch = await Batch.findByPk(batchId);
    if (!batch) {
      return res.status(404).json({ message: '批次不存在' });
    }
    
    // 检查批次是否在进行中
    if (batch.status !== '进行中') {
      return res.status(400).json({ message: '该批次不在申请期内' });
    }
    
    // 检查用户是否已经申请过该批次
    const existingApplication = await Application.findOne({
      where: {
        userId: req.user.id,
        batchId
      }
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: '您已经申请过该批次' });
    }
    
    // 创建新申请
    const application = await Application.create({
      userId: req.user.id,
      batchId,
      scholarshipItems,
      status: '待审核'
    });
    
    res.status(201).json(application);
  } catch (error) {
    console.error('创建申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员获取所有申请
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { status, batchId } = req.query;
    let where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (batchId) {
      where.batchId = batchId;
    }
    
    const applications = await Application.findAll({
      where,
      include: [
        { model: Batch, as: 'batch' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(applications);
  } catch (error) {
    console.error('获取申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员审核申请
router.patch('/:id/review', adminAuth, async (req, res) => {
  try {
    const { status, reviewComment } = req.body;
    
    const [updated] = await Application.update({
      status,
      reviewComment,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    }, {
      where: { id: req.params.id }
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: '申请不存在' });
    }
    
    const updatedApplication = await Application.findByPk(req.params.id, {
      include: [{ model: Batch, as: 'batch' }]
    });
    
    res.json(updatedApplication);
  } catch (error) {
    console.error('审核申请错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router; 