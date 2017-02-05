/**
 * string-folding.js
 * @version 0.0.1
 * @author Tevin
 */

;
(function (win) {

    'use strict';

    /* 特殊符号字典
     * ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿⡀
     * ⡁⡂⡃⡄⡅⡆⡇⡈⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀
     * ⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀
     * ⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿
     */

    var SF = function () {
        this._data = {
            list: [],
            source: '',
            result: ''
        };
    };

    /* 转换汉字 */
    SF.prototype._transChinese = function () {
        this._heatWords();
        this._unDuplicateFields();
    };

    //热度分析建字典处理重复文字
    SF.prototype._heatWords = function () {
        var list = this._extChinese();
        console.log(list);
    };

    //抽取汉字为列队
    SF.prototype._extChinese = function () {
        /**
         * 条件，排除以下汉字：
         * 与且之了以似在地得是的着而过
         * \u4e0e\u4e14\u4e4b\u4e86\u4ee5\u4f3c\u5728\u5730\u5f97\u662f\u7684\u7740\u800c\u8fc7
         */
        var extStr = '\u4e00-\u4e0d\u4e0f-\u4e13\u4e15-\u4e4a\u4e4c-\u4e85\u4e87-\u4ee4\u4ee6-' +
            '\u4f3b\u4f3d-\u5727\u5729-\u572f\u5731-\u5f96\u5f98-\u662e\u6630-\u7683\u7685-\u773f\u7741-' +
            '\u800b\u800d-\u8fc6\u8fc8-\u9fa5';
        var list = this._data.result.match(new RegExp('[' + extStr + ']{2,}', 'g')); //至少2位汉字
        if (!list || list.length <= 9) {
            return null;
        }
        return list;
    };

    //抽取

    //处理重复的字段
    SF.prototype._unDuplicateFields = function () {
        var that = this, i, item, library = {};
        var list = this._extChinese();
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
            this._replaceResult(item, num);
        }
        num = i = item = null;
    };

    /* 转换数字、字母 */
    SF.prototype._transDigitalLetter = function () {
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
            this._replaceResult(item, num);
        }
        num = item = j = null;
    };

    /* 工具 */

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
    SF.prototype._replaceResult = function (str, num) {
        var code = this._numToWordsLib(num);
        this._data.result = this._data.result.replace(new RegExp(str, 'g'), function () {
            return code;
        });
    };

    //压缩数据统计
    SF.prototype._statistics = function (startTime, source, result) {
        var sLong = source.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
        var rLong = result.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
        console.log(sLong, rLong, (rLong / sLong * 100).toFixed(2) + '%', Date.now() - startTime + 'ms');
    };

    /* 公共方法 */

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
        this._transChinese();
        this._transDigitalLetter();
        //拼装结果
        var result = this._data.result + '|||' + this._data.list.join(',');
        //统计效率
        this._statistics(startTime, source, result);
        //立即清理
        this._data.source = this._data.result = '';
        this._data.list.length = 0;
        //返回
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