const express = require('express');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');

const db = common.db();

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    
    router.get("/",(req,res)=>{
    	db.query(`SELECT * FROM data_hss_discount ORDER BY value`,(err,data)=>{
    		if(err){
    			console.log(err);
    		}else{
    			res.status(200).send(data).end();
    		}
    	})
    })

    router.post("/modify",urlencodedParser,(req,res)=>{
        var value = req.body.value;
        var id = req.body.id;
        var discount = req.body.discount;
    	db.query(`UPDATE data_hss_discount SET value = '${value}',\
    		discount = '${discount}' WHERE id = '${id}'`,(err,data)=>{
    		if(err){
    			console.log(err);
    		}else{

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"修改一条高防服务器折扣",
                    `一条折扣规则修改后阈值为${value}，折扣为${discount}`)

    			res.status(200).send({msg:"修改成功"}).end();
    		}
    	})
    })

    router.post("/new",urlencodedParser,(req,res)=>{
        var value = req.body.value;
        var discount = req.body.discount;
    	db.query(`INSERT INTO data_hss_discount(id,value,discount) \
    		VALUE(null,'${value}','${discount}')`,(err,data)=>{
    		if(err){
    			console.log(err);
    		}else{

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"新增一条高防服务器折扣",
                    `新增一条阈值为${value}，折扣为${discount}的折扣规则`)

    			res.status(200).send({msg:"添加成功"}).end();
    		}
    	})
    })

    router.post("/delete",urlencodedParser,(req,res)=>{
        var value = req.body.value;
        var id = req.body.id;
        var discount = req.body.discount;
    	db.query(`DELETE FROM data_hss_discount WHERE id = '${id}'`,(err,data)=>{
    		if(err){
    			console.log(err);
    		}else{

                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"删除一条高防服务器折扣",
                    `删除一条阈值为${value}，折扣为${discount}的折扣规则`)

    			res.status(200).send({msg:"删除成功"}).end();
    		}
    	})
    })

    return router;
}