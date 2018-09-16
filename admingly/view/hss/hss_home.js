const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const mysql = require('mysql');
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
                    case 'del':
                       db.query(`SELECT* FROM data_product WHERE product_typeid='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                             if(data.length<=0){
                                db.query(`DELETE FROM view_hss_type WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                
                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"删除首页显示高防服务器类型",
                                      `删除首页显示高防服务器类型`);

                                 res.status(200).send('删除成功').end();
                                //res.redirect('/admingly/view/hss/hss_home');
                            }
                        });
                            }else {
                                res.status(200).send('删除失败，只有包含元素为空才能删除。').end();
                                //res.redirect('/admingly/view/hss/hss_home');}
                            }
                           } 
                        });
                        break;
                    case 'mod':
                        db.query(`SELECT * FROM view_hss_type WHERE ID=${req.query.id}`, (err, data) => {
                            if (err) {
                                console.error(err);
                                 res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                if (common.debugData(data)) {
                                data[0].show=data[0].show_type;
                                res.render('admingly/web/center_hss_type_pop.ejs', { data });
                            } else {
                                    res.redirect('/error');}
                                }
                        });
                        break;
                    case 'insert':
                        var data = [{
                            ID: 0,
                            hss_type: '',
                            show:1
                        }];
                        res.render('admingly/web/center_hss_type_pop.ejs', { data });
                        break;
                    case 'delItems':
                        db.query(`UPDATE data_product SET on_index = 0  
                         WHERE product_id = '${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改首页显示高防服务器展示",
                                      `修改为不在首页展示高防服务器`);

                                res.redirect('/admingly/view/hss/hss_home');
                            }
                        });
                        break;
                    case 'modItems':
                        db.query(`SELECT * FROM data_product WHERE product_id = '${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/center_hss_items_pop.ejs', { data });
                            }
                        });
                        break;
                    case 'insertItems':
                        
                                db.query(`SELECT * FROM data_product WHERE product_typeid = '${req.query.type}'`, (err, data1) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                                        res.render('admingly/web/center_hss_additems_pop.ejs', { nav, menu, data1, menuClick: 2, itemClick: 1 });
                                    }
                                });

                        break;
                    case "addItems":
                    db.query(`UPDATE data_product SET on_index = 1 
                         WHERE product_id='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"修改首页显示高防服务器展示",
                                    `修改为在首页展示高防服务器`);

                                res.redirect('/admingly/view/hss/hss_home');
                            }
                        });
                        break;
                    default:
                        db.query(`SELECT * FROM view_hss_type`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                db.query(`SELECT * FROM view_data_product`, (err, data1) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                                        res.render('admingly/web/admin_center.ejs', { nav, menu, content: "hss_home", data, data1, menuClick: 2, itemClick: 1 });
                                    }
                                });
                            }
                        });
                }
            });
            router.get('/table',function(req, res) { 
                var page = req.query.page;
                var type = req.query.type_id;
                var limit = req.query.limit;
                var start = (page - 1) * limit;
                var end = page * limit;
                db.query(`SELECT * FROM view_data_product WHERE p_typeid=${type}`, (err, data1) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                           for (var i = 0; i < data1.length; i++) {
                            data1[i].number=i+1;         
                            data1[i].show_index=(data1[i].p_onindex==1)?'是':'否';
                          }
                            var arraySlice = data1.slice(start, end);
                            var allItems = {
                            code: 0,
                            msg: "",
                            count: data1.length,
                            data: arraySlice
                        }
                        
                        res.status(200).send(JSON.stringify(allItems)).end();

                    }
                });
               
                     
            });
            router.post('/', urlencodedParser, function(req, res) {
                var postType = req.body.type;
                switch (postType) {
                    case "type":
                        var id = req.body.mod_id;
                        var hss_type = req.body.mod_hss_type;
                        var show=req.body.mod_show;
                        if (id != 0) {
                            db.query(`UPDATE view_hss_type SET \
                              hss_type='${hss_type}' ,\
                              show_type='${show}' \
                              WHERE ID=${id}`, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],"修改首页显示高防服务器类型",`修改首页显示高防服务器类型`);
                                    res.send("操作成功");
                                }
                            });
                        } else {
                            db.query(`INSERT INTO view_hss_type \
                            (hss_type,show_type) \
                            VALUES('${hss_type}','${show}')`, (err, data) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],
                                    "新增首页显示高防服务器类型",`新增首页显示高防服务器类型`);

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
                              product_name='${title}', \
                              on_index='${show}' \                    
                              WHERE product_id='${id}'`, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],
                                    "修改首页显示高防服务器内容",`修改首页显示高防服务器内容`);

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