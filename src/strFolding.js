/**
 * strFolding.js
 * @version 0.1.0
 * @author Tevin
 * @see {@link https://github.com/TevinLi/strFolding}
 * @license MIT - Released under the MIT license.
 */

;
(function (win) {

    'use strict';

    var SF = function (opt) {
        this._data = {
            listEN: [],
            listCN: [],
            source: '',
            result: ''
        };
        this._onEnd = opt.statistics || null;
    };

    //预转换
    SF.prototype._preTransition = function () {
        var listEN = this._data.result.match(/[\u0100-\u014f][0-9A-Za-z]/g);
        var listCN = this._data.result.match(/[\u014f-\u07e0]/g);
        //如果不存在替换符相同字符
        if (!listEN && !listCN) {
            return true;
        }
        //如果单字替换符相同字符过多，不再执行压缩
        if (listEN.length > 20 || listCN.length > 20) {
            return false;
        }
        //如果存在替换符相同格式的字符，直接入字典并替换
        var library = {},
            num;
        listEN = listEN.concat(listCN || []);
        for (var i = 0, item; item = listEN[i]; i++) {
            if (typeof library[item] == 'undefined') {
                library[item] = 1;
                num = this._data.list.push(item);
                this._replaceResult(item, num - 1, 'force');
            }
        }
        return true;
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
        //console.log(charsData);
        //样本文
        var content = charsData.list2.join(',');
        //console.log(content);
        //根据样文本提取两字词根
        var wordsLv2 = [];
        for (var i = 0, char; char = charsData.chars[i]; i++) {
            wordsLv2 = wordsLv2.concat(this._findCharRight(content, char.key));
        }
        i = char = charsData = list = null;
        //console.log(JSON.stringify(wordsLv2));
        //提取多字词根
        var wordsData = {
            wordsLv2: wordsLv2
        };
        wordsData.wordsLv3 = this._mergeEtyma(wordsData.wordsLv2, wordsLv2, content);
        wordsData.wordsLv4 = this._mergeEtyma(wordsData.wordsLv3, wordsLv2, content);
        wordsData.wordsLv5 = this._mergeEtyma(wordsData.wordsLv4, wordsLv2, content);
        wordsData.wordsLv6 = this._mergeEtyma(wordsData.wordsLv5, wordsLv2, content);
        wordsData.wordsLv7 = this._mergeEtyma(wordsData.wordsLv6, wordsLv2, content);
        wordsData.wordsLv8 = this._mergeEtyma(wordsData.wordsLv7, wordsLv2, content);
        //console.log(JSON.stringify(wordsData));
        //console.log(JSON.stringify(duplicates));
        //词根包容计算
        var wordsTemp = this._charContains(wordsLv2, wordsData.wordsLv3);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv4);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv5);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv6);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv7);
        wordsTemp = this._charContains(wordsTemp, wordsData.wordsLv8);
        //得分排序
        wordsTemp.sort(function (a, b) {
            var aScore = a.key.length * a.num - a.num - a.key.length - 1;
            var bScore = b.key.length * b.num - b.num - b.key.length - 1;
            return aScore > bScore ? -1 : 1;
        });
        //序号范围约束
        var wordsRange = parseInt(1713 * .6);
        if (wordsTemp.length > wordsRange) {
            wordsTemp.length = wordsRange;
        }
        //按长度重新排序
        wordsTemp.sort(function (a, b) {
            return a.key.length > b.key.length ? -1 : 1;
        });
        //console.log(JSON.stringify(wordsTemp).replace(/\},/g, '},\n'), wordsTemp.length);
        //处理
        for (var j = 0, item, num; item = wordsTemp[j]; j++) {
            //console.log(item.key);
            num = this._data.listCN.push(item.key) - 1;
            this._replaceResult(item.key, num, 'single') || this._data.listCN.pop();
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
        //至少2位汉字，最多35个，记一个汉字段
        return this._data.result.match(new RegExp('[' + extStr + ']{2,35}', 'g'));
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
            var newLong = parseInt(Math.pow(list.length - 50, .82) + 50);
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
        //console.log(JSON.stringify(list3));
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
            containsHas = false,
            item1Reg = null;
        //多字词对少字词包容计算
        for (var i = 0, item1; item1 = wordsfrom[i]; i++) {
            containsHas = false;
            item1Reg = new RegExp(item1);
            for (var j = 0, item2; item2 = wordsLv[j]; j++) {
                //当多字词包含少字词
                if (item2.key.indexOf(item1.key) >= 0) {
                    containsHas = true;
                    //当少字词计数小于多字词计数，理论上不存在
                    //当两者计数相等，或少字词比多字词计数多1个，丢弃少字词
                    //当少字词计数比多字词多出2个以上，保留少字词
                    if (item1.num > item2.num + 1) {
                        tempList.unshift(item1);
                        break;
                        //console.log(item1, item2);
                    }
                }
            }
            //多字词不包含此少字词，保留少字词
            if (!containsHas) {
                tempList.push(item1);
                //console.log(item1);
            }
        }
        tempList = tempList.concat(wordsLv);
        //console.log(JSON.stringify(tempList));
        return tempList;
    };

    //基于非汉字分段处理重复的字段
    SF.prototype._unDuplicateChinese = function () {
        var that = this, i, item, library = {}, lib, list2C = [];
        var list = this._extChinese();
        if (!list) {
            return;
        }
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
        for (lib in library) {
            if (library.hasOwnProperty(lib) && library[lib] > 1) {
                if (lib.length > 2) {
                    list.push({
                        key: lib,
                        num: library[lib]
                    });
                }
            }
        }
        library = lib = i = item = null;
        //按得分排序
        list.sort(function (a, b) {
            var aScore = a.key.length * a.num - a.num - a.key.length - 1;
            var bScore = b.key.length * b.num - b.num - b.key.length - 1;
            return aScore > bScore ? -1 : 1;
        });
        var wordsRange = 1713 - this._data.listCN.length;
        if (list.length > wordsRange) {
            list.length = wordsRange;
        }
        //多字列表按从长到短排序
        list.sort(function (a, b) {
            return a.key.length > b.key.length ? -1 : 1;
        });
        //处理
        var num;
        for (i = 0; item = list[i]; i++) {
            num = this._data.listCN.push(item.key) - 1;
            this._replaceResult(item.key, num, 'single') || this._data.listCN.pop();
        }
        //console.log(this._data.lib2C);
    };

    //转换数字、字母
    SF.prototype._transDigitalLetter = function () {
        var that = this;
        //至少3位才匹配
        var list = this._data.result.match(/\d+\.\d+|[a-zA-Z0-9]{3,}/g);
        if (!list) {
            return
        }
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
            num = this._data.listEN.push(item) - 1;
            this._replaceResult(item, num) || this._data.listEN.pop();
        }
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
    SF.prototype._indexToCode = function (index, type) {
        if (type == 'single') {
            if (index < 0 && index > 1713) {
                return '';
            }
            return String.fromCharCode(index + 336);
        } else {
            //限制序号范围，超出不再计算
            if (index < 0 && index > 4959) {
                return '';
            }
            //转换为一个 2 字节和一个单字节的标记
            //其中，首位由拉丁等非英文的字母组成，次位由数字英文字母组成，次位可视为 62 进制
            var code1, code2;
            code2 = index % 62;
            code1 = this._numToLetter(2, (index - code2) / 62);
            code2 = this._numToLetter(1, code2);
            return code1 + code2;
        }
    };

    //替换结果
    SF.prototype._replaceResult = function (str, num, type) {
        var code;
        //双字与多字走不同转换
        if (type == 'single') {
            code = this._indexToCode(num, 'single');
        } else {
            code = this._indexToCode(num);
        }
        //console.log(str, code, num);
        //如果未产生替换符，不工作
        if (!code) {
            return false;
        }
        //替换
        var count = 0;
        var result = this._data.result.replace(new RegExp(str, 'g'), function () {
            count++;
            return code;
        });
        //强制执行
        if (type = 'force') {
            this._data.result = result;
            return true;
        }
        //只有当 字符长度超过3个 或者 重复次数超过3次 的词，才真正替换
        if (count >= 2 && (str.length >= 3 || count >= 3)) {
            this._data.result = result;
            return true;
        } else {
            console.log(str);
        }
        return false;
    };

    //还原
    SF.prototype._restoreResult = function (num, type) {
        var that = this, code;
        if (type == 'single') {
            code = this._indexToCode(num, 'single');
            //console.log(num, code, that._data.listCN[num]);
            this._data.result = this._data.result.replace(new RegExp(code, 'g'), function () {
                if (that._data.listCN[num] == '一笑很倾城') {
                }
                return that._data.listCN[num];
            });
        } else {
            code = this._indexToCode(num);
            this._data.result = this._data.result.replace(new RegExp(code, 'g'), function () {
                return that._data.listEN[num];
            });
        }
    };

    //压缩数据统计
    SF.prototype._statistics = function (startTime, start, end, type) {
        // utf8 字符长度计算
        var byteLengthUtf8 = function (string) {
            var byteLen = 0,
                len = string.length,
                temp;
            for (var i = 0; i < len; i++) {
                temp = string.charCodeAt(i);
                if (temp > 2047) {
                    byteLen += 3;
                } else if (temp > 128) {
                    byteLen += 2;
                } else {
                    byteLen++;
                }
            }
            return byteLen;
        };
        var sLong = byteLengthUtf8(start);
        var eLong = byteLengthUtf8(end);
        return {
            type: type,
            //基于 utf-8 的字节统计，汉字算三个字节
            utf8: {
                input: sLong,
                output: eLong,
                percent: (eLong / sLong * 100).toFixed(2) + '%'
            },
            //基于 utf-16 的字节统计，汉字算一个字节
            utf16: {
                input: start.length,
                output: end.length,
                percent: (end.length / start.length * 100).toFixed(2) + '%'
            },
            //提取字典数
            libraryEn: this._data.listEN.length,
            libraryCn: this._data.listCN.length,
            //耗时
            time: Date.now() - startTime + 'ms'
        };
    };

    /**
     * 编码
     * @param {string} source 需要编码的源码
     * @return {string} result 压缩的结果
     */
    SF.prototype.encode = function (source) {
        if (typeof source != 'string') {
            throw new Error('StrFolding.js: 输入必须为字符串！');
        }
        var startTime = Date.now();
        this._data.source = this._data.result = source;
        if (this._preTransition()) {
            this._heatChineseWords();
            this._unDuplicateChinese();
            this._transDigitalLetter();
        } else {
            throw new Error('StrFolding.js: 太多的非英文字母！本压缩工具仅针对中英文文本使用。');
        }
        //拼装结果
        var result = this._data.result + '|||' + this._data.listEN.join(',') + '|||' + this._data.listCN.join(',');
        //统计效率
        this._onEnd && this._onEnd(this._statistics(startTime, source, result, 'compress'));
        //立即清理
        this._data.source = this._data.result = '';
        this._data.listEN.length = this._data.listCN.length = 0;
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
            throw new Error('StrFolding: 输入必须为字符串！');
        }
        var that = this;
        var startTime = Date.now();
        result = result.replace(/\|{3}([\u4e00-\u9fa5]{2,},?)*$/, function (m) {
            that._data.listCN = m.replace('|||', '').split(',');
            return '';
        });
        result = result.replace(/\|{3}(\d+\.\d+|[a-zA-Z0-9]{3,},?)*$/, function (m) {
            that._data.listEN = m.replace('|||', '').split(',');
            return '';
        });
        this._data.result = result;
        for (var i = this._data.listCN.length - 1; i >= 0; i--) {
            this._restoreResult(i, 'single');
        }
        for (var j = this._data.listEN.length - 1; j >= 0; j--) {
            this._restoreResult(j);
        }
        //console.log(this._data.listCN.length, this._data.listEN.length, this._data.listEN.join(','), this._data.listCN.join(','));

        //统计效率
        this._onEnd && this._onEnd(this._statistics(startTime, result, this._data.result, 'deCompress'));
        //立即清理
        var re = this._data.result;
        this._data.source = this._data.result = '';
        this._data.listEN.length = this._data.listCN.length = 0;
        //返回
        return re;
    };

    return win.StrFolding = SF;

})(window);