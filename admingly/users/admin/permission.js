const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
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
            router.get('/page', (req, res) => {
                db.query(`SELECT * FROM admin WHERE admin_id = '${req.query.admin_id}'`, (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');
                        // res.status(500).send('database error').end();
                    } else {
                        if (common.debugData(data)) {
                            res.render('admingly/web/admin_center.ejs', { admin_account: data[0].admin_account, admin_name: data[0].admin_name, admin_id: req.query.admin_id, nav, menu, content: "user_admin_permission", menuClick: 0, itemClick: 2 })
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            });
        }
    });

    router.get('/detail_data', (req, res) => {
        db.query(`SELECT permission_func.*,permission_admin_func.admin_id,permission_func_type.permission_func_type_name \
                            FROM permission_func\
                            LEFT JOIN permission_admin_func\
                            ON permission_admin_func.admin_id = '${req.query.id}' \
                            AND permission_func.permission_func_id = permission_admin_func.permission_func_id \
                            LEFT JOIN permission_func_type \
                            ON permission_func_type.permission_func_type_id = permission_func.permission_func_type_id \
                            ORDER BY permission_func_type_id, isType DESC`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//
                    // res.status(500).send('database error').end();
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

    router.get('/edit', (req, res) => {
        var admin_id = req.query.admin_id;
        var permission_func_id = req.query.permission_func_id;
        var checked = req.query.checked;
        if (checked == "true") {
            db.query(`INSERT INTO permission_admin_func\
                     VALUES ('${admin_id}',${permission_func_id},0)`, (err, data) => {
                if (err) {
                    console.log(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {
                    res.status(200).send({ msg: "授权成功" }).end();
                }
            })
        } else {
            db.query(`DELETE FROM permission_admin_func\
                     WHERE admin_id = '${admin_id}' \
                     AND permission_func_id = ${permission_func_id}`, (err, data) => {
                if (err) {
                    console.log(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {
                    res.status(200).send({ msg: "解除成功" }).end();
                }
            })
        }
    })

    router.get('/editType', (req, res) => {
        var admin_id = req.query.admin_id;
        var permission_func_id = req.query.permission_func_id;
        var permission_func_type_id = req.query.permission_func_type_id;
        var checked = req.query.checked;
        if (checked == "true") {
            db.query(`INSERT INTO permission_admin_func\
                     VALUES ('${admin_id}',${permission_func_id},1)`, (err, data) => {
                if (err) {
                    console.log(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {
                    res.status(200).send({ msg: "授权成功" }).end();
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
                    var queryA1 = "DELETE FROM permission_admin_func WHERE admin_id = '" + admin_id + "' AND "
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
                    db.query(queryA1 + queryB, (err, data) => {
                        if (err) {
                            console.log(err);
                           res.redirect('/error');// res.status(500).send('database error').end();
                        } else {
                            res.status(200).send({ msg: "解除成功" }).end();
                        }
                    })
                }
            })
        }
    })

    return router;
}