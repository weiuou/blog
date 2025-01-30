# 基本数据结构类型
## String类型
可以是普通字符串、int、float
不超过512M
### 常用命令
- `SET key value` 
- `GET key`
- `MSET k1 v1 k2 v2`
- `MGET k1 k2`
- `INCR key`
- `INCRBY key value`
- `INCRBYFLOAT key value(float)`
- `DECR(自减)`
## Hash类型
无序字典

|key|field|value|
|:-:|:-:|:---:|
|project:user:1|name|Jack|
|project:user:1|age|21|
|project:user:2|name|Rose|
|project:user:2|age|18|
### 常用命令
- `HSET key field value`:添加或修改hash中key的field的值
- `HGET key field`:获取一个hash中key的field的值
- `HMSET key field1 value1 field2 value2…`
- `HMGET key field1 field2 field3…`
- `HGETALL key`

## List类型
一个双端链表
### 常用命令
- `LPUSH key element`
- `LPOP key`
- `LRANGE key star end`
- `BLPOP、BRPOP`在没有元素时等待指定时间（阻塞操作）
## SET类型

### 常用命令
- `SADD key member`
- `SREM key member`
- `SCARD key`
- `SISMEMBER key member`
- `SMEMBERS `
- `SINTER key1 key2`
- `SDIFF key1 key2`

## SortedSet类型
可排序的Set集合，类似C++中set，根据sorce值对元素排序底层实现是一个跳表加哈希表
- 可排序
- 元素不重复
- 查询速度快

常用来做排行榜等功能
### 常见命令
- ZADD key score member
- ZREM key member
- ZSCORE key member
- ZRANK key member
- ZCARD key
- ZCOUNT key min max score值在min~max中的元素个数
- ZINCRBY key increment member
- ZRANGE key min max
- ZRANGEBYSCORE key min max
- ZDIFF
- ZINTER
- ZUNION