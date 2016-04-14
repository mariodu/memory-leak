'use strict';

const fs = require('fs');
const path = require('path');
const heapdump = require('heapdump');

// 模拟不会释放的内容，一直持有对象的引用
let neverRelease = [];
// 会释放的内容
let willRelease = [];
let usage = [];

// 模拟对象
class Foo {
	constructor() {
		this.id = (Math.random() + Date.now()).toString(36).substr(9);
	}
}

function generatorData() {
	let obj = new Foo();

	neverRelease.push(obj);
	willRelease.push(obj);

	// 简单操作对象
	doSomething(obj);
}

function doSomething(obj) {
	obj.used = true;
	// 用完清理数据
	cleanUpData(obj);
}

function cleanUpData(obj) {
	let index = willRelease.indexOf(obj);
	// 清除掉 willRelease 里对对象的引用
	// “忘了”清理 neverRelease 中的引用
	willRelease.splice(index, 1);
  // neverRelease.splice(index, 1);
	// 一个对象，并且没被释放
	// console.log(`[neverRelease] obj ${index} 是否使用过：${neverRelease[index].used}`);
}

function runtimeInfo() {
	// 手动触发 GC
	global.gc();

	// 输出内存占用
	let heapUsed = process.memoryUsage().heapUsed;
	usage.push(heapUsed);
	console.log(`堆占用 ${heapUsed} bytes.`);

	// 触发生成 heapdump 文件
	//heapdump.writeSnapshot(path.join(__dirname, `heapdump-${Date.now()}.heapsnapshot`));
	process.kill(process.pid, 'SIGUSR2');
}

// 5ms 生成一次数据
setInterval(generatorData, 5);
// 2s 清理一次并打出占用
setInterval(runtimeInfo, 2000);

process.on('SIGINT', function(){
  let data = JSON.stringify(usage);
  fs.writeFileSync("usage.json", data);
  process.exit();
});
