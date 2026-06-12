const express =require('express')
const router = express.Router()

const boolks = require('../controllers/books')



router.get('/book/' , boolks.get)
router.get('/book/:id' , boolks.get)
router.post('/book/create' , boolks.post)
router.post('/book/update/:id' , boolks.patch)
router.delete('/book/delete/:id', boolks.delete)


module.exports = router;