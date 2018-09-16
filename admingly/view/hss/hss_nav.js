const express = require('express');
const fs = require('fs');
const mysql = require('mysql');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');

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
                case 'insertType1':
                   var data = [{
                            ID: 0,
                            menu: 'type1',
                            nav_type:'',
                            show:1
                        }];
                        res.render('admingly/web/center_nav_type_pop.ejs', { data });
                        break;
                case 'modType1':
                 db.query(`SELECT * FROM view_nav_hss_type1 WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                if (common.debugData(data)) {
                        data[0].menu='type1';
                                data[0].show=data[0].show_type1;
                                data[0].nav_type=data[0].type1;
                                res.render('admingly/web/center_nav_type_pop.ejs', { data });
                          } else {
                            res.redirect('/error');
                            }
                                 }
                        });
                        break;
                case 'delType1':
                 db.query(`SELECT* FROM view_nav_hss_type2 WHERE type1=${req.query.id}`, (err, data) => {
                             if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                             if(data.length<=0){
                                db.query(`DELETE FROM view_nav_hss_type1 WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"删除导航栏高防服务器类型",
                                    `删除导航栏高防服务器类型`);

                                res.status(200).send('删除成功').end();
                                //res.redirect('/admingly/view/hss/hss_nav');
                            }
                        });
                            }else {
                               
                                res.status(200).send('删除失败，只有包含元素为空才能删除。').end();
                                //res.redirect('/admingly/view/hss/hss_nav');
                            }
                            }
                            
                        });           
                 break;
                case 'insertType2':
                 var data = [{
                            ID: 0,
                            menu: 'type2',
                            nav_type:'',
                            show:1,
                            parentype:req.query.type
                        }];

                        res.render('admingly/web/center_nav_type_pop.ejs', { data });
                        break;
                case 'modType2':
                 db.query(`SELECT * FROM view_nav_hss_type2 WHERE ID = ${req.query.id}`, (err, data1) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                     if (common.debugData(data1)) {
                         var  data= [{
                            ID: data1[0].ID,
                            menu: 'type2',
                            nav_type:data1[0].type2,
                            show:data1[0].show_type2,
                            parentype:data1[0].type1
                        }];
                             res.render('admingly/web/center_nav_type_pop.ejs', { data });
                           } else {
                        res.redirect('/error');
                    }
                 }
                        });
                 break;
                case 'delType2':
                 db.query(`SELECT* FROM data_product WHERE subtype_id=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                             if(data.length<=0){
                                db.query(`DELETE FROM view_nav_hss_type2 WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"删除导航栏高防服务器子类型",
                                    `删除导航栏高防服务器子类型`);

                                res.status(200).send('删除成功').end();
                                //res.redirect('/admingly/view/hss/hss_nav');
                            }
                        });
                            }else {
                          
                                res.status(200).send('删除失败，只有包含元素为空才能删除。').end();
                                //res.redirect('/admingly/view/hss');
                            }
                            }
                            
                            
                        });           
                 break;
                case 'insertItems': 
                 db.query(`SELECT * FROM data_product WHERE on_nav=0 and subtype_id = ${req.query.type}`, (err, data1) => {

                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                                        res.render('admingly/web/center_nav_additems_pop.ejs', { nav, menu, data1, menuClick: 2, itemClick: 0 });
                                    }
                                });
                 break;
                case "addItems": 
                 db.query(`UPDATE data_product SET on_nav = 1 
                         WHERE product_id='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改导航栏高防服务器展示",
                                    `修改为在导航栏展示高防服务器`);

                                res.redirect('/admingly/view/hss/hss_nav');
                            }
                        });
                 break;
                case 'modItems': 
                 db.query(`SELECT * FROM data_product WHERE product_id = '${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/center_nav_items_pop.ejs', { data });
                            }
                        });
                 break;
                case 'delItems': 
                 db.query(`UPDATE data_product SET on_nav = 0  
                         WHERE product_id = '${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改导航栏高防服务器展示",
                                    `修改为不在导航栏展示高防服务器`);
                                res.redirect('/admingly/view/hss/hss_nav');
                            }
                        });
                        break;
                default: 
                 db.query(`SELECT * FROM view_nav_hss_type1`, (err, type1) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                        db.query(`SELECT * FROM view_nav_hss_type2`, (err, type2) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                db.query(`SELECT * FROM view_data_server`, (err, items) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                                        res.render('admingly/web/admin_center.ejs', { nav, menu, content: "hss_nav", type1, type2, items, menuClick: 2, itemClick: 0 });
                                    }
                                });
                            }
                        });
                    }
                });

                }
             });
            router.get('/table',function(req, res) { 
                var page = req.query.page;
                var limit = req.query.limit;
                var start = (page - 1) * limit;
                var end = page * limit;
                var type = req.query.type_id;
               
                 db.query(`SELECT * FROM view_data_server WHERE server_type2id='${type}'`, (err, items) => {
                      if (err) {
                          console.error(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                        for (var i = 0; i < items.length; i++) {
                            items[i].number=i+1;         
                            items[i].show_nav=(items[i].server_onnav==1)?'是':'否';
                        }
                            var arraySlice = items.slice(start, end);
                            var allItems = {
                            code: 0,
                            msg: "",
                            count: items.length,
                            data: arraySlice
                        }
                        res.status(200).send(JSON.stringify(allItems)).end();
                      }
                  });
                           
               
                     
            });
            router.post('/', urlencodedParser, function(req, res) {
                var postType = req.body.menu;
                switch (postType) {
                    case "type1":
                        var id = req.body.mod_id;
                        var hss_type = req.body.mod_nav_type;
                        var show=req.body.mod_show;
                        if (id != 0) {
                            db.query(`UPDATE view_nav_hss_type1 SET \
                              type1='${hss_type}' ,\
                              show_type1='${show}' \
                              WHERE ID=${id}`, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改导航栏高防服务器类型",
                                    `修改导航栏高防服务器类型`);

                                    res.send("操作成功");
                                }
                            });
                        } else {
                            db.query(`INSERT INTO view_nav_hss_type1 \
                            (type1,show_type1) \
                            VALUES('${hss_type}','${show}')`, (err, data) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                     //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"新增导航栏高防服务器类型",
                                    `新增导航栏高防服务器类型`);

                                    res.send("操作成功");
                                }
                            });
                        }
                        break;
                    case "type2":

                        var id = req.body.mod_id;
                        var hss_type = req.body.mod_nav_type;
                        var show=req.body.mod_show;
                        var parent_type=req.body.mod_type;         
                        if (id != 0) {
                            db.query(`UPDATE view_nav_hss_type2 SET \
                              type2='${hss_type}' ,\
                              show_type2='${show}' \
                              WHERE ID=${id}`, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改导航栏高防服务器子类型",
                                            `修改导航栏高防服务器子类型`);

                                    res.send("操作成功");
                                }
                            });
                        } else {
                            db.query(`INSERT INTO view_nav_hss_type2 \
                            (type1,type2,show_type2) \
                            VALUES('${parent_type}','${hss_type}','${show}')`, (err, data) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"新增导航栏高防服务器子类型",
                                            `新增导航栏高防服务器子类型`);

                                    res.send("操作成功");
                                }
                            });
                        }
                        break;
                    case "items":
                        var id = req.body.mod_id;
                        var type = req.body.mod_type;
                        var title = req.body.mod_title;
                        var show = req.body.mod_show;
                        if (id != 0) {
                            db.query(`UPDATE data_product SET \
                      product_title='${title}', \ 
                      on_nav='${show}' \ 
                      WHERE product_id='${id}'`, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改导航栏高防服务器内容",
                                            `修改导航栏高防服务器内容`);

                                    res.send("操作成功");
                                }
                            });
                        } else {
                            
                        }
                }
            })


        }
    });

    return router;
}