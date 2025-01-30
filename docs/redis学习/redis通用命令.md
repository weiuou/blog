# redis通用命令
- `KEYS` + `pattern`:查看符合模板的所有key
- `DEL` + `[key1, key2...]`:删除指定key(返回删除数量)
- `EXIST` + `key`:判断key是否存在
- `EXPIRE`:给一个key设置有效期，到期自动被删除
- `TTL`:查询key剩余存活时间