// Entry Point of the API Server

const express = require('express');
const fs = require("fs");
const readline = require("readline");
/* Creates an Express application.
The express() function is a top-level
function exported by the express module.
*/
const app = express();
const { parse } = require("csv-parse");
/* To handle the HTTP Methods Body Parser
is used, Generally used to extract the
entire body portion of an incoming
request stream and exposes it on req.body
*/
const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
const testfile = 'tests.csv'
const patientfile = 'patients.csv'
const schedulefile = 'schedule.csv'

app.get('/getalltest', (req, res, next) => {
	const stream = fs.createReadStream(testfile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	let data = [];
	stream.on("data", function (row) {
		// 👇 split a row string into an array
		// then push into the data array
		data.push(row);
	})
	.on("error", function (error) {
	  console.log(error.message);
	})
	.on("end", function () {
	  // 👇 log the result array
	  res.send(JSON.stringify(data));
	});
})

app.get('/gettestbyid', (req, res, next) => {
	const testid = req.query.testid;
	const stream = fs.createReadStream(testfile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	testfound = false;
	stream.on("data", function (test) {
		// 👇 split a row string into an array
		// then push into the data array
		if(test['ID'] == testid){
			testfound = true;
			res.send(JSON.stringify(test));
		}
	});
	stream.on("end", () => {
		// 👇 reached the end of file
		if(!testfound) res.send('Invalid Test Id');
	});
})

app.get('/gettestbyname', (req, res, next) => {
	const testname = req.query.testname;
	const stream = fs.createReadStream(testfile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	testfound = false;
	stream.on("data", function (test) {
		// 👇 split a row string into an array
		// then push into the data array
		if(test['Kythuatxetnghiem'] == testname){
			testfound = true;
			res.send(JSON.stringify(test));
		}
	});
	stream.on("end", () => {
		// 👇 reached the end of file
		if(!testfound) res.send('Invalid Test Id');
	});
})

function extractAsUserCSV(users) {
	const header = ["UserID, UserName"];
	const rows = users.map(user =>
	   `${user.UserID},${user.UserName}`
	);
	return header.concat(rows).join("\n");
}

app.get('/createuser', (req, res, next) => {
	const username = req.query.username;
	const stream = fs.createReadStream(patientfile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	userfound = false;
	data = [];
	users = [];
	count = 0;
	stream.on("data", function (row) {
		// 👇 split a row string into an array
		// then push into the data array
		const user = {
			UserID: row['UserID'],
			UserName: row['UserName'],
		}
		// if(user.UserName == username){
		// 	userfound = true;
		// 	users.push(user);
		// }
		data.push(user);
		count++;
	});
	stream.on("close", () => {
		// 👇 reached the end of file
		if(userfound) res.send(JSON.stringify(users));
		else {
			const user = {
        UserID: "BN" + (count + 1) + "VN",
        UserName: username,
      };
			data.push(user);
			res.send(JSON.stringify(user));
		}
		fs.writeFile(patientfile, extractAsUserCSV(data), err => {
			if (err) {
				console.log('Error writing to csv file', err);
			} else {
				console.log(`saved as ${patientfile}`);
			}
		});
	});
})

function extractAsScheduleCSV(savechedules) {
	const header = ["TestID,UserID,Thoigianbatdau,Thoigianketthuc,Thoigiantraketqua,KetThuc,KhoiTao,CapNhat"];
	const rows = savechedules.map(test =>
	   `${test.testid},${test.userid},${test.starttime},${test.endtime},${test.testdue},${test.expried},${test.createon},${test.updateon}`
	);
	return header.concat(rows).join("\n");
}

function createSchedule(start, test, userid) {
	const d1 = new Date(start);
	d1.setMinutes(d1.getMinutes() + 15);
	d2 = new Date (d1);
	d2.setMinutes(d2.getMinutes() + test.testtime);
	d3 = new Date (d2);
	d3.setMinutes(d2.getMinutes() + test.testdue);
	const schedule = {
		testid: test.testid,
		userid: userid,
		starttime: d1,
		endtime: d2,
		testdue: d3,
		expried: 0,
		valid: true,
		createon: new Date(),
		updateon: ''
	}
	return schedule;
}

app.get('/createuserschedule', (req, res, next) => {
	const userid = req.query.userid;
	const userschedule = req.query.schedule;
	const stream = fs.createReadStream(testfile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	const tests = [];
	stream.on("data", function (row) {
		// 👇 split a row string into an array
		// then push into the data array
		const test = {
			testid: row['ID'],
			testname: row['Kythuatxetnghiem'],
			testtime: parseInt(row['Thoigianxetnghiem']) + 10,
			testdue: parseInt(row['Thoigiantraketqua'])
		}
		tests.push(test);
	});
	stream.on("close", () => {
		const schestream = fs.createReadStream(schedulefile).pipe(
			parse({
			delimiter: ",",
			columns: true,
			ltrim: true,
			})
		);
		var schedules = [];
		schestream.on("data", function (row) {
			// 👇 split a row string into an array
			// then push into the data array
			const test = {
				testid: row['TestID'],
				userid: row['UserID'],
				starttime: row['Thoigianbatdau'],
				endtime: row['Thoigianketthuc'],
				testdue: row['Thoigiantraketqua'],
				expried: row['KetThuc'],
				createon: row['KhoiTao'],
				updateon: row['CapNhat']
			}
			var d = new Date(test.endtime);
			if(d.getTime() - new Date().getTime() < 0) {
				test.expried = '1';
			}
			schedules.push(test);
		});		
		schestream.on("close", () => {
			var sches = userschedule.split(',').map(function(item) {
				return parseInt(item, 10);
			});
			const userschedules = schedules.filter(x => x.userid == userid && x.expried == '0')
			sches.forEach(element => {
				const testid = element;
				const test = tests.find(test => test.testid == testid);
				const waittest = schedules.filter(test => test.testid == testid && test.expried == '0');
				if(waittest.length > 0) {
					waittest.sort((a, b) => {
						const date1 = new Date(a.starttime);
						const date2 = new Date(b.starttime);
						if (date1 < date2) {
							return -1;
						}
						if (date1 > date2) {
							return 1;
						}
						return 0;
					});
					let found = false;
					for (var i = 0; i < waittest.length - 1; i++) {
						const date1 = new Date(waittest[i + 1].starttime);
						const date2 = new Date(waittest[i].endtime);
						if(date1.getTime() - date2.getTime() > test.testtime * 60000) {
							found = true;
							d2 = new Date (date2);
							d2.setMinutes(date2.getMinutes() + test.testtime);
							d3 = new Date (date2);
							d3.setMinutes(date2.getMinutes() + test.testdue);
							const schedule = {
								testid: testid,
								userid: userid,
								starttime: waittest[i].endtime,
								endtime: d2,
								testdue: d3,
								expried: 0,
								valid: true,
								createon: new Date(),
								updateon: ''
							}
							userschedules.push(schedule);
							break;
						}
					}
					if(!found) {
						const lasttest = waittest[waittest.length - 1];
						userschedules.push(createSchedule(lasttest.endtime, test, userid));
					}
				}
				else {
					if(userschedules.length > 0) {
						userschedules.sort((a, b) => {
							const date1 = new Date(a.starttime);
							const date2 = new Date(b.starttime);
							if (date1 < date2) {
								return -1;
							}
							if (date1 > date2) {
								return 1;
							}
							return 0;
						});
						const lasttest = userschedules[userschedules.length - 1];
						userschedules.push(createSchedule(lasttest.endtime, test, userid));
					}
					else {
						var d = new Date();
						d.setSeconds(0,0);
						userschedules.push(createSchedule(d, test, userid));
					}
				}
			});
			if(userschedules.length > 0) {
				userschedules.sort((a, b) => {
					const date1 = new Date(a.starttime);
					const date2 = new Date(b.starttime);
					if (date1 < date2) {
						return -1;
					}
					if (date1 > date2) {
						return 1;
					}
					return 0;
				});
				for (var i = 0; i < userschedules.length - 1; i++) {
					const test = tests.find(test => test.testid == userschedules[i].testid);
					const date1 = new Date(userschedules[i + 1].starttime);
					const date2 = new Date(userschedules[i].endtime);
					if(date1.getTime() - date2.getTime() < test.testtime * 60000) {
						userschedules[i].valid = false;
					}
				}
				const failed = userschedules.filter(test => test.valid == false);
				const success = userschedules.filter(test => test.valid == true);
				failed.forEach(item => {
					const lasttime = success[success.length - 1].endtime;
					const testid = item.testid;
					const test = tests.find(test => test.testid == testid);
					const waittest = schedules.filter(test => test.testid == testid && test.expried == '0');
					waittest.sort((a, b) => {
						const date1 = new Date(a.starttime);
						const date2 = new Date(b.starttime);
						if (date1 < date2) {
							return -1;
						}
						if (date1 > date2) {
							return 1;
						}
						return 0;
					});
					let found = false;
					for (var i = 0; i < waittest.length - 1; i++) {
						const date1 = new Date(waittest[i + 1].starttime);
						const date2 = new Date(waittest[i].endtime);
						if((date1.getTime() - date2.getTime() > test.testtime * 60000) && (date1.getTime() - lasttime.getTime() > 0)) {
							found = true;
							success.push(createSchedule(date2, test, userid));
							break;
						}
					}
					if(!found) {
						const lasttest = waittest[waittest.length - 1];
						const date2 = new Date(lasttest.endtime);
						if(lasttime.getTime() - date2.getTime() <= 0){
							success.push(createSchedule(date2, test));
						}
						else {
							success.push(createSchedule(lasttime, test, userid));
						}
					}
				});
				schedules = schedules.concat(success);
				fs.writeFile(schedulefile, extractAsScheduleCSV(schedules), err => {
					if (err) {
						console.log('Error writing to csv file', err);
					} else {
						console.log(`saved as ${schedulefile}`);
					}
				});
				res.send(JSON.stringify(success));
			}
			else {
				res.send('Invalid List Test Id');
			}
		});
	});
})

app.get('/enduserschedule', (req, res, next) => {
	const userid = req.query.userid;
	const testid = req.query.testid;
	const stream = fs.createReadStream(schedulefile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	const schedules = [];
	stream.on("data", function (row) {
		// 👇 split a row string into an array
		// then push into the data array
		const sche = {
			testid: row['TestID'],
			userid: row['UserID'],
			starttime: row['Thoigianbatdau'],
			endtime: row['Thoigianketthuc'],
			testdue: row['Thoigiantraketqua'],
			expried: row['KetThuc'],
			createon: row['KhoiTao'],
			updateon: row['CapNhat']
		}
		schedules.push(sche);
	});
	stream.on("close", () => {
		const userschedules = schedules.filter(test => test.testid == testid && test.userid == userid && test.expried == '0');
		if(userschedules.length > 0) {
			schedules.forEach(test => {
				if(test.testid == testid && test.userid == userid && test.expried == '0') {
					test.expried = '1';
					test.updateon = new Date();
				}
			});
			fs.writeFile(schedulefile, extractAsScheduleCSV(schedules), err => {
				if (err) {
					console.log('Error writing to csv file', err);
				} else {
					console.log(`saved as ${schedulefile}`);
				}
			});
			res.send("Success");
		}
		else {
			res.send("Invalid UserID or TestID");
		}
	});
})

app.get('/getuserschedule', (req, res, next) => {
	const userid = req.query.userid;
	const testid = req.query.testid;
	const stream = fs.createReadStream(schedulefile).pipe(
		parse({
		  delimiter: ",",
		  columns: true,
		  ltrim: true,
		})
	);
	const schedules = [];
	stream.on("data", function (row) {
		// 👇 split a row string into an array
		// then push into the data array
		const sche = {
			testid: row['TestID'],
			userid: row['UserID'],
			starttime: row['Thoigianbatdau'],
			endtime: row['Thoigianketthuc'],
			testdue: row['Thoigiantraketqua'],
			expried: row['KetThuc'],
			createon: row['KhoiTao'],
			updateon: row['CapNhat']
		}
		schedules.push(sche);
	});
	stream.on("close", () => {
		const userschedules = schedules.filter(test => test.testid == testid && test.userid == userid);
		if(userschedules.length > 0) {
			res.send(JSON.stringify(userschedules));
		}
		else {
			res.send("Invalid UserID or TestID");
		}
	});
})


app.get("/getuserschedule", (req, res, next) => {
  const userid = req.query.userid;
  const stream = fs.createReadStream(schedulefile).pipe(
    parse({
      delimiter: ",",
      columns: true,
      ltrim: true,
    })
  );
  const schedules = [];
  stream.on("data", function (row) {
    const sche = {
      userid: row["UserID"],
      starttime: row["Thoigianbatdau"],
      endtime: row["Thoigianketthuc"],
      testdue: row["Thoigiantraketqua"],
      expried: row["KetThuc"],
      createon: row["KhoiTao"],
      updateon: row["CapNhat"],
    };
    schedules.push(sche);
  });
  stream.on("close", () => {
    const userschedules = schedules.filter((test) => test.userid == userid);
    if (userschedules.length > 0) {
      res.send(JSON.stringify(userschedules));
    } else {
      res.send("Invalid UserID");
    }
  });
});

// Require the Routes API
// Create a Server and run it on the port 3000
const server = app.listen(3000, function () {
	let host = server.address().address
	let port = server.address().port
	// Starting the Server at the port 3000
})
