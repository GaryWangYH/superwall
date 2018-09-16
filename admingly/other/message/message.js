const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const common = require('../../../../libs/common');
const moment = require("moment");

const db = common.db();

module.exports = function() {
    var router = express.Router();

    router.use("/detail", require('./detail.js')());

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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "other_message", menuClick: 3, itemClick: 0 })
            });
        }
    });

    router.get('/init', (req,res)=>{
        db.query(`SELECT * FROM msg_config`,(err,data)=>{
            if (err) {
                console.log(err);
                res.redirect('/error');
            } else {
                if (common.debugData(data)) {
                    res.status(200).send(data).end();
                } else {
                    res.redirect('/error');
                }
            }
        })
    });

    router.get('/set', (req,res)=>{
        var msg_status = req.query.msg_status;
        var msg_name = req.query.msg_name;
        var isOpen;
        if (msg_status == "true") {
            isOpen = 1;
        }else{
            isOpen = 0;
        }
        var query;
        if (msg_name == "user_end_advance_3") {
            if (msg_status == "true") {
                query = insertConfig(3);
            }else{
                query = deleteConfig(3);
            }
        }else if (msg_name == "user_end_advance_5") {
            if (msg_status == "true") {
                query = insertConfig(5);
            }else{
                query = deleteConfig(5);
            }
        }else if (msg_name == "user_end_advance_7") {
            if (msg_status == "true") {
                query = insertConfig(7);
            }else{
                query = deleteConfig(7);
            }
        }else{
            query = `UPDATE msg_config SET isOpen = '${isOpen}' WHERE msg_name = '${msg_name}'`;
        }
        db.query(query,(err,data)=>{
            if (err) {
                console.log(err);
            } else {
                res.status(200).send({msg: "修改成功"}).end();
            }
        })
    })

    function insertConfig(day){
        return `INSERT INTO msg_config(msg_name, isOpen, remark) VALUES('user_end_advance',1,'${day}')`;
    }

    function deleteConfig(day){
        return `DELETE FROM msg_config WHERE msg_name = 'user_end_advance' AND remark = '${day}'`;
    }

    router.get("/24hs_num",(req,res)=>{
        db.query(`SELECT count(*) AS num FROM msg_user WHERE msg_date BETWEEN \
            '${moment().subtract(1,'days').format("YYYY-MM-DD HH:mm:ss")}' AND \
            '${moment().format("YYYY-MM-DD HH:mm:ss")}'`,(err,data)=>{
                if(err){
                    console.log(err);
                }else{
                    res.status(200).send({num: data[0].num}).end();
                }
            })
    });

    router.get("/7ds_num",(req,res)=>{
        db.query(`SELECT count(*) AS num FROM msg_user WHERE msg_date BETWEEN \
            '${moment().subtract(7,'days').format("YYYY-MM-DD HH:mm:ss")}' AND \
            '${moment().format("YYYY-MM-DD HH:mm:ss")}'`,(err,data)=>{
                if(err){
                    console.log(err);
                }else{
                    res.status(200).send({num: data[0].num}).end();
                }
            })
    })

    return router;
}