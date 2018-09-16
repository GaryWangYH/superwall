const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment = require("moment");

const db = common.db();

module.exports = function() {
    var router = express.Router();
    var limitend=0;   //窗口右,页数范围
    var limitbegin=0; //窗口左,窗口大小最大为十
    var limitlength=50;    //数据库一次搜索长度,limit*5
    var storedata=new Array();   //存放X条数据,limit*10
    var count=0;
    var oldid;                   //id变更重新加载
    router.get('/pay',(req,res)=>{
        var id = req.query.order_id;
        var page = req.query.page;
        var limit = req.query.limit;
        var start;                           // 
        var end;                             // 
        var begin;                          //数据库开始位置
        var querystring;
        if(id!=oldid)
        {   
            limitend=0;  
            limitbegin=0; 
            oldid=id;
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
            querystring=`SELECT amount,payTime,_describe FROM record_pay_elastic WHERE order_id = '${id}' AND amount<>0 \ \
            order by payTime desc limit ${begin},${limitlength}`;
            db.query(`SELECT COUNT(1) as count FROM record_pay_elastic WHERE order_id = '${id}'`, (err, data3) => {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                count=data3[0].count;
        db.query(querystring, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var flag=(page-1)%10>4?5*limit:0;
                for (var i = 0; i < data.length; i++) {
                    data[i].index= i + 1 + begin;
                    data[i].payTime= moment(data[i].payTime).format('YYYY-MM-DD HH:mm:ss'),
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
        })
            }
        });


    })

    return router;
}