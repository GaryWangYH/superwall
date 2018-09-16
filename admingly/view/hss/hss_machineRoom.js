const express = require('express');
const fs = require('fs');
const mysql = require('mysql');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const pathLib = require('path');
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
                       db.query(`SELECT* FROM data_product WHERE room_id ='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {

                             if(data.length<=0){
                                db.query(`DELETE FROM data_machineroom WHERE room_id='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                //res.redirect('/admingly/view/hss/hss_machineRoom');

                                //** 添加日志 **
                                common.log_admin(req.session['admin_id'],"删除机房",`删除一个机房`);

                                res.status(200).send('删除成功').end();
                                
                            }
                        });
                            }else {        
                                res.status(200).send('删除失败，只有包含元素为空才能删除。').end();
                                //res.redirect('/admingly/view/hss/hss_machineRoom');}
                            }
                            }
                        });
                        break;
                case 'mod':
                        db.query(`SELECT * FROM data_machineroom WHERE room_id='${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/center_machine_room_pop.ejs', { data });
                            }
                        });
                        break;
                case 'insert':
                        var data = [{
                            room_id: 0,
                            room_title: 'notitle',
                            show:1
                        }];
                        res.render('admingly/web/center_machine_room_pop.ejs', { data });
                        break;        
                case 'modItems':
                        db.query(`SELECT on_room FROM data_product WHERE product_id = '${req.query.id}'`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                        if (common.debugData(data)) {
                            show=1;
                                if(data[0].on_room!=0) {show=0;}
                                db.query(`UPDATE data_product SET \
                                on_room='${show}' \            
                                WHERE product_id='${req.query.id}'`, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],"修改机房服务器展示",`修改机房服务器展示`);

                                    res.send("操作成功");
                                }
                            });
                            } else {
                                    res.redirect('/error');
                                }
                            }
                        });
                        break;
                default:
                        db.query(`SELECT * FROM data_machineroom`, (err, data) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                db.query(`SELECT * FROM view_data_machineroom`, (err, data1) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {
                                        res.render('admingly/web/admin_center.ejs', { nav, menu, content: "hss_machineRoom", data,data1,menuClick: 2, itemClick: 2});
                                    }
                                });
                            }
                        });
                }
            });
            router.get('/table', function(req, res) {
                var page = req.query.page;
                var type = req.query.type_id;
                var limit = req.query.limit;
                var start = (page - 1) * limit;
                var end = page * limit;
                db.query(`SELECT * FROM view_data_machineroom WHERE pr_mrid='${type}'`, (err, data1) => {
                    if (err) {
                        console.error(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                           for (var i = 0; i < data1.length; i++) {
                            data1[i].number=i+1;         
                            data1[i].show_room=(data1[i].pr_onroom==1)?'是':'否';
                            data1[i].config='CPU:'+data1[i].pr_cpu+ '&nbsp宽带:'+data1[i].pr_memory;
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
                var oldPath=new Array(4);
                var newPath=new Array(4);
                var newFileName=new Array(4);
                for(var i=0;i<req.files.length;i++)
                {
                    if (req.files[i]) {
                    var ext = pathLib.parse(req.files[i].originalname).ext;

                    oldPath[i] = req.files[i].path;
                    newPath[i] = "static/upload/room/" + req.files[i].filename + ext;

                    newFileName[i] = "/upload/room/" + req.files[i].filename + ext;
                    fs.rename(oldPath[i], newPath[i], (err) => {
                        if (err) {
                            console.error(err);
                            res.redirect('/error');//res.status(500).send('file opration error').end();
                        }
                    }) ;

                } else {
                    newFileName[i] =null;
                }
                }
                  
                switch (postType) {
                    case "type":
                        var id = req.body.mod_id;
                        var show=req.body.mod_show;
                        var sqlstring;
                        if (id != 0) {
                    sqlstring="";
                     sqlstring+=`UPDATE data_machineroom SET 
                      room_title='${req.body.mod_title}' ,
                      room_brief='${req.body.mod_brief}' ,
                      room_content='${req.body.mod_content}' ,
                      room_address='${req.body.mod_address}' `;
                    if(newFileName[0])
                        sqlstring+=`,room_pictrue1='${newFileName[0]}'`;
                    if(newFileName[1])
                        sqlstring+=`,room_pictrue2='${newFileName[1]}'`;
                    if(newFileName[2])
                        sqlstring+=`,room_pictrue3='${newFileName[2]}'`;
                    if(newFileName[3])
                        sqlstring+=`,room_pictrue4='${newFileName[3]}'`;
                    sqlstring+=`WHERE room_id='${id}'`;


                       db.query(sqlstring, (err) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],"修改机房内容","修改机房内容");

                                    res.send("操作成功");
                                }
                            });
                        } else {

                         sqlstring="";
                         sqlstring+=`INSERT INTO data_machineroom 
                            (room_id,room_title,room_brief,room_content,room_address`;
                    if(newFileName[0])
                        sqlstring+=`,room_pictrue1`;
                    if(newFileName[1])
                        sqlstring+=`,room_pictrue2`;
                    if(newFileName[2])
                        sqlstring+=`,room_pictrue3`;
                    if(newFileName[3])
                        sqlstring+=`,room_pictrue4`;
                    sqlstring+=`)VALUES(replace(uuid(),'-',''),
                            '${req.body.mod_title}',
                            '${req.body.mod_brief}',
                            '${req.body.mod_content}',
                            '${req.body.mod_address}'`
                    if(newFileName[0])
                        sqlstring+=`,'${newFileName[1]}'`;
                    if(newFileName[1])
                        sqlstring+=`,'${newFileName[2]}'`;
                    if(newFileName[2])
                        sqlstring+=`,'${newFileName[3]}'`;
                    if(newFileName[3])
                        sqlstring+=`,'${newFileName[4]}'`;
                    sqlstring+=`)`;
                            db.query(sqlstring, (err, data) => {
                                if (err) {
                                    console.error(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {

                                    //** 添加日志 **
                                    common.log_admin(req.session['admin_id'],"新增机房","新增机房");

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
                                    common.log_admin(req.session['admin_id'],"修改机房服务器内容",
                                        `修改机房服务器内容`);

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