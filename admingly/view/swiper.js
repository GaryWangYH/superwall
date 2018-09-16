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
                        db.query(`SELECT * FROM view_swiper WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                if (common.debugData(data)) {
                        fs.unlink('static/' + data[0].src, (err) => {
                                        // console.error(err);
                                        // res.redirect('/error');//res.status(500).send('file opration error').end();
                                        db.query(`DELETE FROM view_swiper WHERE ID=${req.query.id}`, (err, data) => {
                                            if (err) {
                                                console.log(err);
                                                res.redirect('/error');//res.status(500).send('database error').end();
                                            } else {

                                                //** 添加日志 **
                                                common.log_admin(req.session['admin_id'],"删除轮播图",
                                                                  `删除一张轮播图`);

                                                res.redirect('/admingly/view/swiper');
                                            }
                                        });
                                })
                    } else {
                        res.redirect('/error');
                            }

                            }
                        })
                        break;
                    case 'mod':
                        db.query(`SELECT * FROM view_swiper WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/center_swiper_pop.ejs', { data });
                            }
                        });
                        break;
                    case 'insert':
                        var data = [{
                            ID: 0,
                            title: '',
                            sub_title: '',
                            src: '',
                            url:'',
                            bgColorStart:'',
                            bgColorEnd:'',
                            bgColorOrImg:'0'
                        }];
                        res.render('admingly/web/center_swiper_pop.ejs', { data });
                        break;
                    default:
                        db.query(`SELECT * FROM view_swiper`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "swiper", data, menuClick: 0, itemClick: 0});
                            }
                        });
                }

            });
            router.post('/', urlencodedParser, function(req, res) {
                var id = req.body.mod_id;
                var title = req.body.mod_title;
                var sub_title = req.body.mod_sub_title;
                var url = req.body.mod_url;
                var bgColorStart = req.body.bgColorStart;
                var bgColorEnd = req.body.bgColorEnd;
                var bgColorOrImg = req.body.bgColorOrImg;
                if (req.files[0]) {
                    var ext = pathLib.parse(req.files[0].originalname).ext;

                    var oldPath = req.files[0].path;
                    var newPath = "static/upload/swiper/" + req.files[0].filename + ext;

                    var newFileName = "/upload/swiper/" + req.files[0].filename + ext;
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
                                db.query(`SELECT * FROM view_swiper WHERE ID=${id}`, (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else if (data.length == 0) {
                                        res.redirect('/error');//res.status(404).send('old file not found').end();
                                    } else {
                                        fs.unlink('static/' + data[0].src, (err) => {
                                                db.query(`UPDATE view_swiper SET \
                                              title='${title}', sub_title='${sub_title}', \
                                              src='${newFileName}', \
                                              url='${url}', \
                                              bgColorStart='${bgColorStart}', \
                                              bgColorEnd='${bgColorEnd}', \
                                              bgColorOrImg='${bgColorOrImg}' \
                                              WHERE ID=${id}`, (err) => {
                                                    if (err) {
                                                        console.error(err);
                                                        res.redirect('/error');//res.status(500).send('database error').end();
                                                    } else {

                                                        //** 添加日志 **
                                                        common.log_admin(req.session['admin_id'],"修改轮播图",
                                                                          `修改一张轮播图`);

                                                        res.send("操作成功");
                                                    }
                                                });
                                        })
                                    }
                                })
                            } else {
                                db.query(`INSERT INTO view_swiper \
                                (title, sub_title, src, url, bgColorStart,bgColorEnd,bgColorOrImg)
                                VALUES('${title}', '${sub_title}', '${newFileName}', '${url}',\
                                 '${bgColorStart}', '${bgColorEnd}', '${bgColorOrImg}')`, (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {

                                        //** 添加日志 **
                                        common.log_admin(req.session['admin_id'],"新建轮播图",
                                                  `新建一张轮播图`);

                                        res.send("操作成功");
                                    }
                                });
                            }
                        }
                    })
                } else {
                    if (id != 0) { //修改
                        //直接改
                        db.query(`UPDATE view_swiper SET \
                      title='${title}', sub_title='${sub_title}', \
                      url='${url}', \
                      bgColorStart='${bgColorStart}', \
                      bgColorEnd='${bgColorEnd}', \
                      bgColorOrImg='${bgColorOrImg}' \
                      WHERE ID=${id}`, (err) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改轮播图",
                                                  `修改一张轮播图`);
                                res.send("操作成功");

                            }
                        });
                    } else { //添加
                        db.query(`INSERT INTO view_swiper \
                        (title, sub_title, src, url, bgColorStart,bgColorEnd,bgColorOrImg)
                        VALUES('${title}', '${sub_title}', '${newFileName}', '${url}',\
                         '${bgColorStart}', '${bgColorEnd}', '${bgColorOrImg}')`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"新建轮播图",
                                                  `新建一张轮播图`);

                                res.send("操作成功");
                            }
                        });
                    }
                }
            })
        }
    });



    return router;
}