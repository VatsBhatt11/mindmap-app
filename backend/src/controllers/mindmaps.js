const prisma = require('../lib/prisma');

async function list(req, res) {
  try {
    const mindmaps = await prisma.mindmap.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
    res.json(mindmaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function get(req, res) {
  try {
    const mindmap = await prisma.mindmap.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!mindmap) return res.status(404).json({ error: 'Not found' });
    res.json(mindmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { title, graphData } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const mindmap = await prisma.mindmap.create({
      data: { title, graphData: graphData || {}, userId: req.user.id },
    });
    res.status(201).json(mindmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { title, graphData } = req.body;

    const existing = await prisma.mindmap.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const mindmap = await prisma.mindmap.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(graphData !== undefined && { graphData }),
      },
    });
    res.json(mindmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const existing = await prisma.mindmap.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.mindmap.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, get, create, update, remove };
