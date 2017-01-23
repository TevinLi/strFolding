/**
 * string-folding.js v0.0.1
 * @author Tevin
 */

;
(function (win) {

    'use strict';

    var SF = function () {
        this._data = {
            list: [],
            source: '',
            result: ''
        };
    };

    //字典
    SF.prototype._wordsLib = '⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿' +
        '⡀⡁⡂⡃⡄⡅⡆⡇⡈⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍' +
        '⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛' +
        '⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿';

    //标记转编号
    SF.prototype._wordsLibToNum = function (words) {
        if (words.length != 2) {
            return;
        }
        var code1 = words.substr(0, 1).charCodeAt() - 10241;
        var code2 = words.substr(1, 1).charCodeAt() - 10241;
        return code1 * 255 + code2;
    };

    //编号转标记
    SF.prototype._numToWordsLib = function (num) {
        if (num > 65024) {
            return;
        }
        var code2 = num % 255;
        var code1 = (num - code2) / 255;
        code2 = String.fromCharCode(code2 + 10241);
        code1 = String.fromCharCode(code1 + 10241);
        return code1 + code2;
    };

    //替换结果
    SF.prototype._replaceResult = function (reg, code) {
        this._data.result = this._data.result.replace(reg, function (m) {
            return code;
        });
    };

    //转换数字、字母
    SF.prototype._extDigitalLetter = function () {
        var that = this;
        //至少3位匹配才替换
        var list = this._data.result.match(/\d+\.\d+|[a-zA-Z0-9]{3,}/g);
        var library = {};
        //计算重复次数
        for (var i = 0, item; item = list[i]; i++) {
            if (typeof library['@' + item] == 'number') {
                library['@' + item]++;
            } else {
                library['@' + item] = 1;
            }
        }
        list.length = 0;
        //丢弃仅一次出现的词
        for (var lib in library) {
            if (library.hasOwnProperty(lib) && library[lib] > 1) {
                list.push(lib.substr(1));
            }
        }
        library = lib = i = item = null;
        //按从长到短排序
        list.sort(function (a, b) {
            return a.length > b.length ? -1 : 1;
        });
        //处理
        var num;
        for (var j = 0; item = list[j]; j++) {
            num = this._data.list.push(item) - 1;
            this._replaceResult(new RegExp(item, 'g'), this._numToWordsLib(num));
        }
        num = item = j = null;
    };

    //转换汉字，字段模式
    SF.prototype._extChineseFull = function () {
        var that = this, i, item;
        var list = [];
        var list2 = this._data.result.match(/[\u4e00-\u9fa5]{2,}/g); //至少2位汉字
        var list3;
        for (i = 0; item = list2[i]; i++) {
            list3 = item.split(/[\u7684\u5730\u5f97\u4e86\u7740\u8fc7\u5728\u662f\u4ee5\u800c\u4e14\u4f3c\u4e4b\u4e0e]/);
            for (var j = 0, item2; item2 = list3[j]; j++) {
                if (item2.length >= 2) {
                    list.push(item2);
                }
            }
        }
        list2 = list3 = i = item = j = item2 = null;
        console.log(list);
        var library = {};
        //计算重复次数
        for (i = 0; item = list[i]; i++) {
            if (typeof library[item] == 'number') {
                library[item]++;
            } else {
                library[item] = 1;
            }
        }
        list.length = 0;
        //丢弃仅一次出现的词
        for (var lib in library) {
            if (library.hasOwnProperty(lib) && library[lib] > 1) {
                list.push(lib);
            }
        }
        library = lib = i = item = null;
        //按从长到短排序
        list.sort(function (a, b) {
            return a.length > b.length ? -1 : 1;
        });
        //处理
        var num;
        for (i = 0; item = list[i]; i++) {
            num = this._data.list.push(item) - 1;
            this._replaceResult(new RegExp(item, 'g'), this._numToWordsLib(num));
        }
        num = i = item = null;
    };

    //转换汉字，限制字数模式
    SF.prototype._extChineseLimit = function () {
    };

    //统计
    SF.prototype._statistics = function (startTime, source, result) {
        var sLong = source.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
        var rLong = result.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
        console.log(sLong, rLong, parseInt(rLong / sLong * 100) + '%', Date.now() - startTime + 'ms');
    };

    /*
     * 编码
     * @param {string} source 需要编码的源码
     * @return {string} result 压缩的结果
     */
    SF.prototype.encode = function (source) {
        if (typeof source != 'string') {
            throw new Error('StrFolding: The parameter must be a string!');
        }
        var startTime = Date.now();
        this._data.source = this._data.result = source;
        this._data.list.length = 0;
        this._extDigitalLetter();
        this._extChineseFull();
        var result = this._data.result + '|||' + this._data.list.join(',');
        this._statistics(startTime, source, result);
        return result;
    };

    /**
     * 解码
     * @param {string} result 需要解码的结果
     * @return {string} source 还原的源码
     */
    SF.prototype.decode = function (result) {
        if (typeof result != 'string') {
            throw new Error('StrFolding: The parameter must be a string!');
        }
    };

    return win.StrFolding = SF;

})(window);