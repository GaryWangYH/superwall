const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const common = require('../../../../libs/common');
const moment = require("moment");

const db = common.db();

module.exports = function() {
    var router = express.Router();

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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "log_myoper", menuClick: 4, itemClick: 0 })
            });
             router.get('/detail', (req, res) => {
                db.query(`SELECT * FROM view_log_admin WHERE log_id = '${req.query.id}'`,(err,data)=>{
                    if(err){
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    }else{
                        if (common.debugData(data)) {
                            data[0].date = moment(data[0].date).format("YYYY-MM-DD HH:mm");
                            res.render('admingly/web/admin_center.ejs', {data:data[0], nav, menu, content: "log_detail", menuClick: 4, itemClick: 0 })
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            });
        }
    });

    router.get('/data', (req, res) => {
        var start_time = req.query.start_time;
        var end_time = req.query.end_time;

        if (!start_time) {
            start_time = moment().subtract(7, 'days').format("YYYY-MM-DD HH:mm:ss");
        }
        if (!end_time) {
            end_time = moment().format("YYYY-MM-DD HH:mm:ss");
        }

        var query = `SELECT * FROM view_log_admin \
                WHERE date BETWEEN \
                '${start_time}' AND \
                '${end_time}' AND \
                admin_id = '${req.session['admin_id']}'`

        query += `ORDER BY date DESC`;

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');
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

    return router;
}