const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = Router();

router.use(requireAuth);

// GET    /api/projects          → listar proyectos del usuario
router.get('/', projectController.list);

// POST   /api/projects          → crear y desplegar nuevo proyecto
router.post('/', projectController.create);

// GET    /api/projects/:id      → detalle de un proyecto
router.get('/:id', projectController.getOne);

// DELETE /api/projects/:id      → eliminar proyecto y contenedor
router.delete('/:id', projectController.remove);

// POST   /api/projects/:id/start  → iniciar contenedor detenido
router.post('/:id/start', projectController.start);

// POST   /api/projects/:id/stop   → detener contenedor manualmente
router.post('/:id/stop', projectController.stop);

// GET    /api/projects/:id/status → estado actual del contenedor
router.get('/:id/status', projectController.status);

module.exports = router;
