import express from 'express';
import Batch from '../models/Batch';
import { auth, adminAuth } from '../middleware/auth';

const router = express.Router();

// 获取所有批次
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(batches);
  } catch (error) {
    console.error('获取批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个批次
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: '批次不存在' });
    }
    res.json(batch);
  } catch (error) {
    console.error('获取单个批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新批次（管理员）
router.post('/', adminAuth, async (req, res) => {
  try {
    const batch = await Batch.create(req.body);
    res.status(201).json(batch);
  } catch (error) {
    console.error('创建批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新批次（管理员）
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const [updated] = await Batch.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: '批次不存在' });
    }
    
    const updatedBatch = await Batch.findByPk(req.params.id);
    res.json(updatedBatch);
  } catch (error) {
    console.error('更新批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除批次（管理员）
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const deleted = await Batch.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ message: '批次不存在' });
    }
    
    res.json({ message: '批次已删除' });
  } catch (error) {
    console.error('删除批次错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新批次状态（管理员）
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const [updated] = await Batch.update({ status }, {
      where: { id: req.params.id }
    });
    
    if (updated === 0) {
      return res.status(404).json({ message: '批次不存在' });
    }
    
    const updatedBatch = await Batch.findByPk(req.params.id);
    res.json(updatedBatch);
  } catch (error) {
    console.error('更新批次状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;