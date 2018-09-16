const express = require('express');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');

const db = common.db();

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};
    fs.readFile('./static/txt/admin_center_product_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product_os", menuClick: 0, itemClick: 4 })
            });
        }
    });

    router.get("/info",(req,res)=>{
        db.query(`SELECT * FROM data_os`,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                res.status(200).send(data).end();
            }
        })
    })

    router.post("/modify",urlencodedParser,(req,res)=>{
        var os_id = req.body.os_id;
        var os_name = req.body.os_name;
        db.query(`UPDATE data_os SET os_name = '${os_name}' \
            WHERE os_id = '${os_id}'`,(err,data)=>{
            if(err){
                console.log(err);
            }else{

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"修改操作系统",
                    `修改后操作系统名称为${os_name}`);

                res.status(200).send({msg:"修改成功"}).end();
            }
        })
    })

    router.post("/new",urlencodedParser,(req,res)=>{
        var os_name = req.body.os_name;
        db.query(`INSERT INTO data_os(os_id,os_name) \
            VALUE(null,'${os_name}')`,(err,data)=>{
            if(err){
                console.log(err);
            }else{

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"新增操作系统",
                    `新增操作系统，名称为${os_name}`);

                res.status(200).send({msg:"添加成功"}).end();
            }
        })
    })

    router.post("/delete",urlencodedParser,(req,res)=>{
        var os_id = req.body.os_id;
        var os_name = req.body.os_name;
        db.query(`DELETE FROM data_os WHERE os_id = '${os_id}'`,(err,data)=>{
            if(err){
                console.log(err);
            }else{

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"删除操作系统",
                    `删除操作系统`)

                res.status(200).send({msg:"删除成功"}).end();
            }
        })
    })

    return router;
}