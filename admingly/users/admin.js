const express = require('express');
const fs = require('fs');
const common = require('../../../libs/common');
const moment = require('moment');
const bodyParser = require('body-parser');

const db = common.db();

module.exports = function() {
    var router = express.Router();

    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};
    var nav = {};

    fs.readFile('./static/txt/admin_center_admin_menu.txt', function(err, data) {
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
            nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "user_admin", menuClick: 0, itemClick: 1 })
            });
        }
    });

    router.get("/checkAuthority", (req, res) => {
        db.query(`SELECT * FROM admin WHERE admin_id = '${req.session.admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                if (common.debugData(data)) {
                var item = {};
                item = {
                    admin_authority: data[0].admin_authority
                }
                res.status(200).send({ admin_authority: item.admin_authority }).end();
                }else {res.redirect('/error');}
            }
        });
    })

    router.post("/new", urlencodedParser, (req, res) => {
        var admin_account = req.body.account;
        var admin_name = req.body.name;
        var QQ = req.body.QQ;
        var permission = req.body.permission;
        var admin_pwd = common.md5(req.body.password + common.MD5_SUFFIX);
        var telephone = req.body.telephone;
        var role = req.body.role;
        db.query(`INSERT INTO admin VALUES (replace(uuid(),'-',''),'${admin_account}',\
            '${admin_pwd}','${admin_name}','${permission}','${QQ}','${moment().format("YYYY-MM-DD HH:mm:ss")}','${telephone}')`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

                //** 添加日志 **
                var detail=`增加一位管理员，权限为${role}，电话为${telephone}，QQ为${QQ}`;
                common.log_admin(req.session['admin_id'],"增加管理员",detail);

                res.redirect("/admingly/user/admin");
            }
        })
    })

    //管理员等级管理
    router.use("/detail", (req, res, next) => {
        common.admin_level_check(next, res, req.session['admin_id'], req.query.admin_id);
    })

    router.post("/detail/edit", urlencodedParser,(req, res) => {
        var admin_account = req.body.account;
        var admin_name = req.body.name;
        var QQ = req.body.QQ;
        var permission = req.body.permission;
        var admin_id = req.body.admin_id;
        var telephone = req.body.telephone;
        var change_account = req.body.change_account;
        var change_role = req.body.change_role;
        var change_tele = req.body.change_tele;
        db.query(`UPDATE admin SET admin_account = '${admin_account}',\
            admin_name = '${admin_name}',\
            QQ = '${QQ}',\
            permission_role_id = '${permission}', \
            telephone = '${telephone}' 
            WHERE admin_id = '${admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {


                //** 添加日志 **
                var detail=`修改管理员信息`+change_account+change_role+change_tele;
                common.log_admin(req.session['admin_id'],"修改管理员信息",detail);

                res.redirect("/admingly/user/admin");
            }
        })
    })

    router.post("/detail/changePwd", urlencodedParser, (req, res) => {
        var password = req.body.password;
        var passwordMd5 = common.md5(password + common.MD5_SUFFIX);
        var account = req.body.account;
        db.query(`UPDATE admin SET admin_pwd = '${passwordMd5}'\
         WHERE admin_id = '${req.body.admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"修改管理员密码",`修改管理员账号${account}密码`);
                res.status(200).send({ msg: "修改成功" }).end();
            }
        });
    })

    router.use('/data', (req, res) => {

        var page = req.query.page;
        var limit = req.query.limit;

        var start = (page - 1) * limit;
        var end = page * limit;

        db.query(`SELECT * FROM admin, permission_role \
            WHERE permission_role.permission_role_id = admin.permission_role_id \
            ORDER BY permission_role.level,buildDate`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    item = {
                        id: i + 1,
                        admin_id: data[i].admin_id,
                        admin_account: data[i].admin_account,
                        admin_name: data[i].admin_name,
                        permission_role_name: data[i].permission_role_name,
                        QQ: data[i].QQ,
                        level: data[i].level,
                        buildDate: moment(data[i].buildDate).format("YYYY-MM-DD")
                    }
                    array.push(item);
                }

                var arraySlice = array.slice(start, end);

                var ddos_orders = {
                    code: 0,
                    msg: "",
                    count: array.length,
                    data: arraySlice
                }

                res.status(200).send(JSON.stringify(ddos_orders)).end();
            }
        });
    });

    //管理员等级管理
    router.use("/permission/page", (req, res, next) => {
        common.admin_level_check(next, res, req.session['admin_id'], req.query.admin_id);
    })

    router.get("/detail", (req, res) => {
        db.query(`SELECT * FROM admin,permission_role WHERE admin.permission_role_id = permission_role.permission_role_id AND admin.admin_id = '${req.query.admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');
                // res.status(500).send('database error').end();
            } else {
                if (common.debugData(data)) {
                    var item1 = {};
                    item1 = {
                        admin_id: data[0].admin_id,
                        admin_account: data[0].admin_account,
                        admin_name: data[0].admin_name,
                        permission_role_id: data[0].permission_role_id,
                        permission_role_name: data[0].permission_role_name,
                        QQ: data[0].QQ,
                        telephone: data[0].telephone,
                        buildDate: moment(data[0].buildDate).format("YYYY-MM-DD HH:mm:ss")
                    }
                    db.query(`SELECT level FROM admin,permission_role WHERE admin.permission_role_id = permission_role.permission_role_id AND admin.admin_id = '${req.session['admin_id']}'`,(err,data3)=>{
                        if (err) {
                            console.log(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                            var query;
                            if (data[0].level == 0) {
                                query = `SELECT * FROM permission_role WHERE level = 0`;
                            }else{
                                query = `SELECT * FROM permission_role WHERE level > ${data3[0].level}`
                            }
                            db.query(query, (err, data1) => {
                                if (err) {
                                    console.log(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {
                                    var array = [];
                                    for (var i = 0; i < data1.length; i++) {
                                        var item = {};
                                        item = {
                                            permission_role_id: data1[i].permission_role_id,
                                            permission_role_name: data1[i].permission_role_name
                                        }
                                        array.push(item);
                                    }
                                    res.render('admingly/web/admin_center.ejs', { data: array, nav, menu, content: "admin_detail", admin: item1, menuClick: 0, itemClick: 3 });
                                }
                            });
                        }
                    })
                } else {
                    res.redirect('/error');
                }
            }
        });
    })

    router.use("/permission", require('./admin/permission.js')())

    return router;
}