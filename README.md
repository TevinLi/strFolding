# strFolding
JS字符串“折叠”工具：压缩/解压一个字符串。compress and decompress a string with javascript.  

## 使用 strFolding.js
```js
var string = '...需要压缩的字符串...'
var sf = new StrFolding();
var result = sf.encode(string);  //压缩
var restore = sf.decode(result); //解压
```