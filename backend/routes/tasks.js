const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireProjectMember } = require("../middleware/auth");

const prisma = new PrismaClient();
router.use(authenticate);

// GET /api/tasks/my - all tasks assigned to me
router.get("/my", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });
    res.json(tasks);
  } catch (err) { next(err); }
});

// GET /api/tasks/dashboard - stats
router.get("/dashboard", async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true },
    });
    const projectIds = memberships.map(m => m.projectId);

    const [total, byStatus, overdue, myTasks] = await Promise.all([
      prisma.task.count({ where: { projectId: { in: projectIds } } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { projectId: { in: projectIds } },
        _count: { status: true },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: new Date() },
          status: { not: "DONE" },
        },
      }),
      prisma.task.count({ where: { assigneeId: req.user.id, status: { not: "DONE" } } }),
    ]);

    res.json({ total, byStatus, overdue, myPendingTasks: myTasks, projectCount: projectIds.length });
  } catch (err) { next(err); }
});

// POST /api/tasks - create task
router.post("/", [
  body("title").trim().notEmpty().withMessage("Title required"),
  body("projectId").notEmpty(),
  body("status").optional().isIn(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  body("dueDate").optional().isISO8601(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
    });
    if (!membership) return res.status(403).json({ error: "Not a project member" });

    const task = await prisma.task.create({
      data: {
        title, description, projectId, status, priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id
router.put("/:id", async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });
    if (!membership) return res.status(403).json({ error: "Access denied" });

    // Members can only update status of their own tasks; Admins can update all
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const isAdmin = membership.role === "ADMIN";
    const isAssignee = task.assigneeId === req.user.id;

    if (!isAdmin && !isAssignee) return res.status(403).json({ error: "Not authorized to edit this task" });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(isAdmin && title && { title }),
        ...(isAdmin && description !== undefined && { description }),
        ...(status && { status }),
        ...(isAdmin && priority && { priority }),
        ...(isAdmin && dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(isAdmin && assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: "Task deleted" });
  } catch (err) { next(err); }
});

module.exports = router;