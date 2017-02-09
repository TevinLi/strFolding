/**
 * string-folding.js
 * @version 0.0.3
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

    //预转换
    SF.prototype._preTransition = function () {
        //如果存在替换符相同格式的字符，直接入字典并替换
        var list = this._data.result.match(/[\u0100-\u01bf][0-9A-Za-z]/g);
        if (!list) {
            return;
        }
        var library = {},
            num;
        for (var i = 0, item; item = list[i]; i++) {
            if (typeof library[item] == 'undefined') {
                library[item] = 1;
                num = this._data.list.push(item);
                this._replaceResult(item, num - 1);
            }
        }
    };

    //基于热度分析字典处理重复词
    SF.prototype._heatChineseWords = function () {
        var list = this._extChinese();
        //console.log(list);
        if (!list) {
            return;
        }
        //提取样本与单字
        var charsData = this._extChineseChar(list);
        //样本文
        var content = charsData.list2.join(',');
        //提取两字词根
        var wordsLv2 = [];
        for (var i = 0, char; char = charsData.chars[i]; i++) {
            wordsLv2 = wordsLv2.concat(this._findCharRight(content, char.key));
        }
        i = char = charsData = list = null;
        //console.log(wordsLv2);
        //提取多字词根
        var wordsData = {};
        wordsData.wordsLv3 = this._mergeEtyma(wordsLv2, wordsLv2, content);
        wordsData.wordsLv4 = this._mergeEtyma(wordsData.wordsLv3, wordsLv2, content);
        wordsData.wordsLv5 = this._mergeEtyma(wordsData.wordsLv4, wordsLv2, content);
        wordsData.wordsLv6 = this._mergeEtyma(wordsData.wordsLv5, wordsLv2, content);
        wordsData.wordsLv7 = this._mergeEtyma(wordsData.wordsLv6, wordsLv2, content);
        wordsData.wordsLv8 = this._mergeEtyma(wordsData.wordsLv7, wordsLv2, content);
        wordsLv2 = content = null;
        //词根包容计算
        var wordsTemp = this._charContains(wordsData.wordsLv3, wordsData.wordsLv4);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv5);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv6);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv7);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv8);
        wordsTemp.sort(function (a, b) {
            return a.key.length > b.key.length ? -1 : 1;
        });
        console.log(JSON.stringify(wordsTemp));
        //处理
        for (var j = 0, item, num; item = wordsTemp[j]; j++) {
            num = this._data.list.push(item.key) - 1;
            this._replaceResult(item.key, num);
        }
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
        //至少3位汉字，最多35个，记一个汉字段
        var list = this._data.result.match(new RegExp('[' + extStr + ']{3,35}', 'g'));
        if (!list || list.length <= 9) {
            return null;
        }
        return list;
    };

    //列队抽样，拆离成汉字单字列队
    SF.prototype._extChineseChar = function (list) {
        var library = {},
            list2 = [];
        //小于50的列队全部汉字段组成新列队
        if (list.length < 50) {
            list2 = list.concat(list2);
        }
        //大于50的列队按一定量平均抽取汉字段组成新列队
        else {
            //需要抽取的长度
            var newLong = parseInt(Math.pow(list.length - 50, .8) + 50);
            var dta = list.length / newLong;
            //跳跃式抽取
            for (var i = 0; i < newLong; i++) {
                list2.push(list[Math.round(i * dta)]);
            }
            newLong = dta = i = null;
        }
        //提取所有单字，并累计次数
        for (var j = 0, item; item = list2[j]; j++) {
            for (var k = 0, char; char = item.substr(k, 1); k++) {
                if (typeof library[char] == 'undefined') {
                    library[char] = 1;
                } else {
                    library[char]++;
                }
            }
        }
        list = j = item = k = char = null;
        var list3 = [];
        //单字转列表
        for (var p in library) {
            if (library.hasOwnProperty(p) && library[p] > 1) {
                list3.push({
                    key: p,
                    num: library[p]
                });
            }
        }
        //单字列表排序
        list3.sort(function (a, b) {
            return a.num > b.num ? -1 : 1;
        });
        //去除四分之一低重复字
        list3 = list3.slice(0, parseInt(list3.length * 3 / 4));
        //console.log(list3);
        return {
            list2: list2,
            chars: list3
        };
    };

    //单字右边配字查找
    SF.prototype._findCharRight = function (content, char) {
        var rights = {};
        var wordsList = [];
        content.replace(new RegExp(char + '([\u4e00-\u9fa5])', 'g'), function (m, s1) {
            if (typeof rights[s1] == 'undefined') {
                rights[s1] = 1;
            } else {
                rights[s1]++;
            }
            return m;
        });
        //拼装两字为字符串，删除数量过少的
        for (var p in rights) {
            if (rights.hasOwnProperty(p)) {
                if (rights[p] >= 3) {
                    wordsList.push({
                        key: char + p,
                        num: rights[p]
                    });
                } else {
                    delete rights[p];
                }
            }
        }
        return wordsList;
    };

    //词根拼合
    SF.prototype._mergeEtyma = function (wordsList1, wordsList2, content) {
        var wordsListRes = [];
        if (wordsList1.length < 2) {
            return wordsListRes;
        }
        var tempKey = '', tempList = null;
        for (var i1 = 0, item1; item1 = wordsList1[i1]; i1++) {
            for (var i2 = 0, item2; item2 = wordsList2[i2]; i2++) {
                if (item1.key.substr(-1, 1) == item2.key.substr(0, 1)) {
                    tempKey = item1.key + item2.key.substr(1);
                    tempList = content.match(new RegExp(tempKey, 'g'));
                    if (tempList && tempList.length >= 2) {
                        wordsListRes.push({
                            key: tempKey,
                            num: tempList.length
                        });
                    }
                }
            }
        }
        return wordsListRes;
    };

    //词根包容计算
    SF.prototype._charContains = function (wordsfrom, wordsLv) {
        var tempList = [],
            containsHas = false;
        //多字词对少字词包容计算
        for (var i = 0, item1; item1 = wordsfrom[i]; i++) {
            containsHas = false;
            for (var j = 0, item2; item2 = wordsLv[j]; j++) {
                //当多字词包含少字词
                if (item2.key.indexOf(item1.key) >= 0) {
                    //当少字词计数小于多字词计数，理论上不存在
                    //当两者计数相等，或少字词比多字词计数多1个，丢弃少字词
                    //当少字词计数比多字词多出2个以上，保留少字词
                    if (item1.num > item2.num + 1) {
                        tempList.unshift(item1);
                    }
                    containsHas = true;
                    break;
                }
            }
            //多字词不包含此少字词，保留三字词
            if (!containsHas) {
                tempList.push(item1);
            }
        }
        tempList = tempList.concat(wordsLv);
        return tempList;
    };

    //基于自然分段处理重复的字段
    SF.prototype._unDuplicateChinese = function () {
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

    //转换数字、字母
    SF.prototype._transDigitalLetter = function () {
        var that = this;
        //至少3位才匹配
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
            num = this._data.list.push(item);
            this._replaceResult(item, num - 1);
        }
        num = item = j = null;
    };

    //字母转数字，用于标记转序号
    SF.prototype._letterToNum = function (type, letter) {
        if (type == 1) {
            //数字仅转类型
            if (/[0-9]/.test(letter)) {
                return parseInt(letter);
            }
            //英文大写字母
            else if (/[A-Z]/.test(letter)) {
                return letter.charCodeAt(0) - 55;
            }
            //英文小写字母
            else if (/[a-z]/.test(letter)) {
                return letter.charCodeAt(0) - 61;
            }
        }
        //非英文字母
        else {
            return letter.charCodeAt(0) - 256;
        }
    };

    //标记转序号
    SF.prototype._codeToIndex = function (code) {
        if (code.length == 3) {
            code = code.substr(1);
        } else if (code.length != 2) {
            return -1;
        }
        var code1 = this._letterToNum(2, code.substr(0, 1));
        var code2 = this._letterToNum(1, code.substr(1, 1));
        //console.log(code1, code2);
        return code1 * 62 + code2;
    };

    //数字转字母，用于序号转标记
    SF.prototype._numToLetter = function (type, num) {
        if (type == 1) {
            // 0 ~ 9 仅转类型
            if (num <= 9) {
                return num + '';
            }
            // 10 ~ 35 转英文大写字母
            else if (num <= 35) {
                return String.fromCharCode(num + 55);
            }
            // 36 ~ 61 转英文小写字母
            else if (num <= 61) {
                return String.fromCharCode(num + 61);
            }
        }
        // 62 ~ 15747 转非英文的字母
        else if (type == 2) {
            return String.fromCharCode(num + 256);
        }
    };

    //序号转标记
    SF.prototype._indexToCode = function (index) {
        //限制序号范围 0 ~ 11903，超出不再计算
        if (index < 0 && index > 11903) {
            return '';
        }
        //转换为一个 2 字节和一个单字节的标记
        //其中，首位由拉丁等非英文的字母组成，次位由数字英文字母组成，次位可视为 62 进制
        var code1, code2;
        code2 = index % 62;
        code1 = this._numToLetter(2, (index - code2) / 62);
        code2 = this._numToLetter(1, code2);
        return code1 + code2;
    };

    //替换结果
    SF.prototype._replaceResult = function (str, num) {
        var code = this._indexToCode(num);
        this._data.result = this._data.result.replace(new RegExp(str, 'g'), function () {
            return code;
        });
    };

    //压缩数据统计
    SF.prototype._statistics = function (startTime, source, result) {
        var sLong = source/*.replace(/[^\u0000-\u00ff]/g, 'aa')*/.length;
        var rLong = result/*.replace(/[^\u0000-\u00ff]/g, 'aa')*/.length;
        console.log(sLong, rLong, (rLong / sLong * 100).toFixed(2) + '%', Date.now() - startTime + 'ms');
    };

    /**
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
        this._preTransition();
        this._heatChineseWords();
        this._unDuplicateChinese();
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