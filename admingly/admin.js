const express = require('express');
const fs = require('fs');
const common = require('../../libs/common');
const moment = require("moment");

const db = common.db();

module.exports = function() {
    var router = express.Router();

    router.use("/login", require('./login.js')());

    var menu = {};
    fs.readFile('./static/txt/admin_center_view_menu.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            menu = JSON.parse(data.toString());
        }
    });

    fs.readFile('./static/txt/admin_center_nav.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            var nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "admin", menuClick: 0, itemClick: 0 })
            });
        }
    });

    router.use("/noPermission",(req,res)=>{
        fs.readFile('./static/txt/admin_center_center_menu.txt', function(err, data) {
            if (err) {
                console.log('读取失败');
            } else {
                menu = JSON.parse(data.toString());
            }
        });

        fs.readFile('./static/txt/admin_center_nav.txt', function(err, data) {
            if (err) {
                console.log('读取失败');
            } else {
                var nav = JSON.parse(data.toString());
                res.render('admingly/web/admin_center.ejs', {  nav, menu, content: "noPermission", menuClick: 0, itemClick: 0 });
            }
        });
    })

    // 检查登录状态
    router.use((req, res, next) => {
        // req.session['admin_id'] = "b585ee955a5111e8808368f728b4aa57"; // Admin
        // req.session['admin_id'] = "6e5747585b7e11e88b3768f728b4bbas"; // Clerk2
        // req.session['admin_id'] = "6e5747585b7e11e88b3768f728b4aa57"; // Clerk1
        if (!req.session['admin_id']) { //没有登录
            res.redirect('/admingly/login?originalUrl=' + req.originalUrl);
        } else {
            req.session['admin_refresh'] = moment().format("YYYY-MM-DD HH:mm:ss");
            next();
        }
    });

    //权限管理
    router.use((req, res, next) => {
        var originalUrl = req.originalUrl;
        db.query(`SELECT * FROM permission_func WHERE location = '${originalUrl}'`, (err, data) => {
            if (err) {
                console.log("err:" + err);
                res.redirect('/error');
                // res.status(500).send('database error').end();
            } else {
                if (data.length > 0) {
                    var permission_func_id = data[0].permission_func_id;
                    common.permission(req.session['admin_id'], permission_func_id, next, res);
                } else {
                    next();
                }
            }
        })
    })

    router.get('/out', (req, res) => {
        var ip_info = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
                      req.connection.remoteAddress || // 判断 connection 的远程 IP
                      req.socket.remoteAddress || // 判断后端的 socket 的 IP
                      req.connection.socket.remoteAddress||
                      req.headers['x-real-ip'] ;
        db.query(`INSERT INTO login_admin(log_id,admin_id,action,ip,date) \
                VALUES(replace(UUID(),'-',''),'${req.session['admin_id']}','管理员登出',\
                "${ip_info}",'${moment().format("YYYY-MM-DD HH:mm:ss")}')`,(err,data)=>{
                if (err) {
                    console.log(err);res.redirect('/error');
                }else{
                    req.session['admin_id'] = null;
                    res.status(200).send({ msg: "已退出" }).end();
                }
        });
    });

    router.get('/admin_info', (req, res) => {
        db.query(`SELECT * FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data) => {
            if (err) {
                console.log("err:" + err);
                res.redirect('/error');
                // res.status(500).send('database error').end();
            } else {
                    if (common.debugData(data)) {
                         var item = {
                    admin_account: data[0].admin_account,
                    admin_name: data[0].admin_name,
                    admin_authority: data[0].admin_authority
                    }
                        res.status(200).send({ data: JSON.stringify(item) }).end();
                    } else {
                        res.redirect('/error');
                    }
               
            }
        });
    })

    router.use("/center", require('./center/center.js')());
    router.use("/view", require('./view/view.js')());
    router.use("/product", require('./product/product.js')());
    router.use("/user", require('./users/users.js')());
    router.use("/admin", require('./admins/admins.js')());
    router.use("/order", require('./order/order.js')());
    router.use("/other", require('./other/other.js')());

    router.use("/log", require('./log/log.js')());
    router.use("/mylog", require('./log/mylog/mylog.js')());
    router.use("/trade", require('./trade/trade.js')());

    router.use("/msg", require('./msg/msg.js')());
    return router;
}