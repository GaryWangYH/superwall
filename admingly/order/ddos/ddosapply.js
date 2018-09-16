const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment = require('moment');
var db = common.db();

module.exports = function() {
    var router = express.Router();

    var menu = {};
    var limitend=0;   //窗口右,页数范围
    var limitbegin=0; //窗口左,窗口大小最大为十
    var limitlength=500;    //数据库一次搜索长度,limit*5
    var storedata=new Array();   //存放千条数据,limit*10
    var count=0;
	var oldtype=-2;
    fs.readFile('./static/txt/admin_center_order_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "ddosapply", menuClick: 1, itemClick: 1 })
            });
    router.get('/table', function(req, res){
        var page = req.query.page;
        var limit = req.query.limit;
        var range=req.query.range;
        var array = range.split("~");
        var left=array[0].trim()+' 00:00:00';
        var right=array[1].trim()+' 23:59:59';
        var start;                           // 
        var end;                             // 
        var begin;                          //数据库开始位置
        var querystring;
        var type=req.query.type;            //日期变更重新加载
        if(type!=oldtype)           //日期变更
        {   
            limitend=0;  
            limitbegin=0; 
            oldtype=type;
        }
        if(page==1&&type==-1)           //无换页
        {   
            limitend=0;  
            limitbegin=0; 
        }
        if(page>limitend)
        {          //需要新增数据
          limitend=parseInt((page-1)/5)*5+5;            //窗口右移
            if(limitend<=limitbegin+15) limitbegin=limitend-10;   //窗口右移 
            else limitbegin=limitend-5;         //窗口右移        
          begin=(limitend-5)*limit;
        } 
        else if(page<=limitbegin)
        {
          limitbegin=parseInt((page-1)/5)*5;            //窗口左移
            if(limitend<=limitbegin+15) limitend=limitbegin+10; //窗口左移 
            else  limitend=limitbegin+5;         //窗口左移    
          begin=limitbegin*limit;  
        }else{ 

                start=parseInt((page-1)%10*limit);
                end= parseInt(start)+parseInt(limit);

                if(page*limit>count) end=start+count%limit;
                
                var arraySlice = storedata.slice(start,end);
                var allItems = {
                    code: 0,
                    msg: "",
                    count: count,
                    data: arraySlice
                }
                  res.status(200).send(JSON.stringify(allItems)).end();
                  return;
              }
        db.query(`SELECT permission_role_id FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data1) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                if (common.debugData(data1)) {
                        var isclerk=' ';
              if (data1[0].permission_role_id == "1004") {
                isclerk=` refund_clerkid = '${req.session['admin_id']}' and `;
                querystring = `SELECT refund_id,refund_orderid,refund_ddosname,refund_price,\
                    refund_applyer,refund_time,refund_reason,refund_clerkname,refund_status\
                    FROM view_refund_ddosapply WHERE refund_clerkid = '${req.session['admin_id']}'\
                    and refund_time BETWEEN '${left}' AND '${right}' order by refund_time desc\
                    limit ${begin},${limitlength}`;
                } else {
                    querystring = `SELECT refund_id,refund_orderid,refund_ddosname,refund_price,\
                    refund_applyer,refund_time,refund_reason,refund_clerkname,refund_status\
                    FROM view_refund_ddosapply WHERE refund_time BETWEEN '${left}' AND '${right}' order by refund_time desc\
                    limit ${begin},${limitlength}`;
                }
                db.query(`SELECT COUNT(1) as count FROM view_refund_ddosapply where ${isclerk} refund_time BETWEEN '${left}' AND '${right}'`, (err, data3) => {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
              count=data3[0].count;
               db.query(querystring, (err, data) => {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var flag=(page-1)%10>4?5*limit:0;     //改变数据的前五百十还是后五百十
                for (var i = 0; i < data.length; i++)
                { 
                    data[i].number=i+1;
                    data[i].refund_time=moment(data[i].refund_time).format('YYYY-MM-DD HH:mm:ss');
                    storedata[i+flag]=data[i];
                }
                start=parseInt((page-1)%10*limit);
                end= parseInt(start)+parseInt(limit);
                if(page*limit>count) end=start+count%limit;
                var arraySlice = storedata.slice(start,end);
                var allItems = {
                    code: 0,
                    msg: "",
                    count: count,
                    data: arraySlice
                }

                  res.status(200).send(JSON.stringify(allItems)).end();
              }
            });
                    }
                });
            } else {
                        res.redirect('/error');
                    }
            }
            });
        });

        }
    });
   

    return router;
}