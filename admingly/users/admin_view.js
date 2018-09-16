const express = require('express');
const fs = require('fs');
const common = require('../../../libs/common');

const db = common.db();

module.exports = function() {
    var router = express.Router();

    var menu = {};

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
            var nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                db.query(`SELECT level FROM admin,permission_role WHERE admin.permission_role_id = permission_role.permission_role_id AND admin.admin_id = '${req.session['admin_id']}'`,(err,data3)=>{
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {
                        db.query(`SELECT * FROM permission_role WHERE level > ${data3[0].level}`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                res.render('admingly/web/admin_center.ejs', {data, nav, menu, content: "admin_new", menuClick: 0, itemClick: 1 })
                            }
                        })
                    }
                });
            });
        }
    });

    return router;
}