const mysql =require('mysql2')

const dbCon = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password:'',
    database:"bookribary",
    port:"3306"
}) 

dbCon.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err)
        return
    }
    console.log('Succes connect Database')
})


module.exports = dbCon