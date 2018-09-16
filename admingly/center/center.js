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
            router.get('/', (req, res) => {
                db.query(`SELECT * FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data1) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send("database error").end();
                    } else {
                        if (common.debugData(data1)) {
                            if (data1[0].buildDate != null) {
                                data1[0].buildDate = moment(data[0].buildDate).format('YYYY-MM-DD HH:mm');
                            } 
                        res.render('admingly/web/admin_center.ejs', { admin: data1, nav, menu, content: "center", menuClick: 0, itemClick: 0 });
                        }else {res.redirect('/error');}
                        
                    }
                })
            });
            //权限管理
            router.use('/view', (req, res, next) => {
                common.permission(req.session['admin_id'], 1014, next, res);
            })

            router.get('/edit', (req, res) => {
                db.query(`SELECT * FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data1) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send("database error").end();
                    } else {
                        data1[0].buildDate = moment(data1[0].buildDate).format("YYYY-MM-DD")
                        res.render('admingly/web/admin_center.ejs', { admin: data1, nav, menu, content: "center_edit", menuClick: 0, itemClick: 0 })
                    }
                })
            });

            router.post('/edit/submit',urlencodedParser, (req, res) => {
                db.query(`UPDATE admin SET admin_name = '${req.body.name}', \
                    QQ = '${req.body.QQ}', telephone = '${req.body.telephone}' WHERE admin_id = '${req.session['admin_id']}'`, (err, data1) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send("database error").end();
                    } else {

                        //** 添加日志 **
                        var detail=`修改自己的个人信息，修改后QQ为${req.body.QQ}，手机号为${req.body.telephone}`;
                        common.log_admin(req.session['admin_id'],'管理员个人信息修改',detail);
                        res.status(200).send({ msg: "修改成功" }).end();
                    }
                })
            });

            router.get('/changePwd_pop', (req, res) => {
                res.render('admingly/components/center/change_pwd.ejs');
            });

            router.post('/changePwd', urlencodedParser, (req, res) => {

                var new_pwd = req.body.new_pwd;
                var old_pwd = req.body.old_pwd;

                var new_pwdMd5 = common.md5(new_pwd + common.MD5_SUFFIX);
                var old_pwdMd5 = common.md5(old_pwd + common.MD5_SUFFIX);

                db.query(`SELECT admin_pwd FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.status(500).send("密码修改失败").end();
                    } else {
                        if (data.length > 0) {
                            if (data[0].admin_pwd == old_pwdMd5) {
                                db.query(`UPDATE admin SET admin_pwd = '${new_pwdMd5}' \
                                        WHERE admin_id = '${req.session['admin_id']}'`, (err, data) => {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).send("密码修改失败").end();
                                    } else {
                                        common.log_admin(req.session['admin_id'], "修改密码", `管理员修改自己密码`);
                                        res.status(200).send({ msg: "修改成功" }).end();
                                    }
                                })
                            } else {
                                res.status(500).send("旧密码错误").end();
                            }
                        } else {
                            res.status(500).send("密码修改失败").end();
                        }
                    }
                })
            });
        }
    });

    router.get("/setRead", (req, res) => {
        var info_admin_id = req.query.info_admin_id;
        db.query(`UPDATE info_admin SET info_status = 1002, \
            readTime = '${moment().format("YYYY-MM-DD HH:mm:ss")}' \
            WHERE info_admin_id = '${info_admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })

    router.get("/read/data", (req, res) => {
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        var count;
        db.query(`SELECT COUNT(1) as count FROM info_admin \
            WHERE admin_id = '${req.session['admin_id']}' `, (err, data3) => {
          if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                count=data3[0].count;
                db.query(`SELECT * FROM info_admin WHERE admin_id = '${req.session['admin_id']}' \
            order by buildTime desc limit ${start},${limit}`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    item = {
                        index: i + 1,
                        info_admin_id: data[i].info_admin_id,
                        url: data[i].info_url,
                        describe: data[i].info_describe,
                        buildTime: moment(data[i].buildTime).format('YYYY-MM-DD HH:mm')
                    }
                    if (data[i].info_status==1001){
                        item.status = '未读';
                    }else {
                        item.status = '已读';
                    }
                    if (data[i].readTime) {
                        item.readTime = moment(data[i].readTime).format('YYYY-MM-DD HH:mm');
                    } else {
                        item.readTime = null;
                    }
                    array.push(item);
                }

                var out = {
                    code: 0,
                    msg: "",
                    count: count,
                    data: array
                }

                res.status(200).send(JSON.stringify(out)).end();
            }
        })
            }
            });
    })


    return router;
}