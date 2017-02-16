# strFolding.js
JS字符串“折叠”工具：压缩/解压一个字符串。compress and decompress a string with javascript.  

## 作用
strFoling.js 不是一个代码压缩工具，不会删除空格换行；它是一个压缩文本字符串的工具，尤其是能压缩中文，无需任何依赖能直接在浏览器上执行。

## 工作原理
strFoling.js 采用的是常规的字典算法来实现压缩，比如说：

    十五只狮子攻击大象，大象发怒反击，没想到最终被大象反败为胜

这个句子中，“大象”这一两字词出现了3次，strFoling.js 将找出大象这个词，并将文本替换为：

    十五只狮子攻击Ő，Ő发怒反击，没想到最终被Ő反败为胜||||||大象

## 如何使用

### api
应用 api 只有两个：

- .encode(string)  压缩一个字符串
- .decode(result)  解压一个压缩的字符串

```js
var string = '...需要压缩的字符串...'
var sf = new StrFolding();
var result = sf.encode(string);  //压缩
var restore = sf.decode(result); //解压
```

### 统计
如果需要统计，可以在创建时注册一个回调：
```js
var sf = new StrFolding({
    statistics: function(data) {
        console.log(data);
    }
});
```
统计的内容
```js
{
    //压缩还是解压
    "type": "compress",
    //基于 utf-8 的字节统计，汉字算三个字节
    "utf8": {
        "input": 561902,
        "output": 444835,
        "percent": "79.17%"
    },
    //基于 utf-16 的字节统计，汉字算一个字节
    "utf16": {
        "input": 217671,
        "output": 188497,
        "percent": "86.60%"
    },
    //提取字典数
    "libraryEn": 28,
    "libraryCn": 1381,
    //耗时
    "time": "783ms"
}
```
