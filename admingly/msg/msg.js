const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const common = require('../../../libs/common');
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "msg", menuClick: 1, itemClick: 0 });
            });
        }
    });

    router.get("/setRead", (req, res) => {
        var info_admin_id = req.query.info_admin_id;
        db.query(`UPDATE info_admin SET info_status = 1002, \
            readTime = '${moment().format("YYYY-MM-DD HH:mm:ss")}' \
            WHERE info_admin_id = '${info_admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                res.status(200).send({ msg: "修改成功" }).end();
            }
        })
    })

    router.get("/delete", (req, res) => {
        var data = req.query.data;
        var info_admin_ids;
        var query = `DELETE FROM info_admin WHERE `
        for (var i = 0; i < data.length; i++) {
            if (i == data.length - 1) {
                query += "info_admin_id = '" + data[i].info_admin_id + "'";
            }else{
                query += "info_admin_id = '" + data[i].info_admin_id + "' OR ";
            }
        }
        var insertQuery = `INSERT INTO info_admin_deleted VALUES `
        for (var i = 0; i < data.length; i++) {
            if (i == data.length - 1) {
                if (!data[i].readTime) {
                    if (!data[i].admin_role) {
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        null,'${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}',null,\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}');`;
                    }else{
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        '${data[i].admin_role}','${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}',null,\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}');`;
                    }
                }else{
                    if (!data[i].admin_role) {
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        null,'${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}','${data[i].readTime}',\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}');`;
                    }else{
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        '${data[i].admin_role}','${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}','${data[i].readTime}',\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}');`;
                    }
                }
            }else{
                if (!data[i].readTime) {
                    if (!data[i].admin_role) {
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        null,'${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}',null,\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}'),`;
                    }else{
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        '${data[i].admin_role}','${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}',null,\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}'),`;
                    }
                }else{
                    if (!data[i].admin_role) {
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        null,'${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}','${data[i].readTime}',\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}'),`;
                    }else{
                        insertQuery += `(replace(UUID(),'-',''),'${data[i].info_admin_id}',\
                        '${data[i].admin_role}','${data[i].admin_id}','${data[i].info_url}','${data[i].info_describe}',\
                        '${data[i].info_status}','${data[i].buildTime}','${data[i].readTime}',\
                        '${moment().format("YYYY-MM-DD HH:mm:ss")}'),`;
                    }
                }
            }
        }
        db.query(query,(err,data)=>{
            if(err){
                console.log(err);
                res.status(500).send("删除失败").end();
            }else{
                db.query(insertQuery,(err,data1)=>{
                    if(err){
                        console.log(err);
                        res.status(500).send("删除失败").end();
                    }else{
                        res.status(200).send({ msg: "删除成功" }).end();
                    }
                })
            }
        })
    })

    router.get("/setAllRead", (req, res) => {
        var data = req.query.data;
        var info_admin_ids;
        var query = `UPDATE info_admin SET info_status = 1002, \
            readTime = '${moment().format("YYYY-MM-DD HH:mm:ss")}' WHERE `
        for (var i = 0; i < data.length; i++) {
            if (i == data.length - 1) {
                query += "info_admin_id = '" + data[i].info_admin_id + "'";
            }else{
                query += "info_admin_id = '" + data[i].info_admin_id + "' OR ";
            }
        }

        db.query(query,(err,data)=>{
            if(err){
                console.log(err);
                res.status(500).send("设置失败").end();
            }else{
                res.status(200).send({ msg: "设置成功" }).end();
            }
        })
    })

    router.get("/recover", (req, res) => {
        
        var data = req.query.data;

        if (!data.readTime) {
            if (!data.admin_role) {
                var query = `INSERT INTO info_admin VALUES(replace(UUID(),'-',''),\
                null,'${data.admin_id}','${data.info_url}','${data.info_describe}',\
                '${data.info_status}','${data.buildTime}',null)`;
            }else{
                var query = `INSERT INTO info_admin VALUES(replace(UUID(),'-',''),\
                '${data.admin_role}','${data.admin_id}','${data.info_url}','${data.info_describe}',\
                '${data.info_status}','${data.buildTime}',null)`;
            }
        }else{
            if (!data.admin_role) {
                var query = `INSERT INTO info_admin VALUES(replace(UUID(),'-',''),\
                null,'${data.admin_id}','${data.info_url}','${data.info_describe}',\
                '${data.info_status}','${data.buildTime}','${data.readTime}')`;
            }else{
                var query = `INSERT INTO info_admin VALUES(replace(UUID(),'-',''),\
                '${data.admin_role}','${data.admin_id}','${data.info_url}','${data.info_describe}',\
                '${data.info_status}','${data.buildTime}','${data.readTime}')`;
            }
        }
        db.query(query,(err,data1)=>{
            if(err){
                console.log(err);
                res.status(500).send("还原失败").end();
            }else{
                db.query(`DELETE FROM info_admin_deleted WHERE info_admin_deleted_id = '${data.info_admin_deleted_id}'`,(err,data2)=>{
                    if(err){
                        console.log(err);
                        res.status(500).send("还原失败").end();
                    }else{
                        res.status(200).send({ msg: "还原成功" }).end();
                    }
                })
            }
        })
    })

   router.get("/list/data", (req, res) => {

        var query = `SELECT * \
                    FROM info_admin \
                    WHERE admin_id = '${req.session['admin_id']}' \
                    ORDER BY info_status, buildTime DESC`

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                for (var i = 0; i < data.length; i++) {
                    data[i].index = i + 1;
                    data[i].buildTime = moment(data[i].buildTime).format("YYYY-MM-DD HH:mm:ss");
                    data[i].buildTime_show = moment(data[i].buildTime).format("MM-DD HH:mm:ss");
                    if (data[i].readTime) {
                        data[i].readTime = moment(data[i].readTime).format("YYYY-MM-DD HH:mm:ss");
                        data[i].readTime_show = moment(data[i].readTime).format("MM-DD HH:mm:ss");
                    }
                    if (data[i].info_status == '1001') {
                        data[i].info_status_text = '未读';
                    }else{
                        data[i].info_status_text = '已读';
                    }
                }

                var out = {
                    data: data
                }

                res.status(200).send(JSON.stringify(out)).end();
            }
        })
   })

    router.get("/list/deleted", (req, res) => {

        var query = `SELECT * \
                    FROM info_admin_deleted \
                    WHERE admin_id = '${req.session['admin_id']}' \
                    ORDER BY deleteTime DESC`

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                for (var i = 0; i < data.length; i++) {
                    data[i].index = i + 1;
                    data[i].buildTime = moment(data[i].buildTime).format("YYYY-MM-DD HH:mm:ss");
                    data[i].buildTime_show = moment(data[i].buildTime).format("MM-DD HH:mm:ss");
                    data[i].deleteTime = moment(data[i].deleteTime).format("YYYY-MM-DD HH:mm:ss");
                    data[i].deleteTime_show = moment(data[i].deleteTime).format("MM-DD HH:mm:ss");
                    if (data[i].readTime) {
                        data[i].readTime = moment(data[i].readTime).format("YYYY-MM-DD HH:mm:ss");
                        data[i].readTime_show = moment(data[i].buildTime).format("MM-DD HH:mm:ss");
                    }
                    if (data[i].info_status == '1001') {
                        data[i].info_status_text = '未读';
                    }else{
                        data[i].info_status_text = '已读';
                    }
                }

                var out = {
                    data: data
                }

                res.status(200).send(JSON.stringify(out)).end();
            }
        })
   })


    return router;
}