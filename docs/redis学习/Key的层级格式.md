# key的结构
redis的key允许有多个单词形成层级结构，多个单词之间用`:`隔开
例如`set project:user:2 '{"id":2,"age":18,"name":"Jack"}'`
定义了
- project
  - user
    - 2

这样的层级关系