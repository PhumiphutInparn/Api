const express =require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken');
const {isMember} = require('../middleware/checkRole')
const boolks = require('../controllers/books')



router.get('/book' ,verifyToken,isMember ,boolks.get)
router.get('/book/:id' ,verifyToken,isMember, boolks.get)
router.post('/book/create' ,verifyToken,isMember, boolks.post)
router.post('/book/update/:id' , verifyToken,isMember,boolks.patch)
router.delete('/book/delete/:id',verifyToken,isMember ,boolks.delete)


module.exports = router;