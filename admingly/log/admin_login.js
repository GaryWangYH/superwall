const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const common = require('../../../libs/common');
const moment = require("moment");

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
                db.query(`SELECT permission_role_id,permission_role_name \
                        FROM  permission_role `,(err,data1)=>{
                            if (err) {
                                console.log(err);
                            }else{
                                res.render('admingly/web/admin_center.ejs', { permission_role:data1,nav, menu, content: "log_adminlogin", menuClick: 1, itemClick: 2 });
                            }
                        })
            });
        }
    });

    router.get('/data1', (req, res) => {
        var start_time = req.query.start_time;
        var end_time = req.query.end_time;

        if (!start_time) {
            start_time = moment().subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss");
        }
        if (!end_time) {
            end_time = moment().format("YYYY-MM-DD HH:mm:ss");
        }

        var query = `SELECT * FROM view_login_admin \
                WHERE date BETWEEN \
                '${start_time}' AND \
                '${end_time}' AND \
                admin_id = '${req.session['admin_id']}'`

        query += `ORDER BY date DESC`;

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                for (var i = 0; i < data.length; i++) {
                    data[i].index = i + 1;
                    data[i].date = moment(data[i].date).format("YYYY-MM-DD HH:mm");
                }

                var out = {
                    data: data,
                    start_time: start_time,
                    end_time: end_time
                }

                res.status(200).send(JSON.stringify(out)).end();
            }
        })
    });

    router.get('/data', (req, res) => {
        var start_time = req.query.start_time;
        var end_time = req.query.end_time;
        var admin_account = req.query.admin_account;
        var admin_name = req.query.admin_name;
        var permission_role_id = req.query.permission_role_id;

        if (!start_time) {
            start_time = moment().subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss");
        }
        if (!end_time) {
            end_time = moment().format("YYYY-MM-DD HH:mm:ss");
        }

        var query = `SELECT * FROM view_login_admin \
                WHERE date BETWEEN \
                '${start_time}' AND \
                '${end_time}' `

        // query += ` AND level > \
        //         (SELECT level \
        //             FROM admin,permission_role \
        //             WHERE admin_id = '${req.session['admin_id']}' \
        //             AND admin.permission_role_id = permission_role.permission_role_id
        //         ) `

        if (admin_account) {
            query += ` AND admin_account = '${admin_account}'`;
        }
        if (admin_name) {
            query += ` AND admin_name = '${admin_name}'`;
        }
        if (permission_role_id) {
            query += ` AND permission_role_id = '${permission_role_id}'`;
        }

        query += `ORDER BY date DESC`;

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                for (var i = 0; i < data.length; i++) {
                    data[i].index = i + 1;
                    data[i].date = moment(data[i].date).format("YYYY-MM-DD HH:mm");
                }

                if (permission_role_id) {
                    db.query(`SELECT permission_role_name FROM permission_role \
                    WHERE permission_role_id = '${permission_role_id}'`,(err,data1)=>{
                        if(err){
                            console.log(err);
                        }else{
                            var out = {
                                data: data,
                                start_time: start_time,
                                end_time: end_time,
                                admin_account: admin_account,
                                admin_name:admin_name,
                                permission_role_name: data1[0].permission_role_name
                            }

                            res.status(200).send(JSON.stringify(out)).end();
                        }
                    })
                }else{
                    var out = {
                        data: data,
                        start_time: start_time,
                        end_time: end_time,
                        admin_account: admin_account,
                        admin_name:admin_name,
                        permission_role_name: permission_role_id
                    }

                    res.status(200).send(JSON.stringify(out)).end();
                }

                
            }
        })
    });

    return router;
}