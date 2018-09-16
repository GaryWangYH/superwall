const fs = require('fs');
const express = require('express');
const common = require('../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const uuid = require('node-uuid');
const db = common.db();
const createExcel = require('../../../static/js/excel');


module.exports = function() {
    var router = express.Router();
    var jsonParser = bodyParser.json();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
    var menu = {};
    var limitend;   //窗口右,页数范围
    var limitbegin; //窗口左,窗口大小最大为十
    var limitlength=500;    //数据库一次搜索长度,limit*5
    var storedata=new Array();   //存放千条数据,limit*10
    var sum=0;
    var count=0;
    var type="start";
	var oldchange=-2; 
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
            
              var kind=req.query.kind;
              if(!kind)  kind='all';
           db.query(`SELECT ID,username FROM user `, (err, data1) => {
                            if (err) {
                                console.log(err);
                               res.redirect('/error');// res.status(500).send('database error').end();
                            }
                            else{  

                                res.render('admingly/web/admin_center.ejs', { nav, menu, data1,kind,content: "report", menuClick: 2, itemClick: 0 });

                            }
            });
            });              
					  }
    });
	

    router.get('/table', function(req, res){
        var page = req.query.page;
        var limit = req.query.limit;
        var user_name=req.query.user;
        //var user_name=req.query.admin;

        var range=req.query.range;
        var array = range.split("~");
        var left=array[0].trim()+' 00:00:00';
        var right=array[1].trim()+' 23:59:59';

        var change=req.query.change;
        var sqlstring;
        var start;                           // 
        var end;                             // 
        var begin;                          //数据库开始位置

        if(!user_name||user_name.length==0) user_name='0';

        if(change!=oldchange)           //日期变更
        {   
            limitend=0;  
            limitbegin=0; 
            oldchange=change;
        }
        if(req.query.type!=type)
        {                                    
            type=req.query.type;
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
                  sum:sum,
                  data: arraySlice
              }
                res.status(200).send(JSON.stringify(allItems)).end();
                return;
              }

              switch (req.query.type) {
                    case 'all':
                        sqlstring = ` proc_record_all_admin`;
                        break;
                    case 'basic':
                        sqlstring = ` proc_record_basic_admin`;
                        break;
                    case 'elastic':
                        sqlstring = ` proc_record_elastic_admin`;
                        break;
                    case 'recharge':
                        sqlstring = ` proc_record_recharge_admin`;
                        break;
                    case 'cashback':
                        sqlstring = ` proc_record_refund_admin `;
                        break;
                    default:
                        return;
                        break;
                }
            db.query(`CALL ${sqlstring}('${user_name}','${left}','${right}',${begin},${limitlength})`, function(err, rows, fields) {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var data = rows[1];
                var row=rows[0];
                sum=row[0].sum;
                count=row[0].count;
                var flag=(page-1)%10>4?5*limit:0;     //改变数据的前五百十还是后五百十
                for (var i = 0; i < data.length; i++)
                {
                    data[i].number=i+1+begin;
                    data[i]._time=moment(data[i]._time).format('YYYY-MM-DD HH:mm:ss');
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
                    sum:sum,
                    data: arraySlice
                }
                  res.status(200).send(JSON.stringify(allItems)).end();                 
            }           
          });
        });

		router.post('/excel', urlencodedParser, function(req, res){

      var type = req.body.type;
      var range = req.body.range;
      var user_name=req.body.user;
      var sqlstring='';
      var array1 = range.split("~");
      var left=array1[0].trim()+' 00:00:00';
      var right=array1[1].trim()+' 23:59:59';

      switch(type){
          case 'all': 
          break;
          case 'hss':
          sqlstring=` FROM view_record_pay_hss `;
          break;
          case 'ddos':
          sqlstring=` FROM view_record_pay_ddos `;
          break;
          case 'elastic':
          sqlstring=` FROM view_record_pay_elastic `;
          break;
          case 'recharge':
          sqlstring=` FROM view_record_recharge `;
          break;
          case 'refund_hss':
          sqlstring=` FROM view_record_refund_hss `;
          break;
          case 'refund_ddos':
          sqlstring=` FROM view_record_refund_ddos `;
          break;
          case 'refund_elastic':
          sqlstring=` FROM view_record_refund_elastic `;
          break;
          case 'cost':
          sqlstring=` FROM view_cost `;
          break;
          case 'receipt':
          sqlstring=` FROM view_receipt `;
          break;
          default:return;break;
          }
          if(type=='all'){
                 db.query(`CALL proc_pay_all('${user_name}','${left}','${right}',0,${count})`, function(err, rows, fields) {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var data = rows[1];
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        orderid: data[i].orderid,
                        name: data[i].name,
                        amount: data[i].amount,
                        _time: moment(data[i]._time).format('YYYY-MM-DD HH:mm:ss'),
                        _describe: data[i]._describe
                        
                    }
                    array.push(item);
                  }

              var headers = ['orderid', 'name', 'amount', '_time', '_describe']
              var path=process.cwd().toString()+'\\static\\download\\'+moment().format('YYYYMMDDHHmmss')+type+'.xlsx';
              var filename=moment().format('YYYYMMDDHHmmss')+type+'.xlsx';
                  createExcel.createExcel(headers,array,path,function(err, data){
                  if (err) {
                      res.status(500).send(err).end();} 
                  else {
                    res.status(200).send(path).end();
                      }
                  });
                }               
            });
            return;
          }

      if(user_id=='0')
       {sqlstring+=` WHERE `;}
      else  {sqlstring+=` WHERE id='${user_id}' and `;}
      sqlstring=`select orderid, name, amount,_time,_describe ${sqlstring} _time BETWEEN '${left}' AND '${right}' order by _time`;
      db.query(sqlstring, (err, data) => {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item = {
                        orderid: data[i].orderid,
                        name: data[i].name,
                        amount: data[i].amount,
                        _time: moment(data[i]._time).format('YYYY-MM-DD HH:mm:ss'),
                        _describe: data[i]._describe
                        
                    }
                    array.push(item);
                  }

              var headers = ['orderid', 'name', 'amount', '_time', '_describe']
              var path=process.cwd().toString()+'\\static\\download\\'+moment().format('YYYYMMDDHHmmss')+type+'.xlsx';
              var filename=moment().format('YYYYMMDDHHmmss')+type+'.xlsx';
                  createExcel.createExcel(headers,array,path,function(err, data){
                  if (err) {
                      res.status(500).send(err).end();} 
                  else {
                    res.status(200).send(path).end();
                      }
                  });
                  return;
                }
            });
     });
    router.get('/download', function(req, res){
      path= req.query.path;
      filename=path.substring(path.lastIndexOf("\\")+1);
    var stats = fs.statSync(path);
    if (stats.isFile()) {
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=' + filename,
            "Content-Length": stats.size
        });
        var fileReadStream = fs.createReadStream(path);
            fileReadStream.pipe(res);
            fileReadStream.on('end',function(){
          createExcel.deleteFile(path,function(err, data){
        });
        });
    } else {
        res.end(404);
    }

    });


    return router;
}
