const express = require('express');
const fs = require('fs');
const mysql = require('mysql');
const pathLib = require('path');
const bodyParser = require('body-parser');
const common = require('../../../libs/common');

var db = common.db();

module.exports = function() {
    var router = express.Router();
    var jsonParser = bodyParser.json();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });

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
                switch (req.query.act) {
                    case 'del':
                        db.query(`DELETE FROM view_partner WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"删除合作伙伴",
                                                  `删除一个合作伙伴信息`);

                                // res.send("操作成功");
                                res.redirect('/admingly/view/partner');
                            }
                        });
                        break;
                    case 'mod':
                        db.query(`SELECT * FROM view_partner WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/center_partner_pop.ejs', { data });
                            }
                        });
                        break;
                    case 'insert':
                        var data = [{
                            ID: 0,
                            name: '',
                            scr: '',
                            url: ''
                        }];
                        res.render('admingly/web/center_partner_pop.ejs', { data });
                        break;
                    default:
                        db.query(`SELECT * FROM view_partner`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "partner", data, menuClick: 0, itemClick: 1 });
                            }
                        });
                }

            });
            router.post('/', urlencodedParser, function(req, res) {
                var id = req.body.mod_id;
                var name = req.body.mod_name;
                var url = req.body.mod_url;
                if (req.files[0]) {
                    var ext = pathLib.parse(req.files[0].originalname).ext;

                    var oldPath = req.files[0].path;
                    var newPath = "static/upload/partner/" + req.files[0].filename + ext;

                    var newFileName = "/upload/partner/" + req.files[0].filename + ext;
                } else {
                    var newFileName = null;
                }

                if (newFileName) {
                    fs.rename(oldPath, newPath, (err) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('file opration error').end();
                        } else {
                            if (id != 0) {
                                db.query(`SELECT * FROM view_partner WHERE ID=${id}`, (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else if (data.length == 0) {
                                       res.redirect('/error');
                                    } else {
                                        fs.unlink('static/' + data[0].src, (err) => {
                                            if (err) {
                                                console.error(err);
                                                res.redirect('/error');//res.status(500).send('file opration error').end();
                                            } else {
                                                db.query(`UPDATE view_partner SET \
                                                  name='${name}', url='${url}', \
                                                  src='${newFileName}' \
                                                  WHERE ID=${id}`, (err) => {
                                                    if (err) {
                                                        console.error(err);
                                                        res.redirect('/error');//res.status(500).send('database error').end();
                                                    } else {

                                                        //** 添加日志 **
                                                        common.log_admin(req.session['admin_id'],"修改合作伙伴",
                                                            `修改一个合作伙伴信息`);

                                                        res.send("操作成功");
                                                    }
                                                });
                                            }
                                        })
                                    }
                                })
                            } else {
                                db.query(`INSERT INTO view_partner \
                                (name, url, src)
                                VALUES('${name}', '${url}', '${newFileName}')`, (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {

                                        //** 添加日志 **
                                            common.log_admin(req.session['admin_id'],"新增合作伙伴",
                                                `新增一个合作伙伴信息`);

                                        res.send("操作成功");
                                    }
                                });
                            }
                        }
                    })
                } else {
                    if (id != 0) { //修改
                        //直接改
                        db.query(`UPDATE view_partner SET \
                          name='${name}', url='${url}' \
                          WHERE ID=${id}`, (err) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],"修改合作伙伴",
                                        `修改一个合作伙伴信息`);
                                res.send("操作成功");
                            }
                        });
                    } else { //添加
                        db.query(`INSERT INTO view_partner \
        (name src, url)
        VALUES('${name}', '${newFileName}', '${url}')`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.send("操作成功");
                                //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],"新增合作伙伴",
                                        `新增一个合作伙伴信息`);
                            }
                        });
                    }
                }
            })
        }
    });


    return router;
}