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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "permission", menuClick: 0, itemClick: 0 })
            });

            router.post('/new',urlencodedParser, (req, res) => {
                var permission_role_name = req.body.permission_role_name;
                db.query(`INSERT INTO permission_role VALUES (null, '${permission_role_name}', 1, 9)`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                //** 添加日志 **
                var detail=`增加一种管理员角色，角色拥有的权限为${permission_role_name}`;
                common.log_admin(req.session['admin_id'],"增加角色",detail);

                        res.status(200).send({ msg: "添加成功" }).end();
                    }
                })
            })

            router.post('/delete',urlencodedParser, (req, res) => {
                var permission_role_id = req.body.permission_role_id;
                var permission_role_name = req.body.permission_role_name;
                db.query(`DELETE FROM permission_role 
                    WHERE permission_role_id = ${permission_role_id}`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                       db.query(`SELECT permission_role_id FROM admin 
                        WHERE permission_role_id= ${permission_role_id}`, (err, data1) => {
                    if (err) {
                      console.log(err);
                      res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                       if(data1.length==0){
                        //** 添加日志 **
                        var detail=`删除一种管理员角色，角色拥有的权限为${permission_role_name}`;
                        common.log_admin(req.session['admin_id'],"删除角色",detail);
                        res.status(200).send({ msg: "删除成功" }).end();
                        }else{ res.status(200).send({ msg: "删除失败，该角色还在使用中" }).end();}
                        } 
                    })
                  }
                })
            })

            router.use('/data', (req, res) => {
                var page = req.query.page;
                var limit = req.query.limit;
                limits = []
                date = []
                common.layui_table(res, "permission_role", page, limit, limits, date);
            });

            //管理员等级管理
            router.use("/detail", (req, res, next) => {
                db.query(`SELECT level FROM permission_role WHERE permission_role_id = ${req.query.id}`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            common.role_level_check(next, res, req.session['admin_id'], data[0].level);
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            })

            router.use('/detail', (req, res) => {
                db.query(`SELECT * FROM permission_role WHERE permission_role_id = ${req.query.id}`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            res.render('admingly/web/admin_center.ejs', { permission_role_id: req.query.id, permission_role_name: data[0].permission_role_name, nav, menu, content: 'permission_detail', menuClick: 0, itemClick: 0 })
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            });

            //权限的添加与修改
            router.get('/editPermission', (req, res) => {

    		//禁止修改权限
    		res.redirect('/error');
            //res.render('admingly/web/admin_center.ejs', { nav, menu, content: 'permission_edit', menuClick: 0, itemClick: 2 })
            })

            //权限的修改
            router.get('/editPermission/edit', (req, res) => {
                var permission_func_id = req.query.permission_func_id;
                var field = req.query.field;
                var value = req.query.value;
                db.query(`UPDATE permission_func SET ${field} = '${value}' \
                    WHERE permission_func_id = ${permission_func_id}`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        res.status(200).send({ msg: "修改成功" }).end();
                    }
                })
            })

            //权限的添加
            router.get('/editPermission/insert', (req, res) => {
                db.query(`SELECT * FROM permission_func_type`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        res.render('admingly/web/admin_center.ejs', { data, nav, menu, content: 'permission_edit_insert', menuClick: 0, itemClick: 0 })
                    }
                })
            })

            router.get('/editPermission/insert/insert', (req, res) => {
                var permission_func_name = req.query.permission_func_name;
                var location = req.query.location;
                var permission_func_type_id = req.query.permission_func_type_id;
                db.query(`INSERT INTO permission_func VALUES(null, '${permission_func_name}', '${permission_func_type_id}',\
                    0,'${location}',1)`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        res.redirect('/admingly/user/permission/editPermission');
                    }
                })
            })

            //权限的删除
            router.get('/editPermission/delete', (req, res) => {
                var permission_func_id = req.query.permission_func_id;
                db.query(`DELETE FROM permission_func WHERE permission_func_id = '${permission_func_id}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        res.status(200).send({ msg: "删除成功" }).end();
                    }
                })
            })

            // 从角色-功能表和管理员-功能表添加或删除相应功能
            // 更改为只从角色功能表中修改
            router.post('/edit',urlencodedParser, (req, res) => {
                var permission_role_id = req.body.permission_role_id;
                var permission_role_name = req.body.permission_role_name;

                var permission_func_id = req.body.permission_func_id;
                var checked = req.body.checked;
                if (checked == "true") {
                    db.query(`INSERT INTO permission_role_func\
                     VALUES (${permission_role_id},${permission_func_id})`, (err, data) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send('修改失败').end();
                        } else {
                            // ** 添加日志 **
                            var detail=`对角色${permission_role_name}授权，使角色拥有的权限增加`;
                            common.log_admin(req.session['admin_id'],"角色授权",detail);

                            res.status(200).send({ msg: "修改成功" }).end();

                            // db.query(`SELECT * FROM admin WHERE permission_role_id = ${permission_role_id}`, (err, data1) => {
                            //     if (err) {
                            //         console.log(err);
                            //     } else {
                            //         for (var i = 0; i < data1.length; i++) {
                            //             var a = 0;
                            //             var length = data1.length;
                            //             db.query(`INSERT INTO permission_admin_func VALUES ('${data1[i].admin_id}',${permission_func_id},1)`, (err, data2) => {
                            //                 if (err) {
                            //                     console.log(err);
                            //                 } else {
                            //                     a++;
                            //                     if (a == length - 1) {
                                                    
                            //                         res.status(200).send({ msg: "授权成功" }).end();
                            //                     }
                            //                 }
                            //             })
                            //         }
                            //         //** 添加日志 **
                            //     var detail=`对角色${permission_role_name}授权，使角色拥有的权限增加`;
                            //     common.log_admin(req.session['admin_id'],"角色授权",detail);
                        
                            //     }
                            // })
                        }
                    })
                } else {
                    db.query(`DELETE FROM permission_role_func\
                     WHERE permission_role_id = ${permission_role_id} \
                     AND permission_func_id = ${permission_func_id}`, (err, data) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send('修改失败').end();
                            // res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                            //** 添加日志 **
                            var detail=`对角色${permission_role_name}撤销一些权限`;
                            common.log_admin(req.session['admin_id'],"角色撤权",detail);
                            res.status(200).send({ msg: "修改成功" }).end();

                            // db.query(`SELECT * FROM admin WHERE permission_role_id = ${permission_role_id}`, (err, data1) => {
                            //     if (err) {
                            //         console.log(err);
                            //     } else {
                            //         for (var i = 0; i < data1.length; i++) {
                            //             var a = 0;
                            //             var length = data1.length;
                            //             db.query(`DELETE FROM permission_admin_func \
                            //                 WHERE admin_id = '${data1[i].admin_id}' \
                            //                 AND permission_func_id = ${permission_func_id} \
                            //                 AND isDefault = 1`, (err, data2) => {
                            //                 if (err) {
                            //                     console.log(err);
                            //                 } else {
                            //                     a++;
                            //                     if (a == length - 1) {
                            //                         res.status(200).send({ msg: "解除成功" }).end();
                            //                     }
                            //                 }
                            //             })
                            //         }
                            //          //** 添加日志 **
                            //         var detail=`对角色${permission_role_name}撤销一些权限`;
                            //         common.log_admin(req.session['admin_id'],"角色撤权",detail);
                            //     }
                            // })
                        }
                    })
                }
            })
            

            // 对类型修改 废弃
            router.post('/editType',urlencodedParser, (req, res) => {
                var permission_role_id = req.body.permission_role_id;
                var permission_role_name = req.body.permission_role_name;
                var permission_func_type_id = req.body.permission_func_type_id;
                var permission_func_id = req.body.permission_func_id;
                var checked = req.body.checked;
                if (checked == "true") {
                    db.query(`INSERT INTO permission_role_func\
                     VALUES (${permission_role_id},${permission_func_id})`, (err, data) => {
                        if (err) {
                            console.log(err);
                            res.redirect('/error');//res.status(500).send('database error').end();
                        } else {
                            db.query(`SELECT * FROM admin WHERE permission_role_id = ${permission_role_id}`, (err, data1) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    for (var i = 0; i < data1.length; i++) {
                                        var a = 0;
                                        var length = data1.length;
                                        db.query(`INSERT INTO permission_admin_func VALUES ('${data1[i].admin_id}',${permission_func_id},1)`, (err, data2) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                a++;
                                                if (a == length - 1) {
                                                    res.status(200).send({ msg: "授权成功" }).end();
                                                }
                                            }
                                        })
                                    }//** 添加日志 **
                                var detail=`对角色${permission_role_name}授权，使角色拥有的权限增加`;
                                common.log_admin(req.session['admin_id'],"角色授权",detail);
                        
                                }
                            })
                        }
                    })
                } else {
                    var permission_func_ids = new Array();
                    db.query(`SELECT permission_func_id FROM permission_func WHERE permission_func_type_id = ${permission_func_type_id}`, (err, data1) => {
                        if (err) {
                            console.log(err);
                        } else {
                            for (var i = 0; i < data1.length; i++) {
                                permission_func_ids.push(data1[i].permission_func_id);
                            }
                            var queryA1 = "DELETE FROM permission_role_func WHERE permission_role_id = " + permission_role_id + " AND "
                            var queryB = "";
                            for (var i = 0; i < permission_func_ids.length; i++) {
                                if (i == 0) {
                                    queryB += "( permission_func_id = " + permission_func_ids[i]
                                } else if (i == permission_func_ids.length - 1) {
                                    queryB += " OR permission_func_id = " + permission_func_ids[i] + ")"
                                } else {
                                    queryB += " OR permission_func_id = " + permission_func_ids[i]
                                }
                            }

                            db.query(queryA1 + queryB, (err, data2) => {
                                if (err) {
                                    console.log(err);
                                    res.redirect('/error');//res.status(500).send('database error').end();
                                } else {
                                    db.query(`SELECT * FROM admin WHERE permission_role_id = ${permission_role_id}`, (err, data3) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            for (var i = 0; i < data3.length; i++) {
                                                var a = 0;
                                                var length = data3.length;
                                                queryA2 = "DELETE FROM permission_admin_func WHERE isDefault = 1 AND admin_id = '" + data3[i].admin_id + "' AND "
                                                db.query(queryA2 + queryB, (err, data2) => {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        a++;
                                                        if (a == length - 1) {
                                                            res.status(200).send({ msg: "解除成功" }).end();
                                                        }
                                                    }
                                                })
                                            }
                                            //** 添加日志 **
                                    var detail=`对角色${permission_role_name}撤销一些权限`;
                                    common.log_admin(req.session['admin_id'],"角色撤权",detail);
                                
                                        }
                                    })
                                }
                            })

                        }
                    })
                }
            })

            router.use('/edit_data', (req, res) => {
                db.query(`SELECT permission_func.*,permission_func_type.permission_func_type_name \
                            FROM permission_func\
                            LEFT JOIN permission_func_type \
                            ON permission_func_type.permission_func_type_id = permission_func.permission_func_type_id \
                            ORDER BY permission_func_type_id, isType DESC`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                        if (common.debugData(data)) {
                       var permission_role_name = null;
                        var array = [];
                        var attrs = Object.keys(data[0]);
                        for (var i = 0; i < data.length; i++) {
                            var item = {}
                            item.index = i + 1;
                            for (var a = 0; a < attrs.length; a++) {
                                item[attrs[a]] = data[i][attrs[a]];
                            }
                            array.push(item);
                        }
                        var out = {
                            code: 0,
                            msg: "",
                            count: array.length,
                            data: array
                        }

                        res.status(200).send(JSON.stringify(out)).end();
                    } else {
                        res.redirect('/error');
                    }
                    }
                })
            });

            router.use('/detail_data', (req, res) => {
                db.query(`SELECT permission_func.*,permission_role_func.permission_role_id,permission_func_type.permission_func_type_name \
                            FROM permission_func\
                            LEFT JOIN permission_role_func\
                            ON permission_role_func.permission_role_id = ${req.query.id} \
                            AND permission_func.permission_func_id = permission_role_func.permission_func_id \
                            LEFT JOIN permission_func_type \
                            ON permission_func_type.permission_func_type_id = permission_func.permission_func_type_id \
                            ORDER BY permission_func_type_id, isType DESC`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                        if (common.debugData(data)) {
                        var permission_role_name = null;
                        var array = [];
                        var attrs = Object.keys(data[0]);
                        for (var i = 0; i < data.length; i++) {
                            var item = {}
                            item.index = i + 1;
                            for (var a = 0; a < attrs.length; a++) {
                                item[attrs[a]] = data[i][attrs[a]];
                            }
                            array.push(item);
                        }
                        var out = {
                            code: 0,
                            msg: "",
                            count: array.length,
                            data: array
                        }

                        res.status(200).send(JSON.stringify(out)).end();
                    } else {
                        res.redirect('/error');
                    }

                        
                    }
                })
            });

        }
    });
    return router;
}