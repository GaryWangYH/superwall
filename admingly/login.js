const express = require('express');
const common = require('../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const db = common.db();

module.exports = function() {
    var router = express.Router();

    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    router.get('/', (req, res) => {
        if (req.query.originalUrl == "/admingly/login"||req.query.originalUrl == "/admingly") {
            res.render('admingly/web/admin_login.ejs',{originalUrl:"/admingly/center"});
        }else{
            res.render('admingly/web/admin_login.ejs',{originalUrl:req.query.originalUrl});
        }
    });

    router.post('/', urlencodedParser, (req, res)=>{
        var username = req.body.username;
        var password = req.body.password;
        var passwordMd5 = common.md5(password+common.MD5_SUFFIX);
        db.query(`SELECT * FROM admin WHERE admin_account = '${username}' and admin_pwd = '${passwordMd5}'`,(err,data)=>{
            if(err){
                console.log("err:"+err);
                res.redirect('/error');
                //res.status(500).send('database error').end();
            }else{
                if(data.length > 0){
                    req.session['admin_id'] = data[0].admin_id;
                    
                    var ip_info = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
                            req.connection.remoteAddress || // 判断 connection 的远程 IP
                            req.socket.remoteAddress || // 判断后端的 socket 的 IP
                            req.connection.socket.remoteAddress||
                            req.headers['x-real-ip'] ;
                    db.query(`INSERT INTO login_admin(log_id,admin_id,action,ip,date) \
                VALUES(replace(UUID(),'-',''),'${data[0].admin_id}','管理员登录',\
                "${ip_info}",'${moment().format("YYYY-MM-DD HH:mm:ss")}')`,(err,data)=>{
                if (err) {
                    console.log(err);res.redirect('/error');
                }else{
                    res.status(200).send({ msg: 'success' }).end();
                }
                    });

                }else{
                    res.status(200).send({msg:'fail'}).end();
                }
            }
        });
    });

    return router;
}