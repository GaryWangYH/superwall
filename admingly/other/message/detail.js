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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "other_message_detail", menuClick: 3, itemClick: 0 })
            });
        }
    });

    router.get('/data', (req, res) => {
        var start_time = moment().subtract(6, 'days').format("YYYY-MM-DD 00:00:00");
        var end_time = moment().add(1, 'days').format("YYYY-MM-DD 00:00:00");
        db.query(`SELECT * FROM msg_user WHERE msg_date BETWEEN \
            '${start_time}' AND \
            '${end_time}'`,(err,data)=>{
                if(err){
                    console.log(err);
                }else{
                    for (var i = 0; i < data.length; i++) {
                        data[i].msg_date = moment(data[i].msg_date).format("YYYY-MM-DD HH:mm:ss");
                        data[i].index = i + 1;
                    }
                    var out = {
                        data: data,
                        size: data.length,
                        start_time: start_time,
                        end_time: end_time
                    }
                    res.status(200).send(JSON.stringify(out)).end();
                }
            })
    })

    router.get('/data_date', (req, res) => {
        var start_time = moment(req.query.start_time).format("YYYY-MM-DD 00:00:00");
        var end_time = moment(req.query.end_time).format("YYYY-MM-DD 00:00:00");
        db.query(`SELECT * FROM msg_user WHERE msg_date BETWEEN \
            '${start_time}' AND \
            '${end_time}'`,(err,data)=>{
                if(err){
                    console.log(err);
                }else{
                    for (var i = 0; i < data.length; i++) {
                        data[i].msg_date = moment(data[i].msg_date).format("YYYY-MM-DD HH:mm:ss");
                        data[i].index = i + 1;
                    }
                    var out = {
                        data: data,
                        size: data.length,
                        start_time: start_time,
                        end_time: end_time
                    }
                    res.status(200).send(JSON.stringify(out)).end();
                }
            })
    })

    return router;
}