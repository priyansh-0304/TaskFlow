const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireProjectAdmin, requireProjectMember } = require("../middleware/auth");

const prisma = new PrismaClient();
router.use(authenticate);

// GET /api/projects - list my projects
router.get("/", async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });
    const projects = memberships.map(m => ({ ...m.project, myRole: m.role }));
    res.json(projects);
  } catch (err) { next(err); }
});

// POST /api/projects - create project (creator becomes ADMIN)
router.post("/", [
  body("name").trim().notEmpty().withMessage("Project name required"),
  body("description").optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name, description,
        createdById: req.user.id,
        members: { create: { userId: req.user.id, role: "ADMIN" } },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    res.status(201).json({ ...project, myRole: "ADMIN" });
  } catch (err) { next(err); }
});

// GET /api/projects/:projectId
router.get("/:projectId", requireProjectMember, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    res.json({ ...project, myRole: req.membership.role });
  } catch (err) { next(err); }
});

// PUT /api/projects/:projectId
router.put("/:projectId", requireProjectAdmin, [
  body("name").optional().trim().notEmpty(),
], async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });
    res.json(project);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:projectId
router.delete("/:projectId", requireProjectAdmin, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: "Project deleted" });
  } catch (err) { next(err); }
});

// POST /api/projects/:projectId/members - invite member by email
router.post("/:projectId/members", requireProjectAdmin, [
  body("email").isEmail(),
  body("role").optional().isIn(["ADMIN", "MEMBER"]),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role = "MEMBER" } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.projectId } },
    });
    if (existing) return res.status(409).json({ error: "Already a member" });

    const member = await prisma.projectMember.create({
      data: { userId: user.id, projectId: req.params.projectId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete("/:projectId/members/:userId", requireProjectAdmin, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: "Cannot remove yourself" });
    }
    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.projectId } },
    });
    res.json({ message: "Member removed" });
  } catch (err) { next(err); }
});

// PUT /api/projects/:projectId/members/:userId/role
router.put("/:projectId/members/:userId/role", requireProjectAdmin, async (req, res) => {
  const { role } = req.body; // "ADMIN" or "MEMBER"
  const updated = await prisma.projectMember.update({
    where: { userId_projectId: { userId: req.params.userId, projectId: req.params.projectId }},
    data: { role }
  });
  res.json(updated);
});

module.exports = router;